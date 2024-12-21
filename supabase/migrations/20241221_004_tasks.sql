-- Enums for Tasks
CREATE TYPE task_status AS ENUM (
    'todo', 'in_progress', 'completed', 'blocked', 'cancelled'
);

CREATE TYPE task_priority AS ENUM (
    'low', 'medium', 'high', 'urgent'
);

-- Tasks
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status task_status DEFAULT 'todo',
    priority task_priority DEFAULT 'medium',
    category TEXT,
    estimated_duration INTEGER, -- in minutes
    actual_duration INTEGER,
    deadline TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES profiles(id),
    assigned_to UUID REFERENCES profiles(id),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    tags TEXT[],
    notes TEXT[],
    focus_time JSONB -- {pomodorosCompleted, totalFocusTime}
);

-- Task Dependencies
CREATE TABLE task_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    depends_on_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    dependency_type TEXT CHECK (dependency_type IN ('blocks', 'required', 'optional')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT different_tasks CHECK (task_id != depends_on_task_id)
);

-- Task Time Blocks
CREATE TABLE time_blocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id),
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    is_focus_time BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Task Recurrence
CREATE TABLE task_recurrence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    pattern TEXT CHECK (pattern IN ('daily', 'weekly', 'monthly', 'custom')),
    interval INTEGER DEFAULT 1,
    weekdays INTEGER[], -- Array of days (1-7, where 1 is Monday)
    month_day INTEGER CHECK (month_day BETWEEN 1 AND 31),
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_recurrence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Users can view assigned or workspace tasks"
    ON tasks FOR SELECT
    USING (
        auth.uid() IN (created_by, assigned_to)
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = tasks.workspace_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks in their workspaces"
    ON tasks FOR INSERT
    WITH CHECK (
        auth.uid() = created_by
        AND (
            workspace_id IS NULL
            OR EXISTS (
                SELECT 1 FROM workspace_members
                WHERE workspace_id = tasks.workspace_id
                AND user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Task creators and assignees can update tasks"
    ON tasks FOR UPDATE
    USING (
        auth.uid() IN (created_by, assigned_to)
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = tasks.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    )
    WITH CHECK (
        auth.uid() IN (created_by, assigned_to)
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = tasks.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Only creators and workspace admins can delete tasks"
    ON tasks FOR DELETE
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = tasks.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- RLS Policies for task_dependencies
CREATE POLICY "Users can view dependencies of accessible tasks"
    ON task_dependencies FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id IN (task_dependencies.task_id, task_dependencies.depends_on_task_id)
            AND (
                created_by = auth.uid()
                OR assigned_to = auth.uid()
                OR EXISTS (
                    SELECT 1 FROM workspace_members
                    WHERE workspace_id = tasks.workspace_id
                    AND user_id = auth.uid()
                )
            )
        )
    );

CREATE POLICY "Task creators can manage dependencies"
    ON task_dependencies FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_dependencies.task_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Task creators can update dependencies"
    ON task_dependencies FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_dependencies.task_id
            AND created_by = auth.uid()
        )
    );

CREATE POLICY "Task creators can delete dependencies"
    ON task_dependencies FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_dependencies.task_id
            AND created_by = auth.uid()
        )
    );

-- RLS Policies for time_blocks
CREATE POLICY "Users can view their own time blocks"
    ON time_blocks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own time blocks"
    ON time_blocks FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
            SELECT 1 FROM tasks
            WHERE id = time_blocks.task_id
            AND (
                created_by = auth.uid()
                OR assigned_to = auth.uid()
            )
        )
    );

CREATE POLICY "Users can update their own time blocks"
    ON time_blocks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own time blocks"
    ON time_blocks FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for task_recurrence
CREATE POLICY "Users can view recurrence for their tasks"
    ON task_recurrence FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_recurrence.task_id
            AND (created_by = auth.uid() OR assigned_to = auth.uid())
        )
    );

CREATE POLICY "Task creators can manage recurrence"
    ON task_recurrence FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_recurrence.task_id
            AND created_by = auth.uid()
        )
    );

-- Add security constraints
ALTER TABLE tasks
    ADD CONSTRAINT valid_task_title CHECK (length(title) >= 3),
    ADD CONSTRAINT valid_task_progress CHECK (progress BETWEEN 0 AND 100),
    ADD CONSTRAINT valid_task_duration CHECK (
        (estimated_duration IS NULL OR estimated_duration > 0)
        AND (actual_duration IS NULL OR actual_duration > 0)
    ),
    ADD CONSTRAINT valid_task_dates CHECK (
        (deadline IS NULL OR deadline > created_at)
        AND (completed_at IS NULL OR completed_at >= created_at)
    );

ALTER TABLE time_blocks
    ADD CONSTRAINT valid_time_block_duration CHECK (
        extract(epoch from (end_time - start_time))/60 >= 5
    );

ALTER TABLE task_recurrence
    ADD CONSTRAINT valid_recurrence_interval CHECK (interval > 0),
    ADD CONSTRAINT valid_month_day CHECK (
        month_day IS NULL 
        OR (month_day >= 1 AND month_day <= 31)
    ),
    ADD CONSTRAINT valid_weekdays CHECK (
        weekdays IS NULL 
        OR (
            array_length(weekdays, 1) > 0 
            AND array_length(weekdays, 1) <= 7
            AND NOT EXISTS (
                SELECT unnest(weekdays) day 
                WHERE day NOT BETWEEN 1 AND 7
            )
        )
    );
