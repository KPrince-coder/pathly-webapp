-- Enums for Vision Planner
CREATE TYPE vision_goal_category AS ENUM (
    'career', 'education', 'financial', 'health', 
    'personal', 'relationships', 'spiritual'
);

CREATE TYPE vision_goal_status AS ENUM (
    'not_started', 'in_progress', 'completed', 'on_hold', 'cancelled'
);

CREATE TYPE vision_milestone_status AS ENUM (
    'pending', 'in_progress', 'completed', 'delayed'
);

CREATE TYPE vision_task_status AS ENUM (
    'todo', 'in_progress', 'completed', 'blocked'
);

CREATE TYPE vision_task_priority AS ENUM (
    'low', 'medium', 'high', 'urgent'
);

CREATE TYPE vision_reflection_mood AS ENUM (
    'very_negative', 'negative', 'neutral', 'positive', 'very_positive'
);

-- Vision Goals
CREATE TABLE vision_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category vision_goal_category NOT NULL,
    target_date DATE,
    status vision_goal_status DEFAULT 'not_started',
    is_smart_goal BOOLEAN DEFAULT false,
    smart_details JSONB,
    inspiration_media JSONB[], -- Array of {type, url, caption}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vision Milestones
CREATE TABLE vision_milestones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vision_goal_id UUID REFERENCES vision_goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    progress INTEGER DEFAULT 0,
    status vision_milestone_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vision Tasks
CREATE TABLE vision_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    milestone_id UUID REFERENCES vision_milestones(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority vision_task_priority DEFAULT 'medium',
    status vision_task_status DEFAULT 'todo',
    recurring_pattern JSONB, -- {type, frequency, endDate}
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vision Reflections
CREATE TABLE vision_reflections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vision_goal_id UUID REFERENCES vision_goals(id) ON DELETE CASCADE,
    reflection_date DATE NOT NULL,
    content TEXT NOT NULL,
    mood vision_reflection_mood NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Vision Mentorship
CREATE TABLE vision_mentorships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mentor_id UUID REFERENCES profiles(id),
    mentee_id UUID REFERENCES profiles(id),
    vision_goal_id UUID REFERENCES vision_goals(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('pending', 'active', 'completed', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    CONSTRAINT different_users CHECK (mentor_id != mentee_id)
);

-- Enable RLS
ALTER TABLE vision_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE vision_mentorships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vision_goals
CREATE POLICY "Users can view their own vision goals"
    ON vision_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision goals"
    ON vision_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision goals"
    ON vision_goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision goals"
    ON vision_goals FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for vision_milestones
CREATE POLICY "Users can view milestones of their goals"
    ON vision_milestones FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_milestones.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create milestones for their goals"
    ON vision_milestones FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_milestones.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update milestones of their goals"
    ON vision_milestones FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_milestones.vision_goal_id
            AND user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_milestones.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete milestones of their goals"
    ON vision_milestones FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_milestones.vision_goal_id
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for vision_tasks
CREATE POLICY "Users can view tasks of their milestones"
    ON vision_tasks FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vision_milestones m
            JOIN vision_goals g ON m.vision_goal_id = g.id
            WHERE m.id = vision_tasks.milestone_id
            AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create tasks for their milestones"
    ON vision_tasks FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vision_milestones m
            JOIN vision_goals g ON m.vision_goal_id = g.id
            WHERE m.id = vision_tasks.milestone_id
            AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update tasks of their milestones"
    ON vision_tasks FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM vision_milestones m
            JOIN vision_goals g ON m.vision_goal_id = g.id
            WHERE m.id = vision_tasks.milestone_id
            AND g.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vision_milestones m
            JOIN vision_goals g ON m.vision_goal_id = g.id
            WHERE m.id = vision_tasks.milestone_id
            AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete tasks of their milestones"
    ON vision_tasks FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vision_milestones m
            JOIN vision_goals g ON m.vision_goal_id = g.id
            WHERE m.id = vision_tasks.milestone_id
            AND g.user_id = auth.uid()
        )
    );

-- RLS Policies for vision_reflections
CREATE POLICY "Users can view reflections of their goals"
    ON vision_reflections FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_reflections.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create reflections for their goals"
    ON vision_reflections FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_reflections.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can't update reflections"
    ON vision_reflections FOR UPDATE
    USING (false);

CREATE POLICY "Users can delete reflections of their goals"
    ON vision_reflections FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_reflections.vision_goal_id
            AND user_id = auth.uid()
        )
    );

-- RLS Policies for vision_mentorships
CREATE POLICY "Users can view mentorships they're part of"
    ON vision_mentorships FOR SELECT
    USING (auth.uid() IN (mentor_id, mentee_id));

CREATE POLICY "Mentees can create mentorship requests"
    ON vision_mentorships FOR INSERT
    WITH CHECK (
        auth.uid() = mentee_id
        AND EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_mentorships.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Both mentor and mentee can update mentorship status"
    ON vision_mentorships FOR UPDATE
    USING (
        auth.uid() IN (mentor_id, mentee_id)
        AND EXISTS (
            SELECT 1
            FROM vision_mentorships current
            WHERE current.id = vision_mentorships.id
            AND current.mentor_id = vision_mentorships.mentor_id
            AND current.mentee_id = vision_mentorships.mentee_id
            AND current.vision_goal_id = vision_mentorships.vision_goal_id
        )
    )
    WITH CHECK (
        auth.uid() IN (mentor_id, mentee_id)
        AND EXISTS (
            SELECT 1
            FROM vision_mentorships current
            WHERE current.id = vision_mentorships.id
            AND current.mentor_id = vision_mentorships.mentor_id
            AND current.mentee_id = vision_mentorships.mentee_id
            AND current.vision_goal_id = vision_mentorships.vision_goal_id
        )
    );

CREATE POLICY "Both mentor and mentee can end mentorship"
    ON vision_mentorships FOR DELETE
    USING (auth.uid() IN (mentor_id, mentee_id));

-- Add security constraints
ALTER TABLE vision_goals
    ADD CONSTRAINT valid_goal_title CHECK (length(title) >= 3),
    ADD CONSTRAINT valid_goal_dates CHECK (target_date >= created_at::date);

ALTER TABLE vision_milestones
    ADD CONSTRAINT valid_milestone_title CHECK (length(title) >= 3),
    ADD CONSTRAINT valid_milestone_progress CHECK (progress BETWEEN 0 AND 100),
    ADD CONSTRAINT valid_milestone_dates CHECK (target_date >= created_at::date);

ALTER TABLE vision_tasks
    ADD CONSTRAINT valid_task_title CHECK (length(title) >= 3),
    ADD CONSTRAINT valid_task_dates CHECK (due_date IS NULL OR due_date >= created_at::date);

ALTER TABLE vision_reflections
    ADD CONSTRAINT valid_reflection_content CHECK (length(content) >= 10);
