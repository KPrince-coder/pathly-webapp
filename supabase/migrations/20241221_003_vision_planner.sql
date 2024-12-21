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

-- RLS Policies
CREATE POLICY "Users can manage their own vision goals"
    ON vision_goals FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own milestones"
    ON vision_milestones FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_milestones.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own vision tasks"
    ON vision_tasks FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM vision_milestones m
            JOIN vision_goals g ON m.vision_goal_id = g.id
            WHERE m.id = vision_tasks.milestone_id
            AND g.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their own reflections"
    ON vision_reflections FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_reflections.vision_goal_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view mentorship relationships they're part of"
    ON vision_mentorships FOR SELECT
    USING (auth.uid() IN (mentor_id, mentee_id));

CREATE POLICY "Users can manage mentorships they created"
    ON vision_mentorships FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM vision_goals
            WHERE id = vision_mentorships.vision_goal_id
            AND user_id = auth.uid()
        )
    );
