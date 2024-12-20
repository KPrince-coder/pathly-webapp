-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create vision_goals table
CREATE TABLE IF NOT EXISTS public.vision_goals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL CHECK (category IN ('Career', 'Personal', 'Relationships', 'Financial', 'Health', 'Education', 'Other')),
    target_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT DEFAULT 'In Progress' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    is_smart_goal BOOLEAN DEFAULT false,
    specific_details JSONB,
    measurable_metrics JSONB,
    achievable_steps JSONB,
    relevant_reasons TEXT,
    time_bound_dates JSONB,
    inspiration_media JSONB DEFAULT '[]'::jsonb,
    reflection_notes TEXT[]
);

-- Create vision_milestones table
CREATE TABLE IF NOT EXISTS public.vision_milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vision_goal_id UUID REFERENCES public.vision_goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vision_tasks table
CREATE TABLE IF NOT EXISTS public.vision_tasks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    milestone_id UUID REFERENCES public.vision_milestones(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High')),
    status TEXT DEFAULT 'Todo' CHECK (status IN ('Todo', 'In Progress', 'Done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    recurring_pattern JSONB -- For recurring tasks/habits
);

-- Create vision_reflections table
CREATE TABLE IF NOT EXISTS public.vision_reflections (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vision_goal_id UUID REFERENCES public.vision_goals(id) ON DELETE CASCADE,
    reflection_date DATE DEFAULT CURRENT_DATE,
    content TEXT NOT NULL,
    mood TEXT CHECK (mood IN ('Positive', 'Neutral', 'Challenging')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vision_mentorship table
CREATE TABLE IF NOT EXISTS public.vision_mentorship (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    mentor_id UUID REFERENCES auth.users(id),
    mentee_id UUID REFERENCES auth.users(id),
    vision_goal_id UUID REFERENCES public.vision_goals(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Active', 'Completed', 'Declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(mentor_id, mentee_id, vision_goal_id)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vision_goals_user_id ON public.vision_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_milestones_goal_id ON public.vision_milestones(vision_goal_id);
CREATE INDEX IF NOT EXISTS idx_vision_tasks_milestone_id ON public.vision_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_vision_reflections_goal_id ON public.vision_reflections(vision_goal_id);

-- Add RLS policies
ALTER TABLE public.vision_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_mentorship ENABLE ROW LEVEL SECURITY;

-- Vision goals policies
CREATE POLICY "Users can view their own vision goals"
    ON public.vision_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision goals"
    ON public.vision_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision goals"
    ON public.vision_goals FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision goals"
    ON public.vision_goals FOR DELETE
    USING (auth.uid() = user_id);

-- Similar policies for other tables...
