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

-- RLS Policies
CREATE POLICY "Users can view tasks they have access to"
    ON tasks FOR SELECT
    USING (
        auth.uid() IN (created_by, assigned_to)
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = tasks.workspace_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage tasks they created"
    ON tasks FOR ALL
    USING (
        auth.uid() = created_by
        OR EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = tasks.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

CREATE POLICY "Users can manage task dependencies they have access to"
    ON task_dependencies FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_dependencies.task_id
            AND (created_by = auth.uid() OR assigned_to = auth.uid())
        )
    );

CREATE POLICY "Users can manage their time blocks"
    ON time_blocks FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage task recurrence for their tasks"
    ON task_recurrence FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM tasks
            WHERE id = task_recurrence.task_id
            AND created_by = auth.uid()
        )
    );
