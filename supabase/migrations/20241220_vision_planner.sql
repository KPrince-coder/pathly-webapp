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
    status TEXT DEFAULT 'Not Started' CHECK (status IN ('Not Started', 'In Progress', 'Completed', 'On Hold')),
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

-- Create vision_reviews table
CREATE TABLE IF NOT EXISTS public.vision_reviews (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vision_goal_id UUID REFERENCES public.vision_goals(id) ON DELETE CASCADE,
    review_date DATE DEFAULT CURRENT_DATE,
    period TEXT CHECK (period IN ('quarterly', 'annual')),
    achievements TEXT[],
    challenges TEXT[],
    adjustments TEXT[],
    next_steps TEXT[],
    confidence_level INTEGER CHECK (confidence_level >= 0 AND confidence_level <= 10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vision_reminders table
CREATE TABLE IF NOT EXISTS public.vision_reminders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    vision_goal_id UUID REFERENCES public.vision_goals(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT,
    reminder_date TIMESTAMP WITH TIME ZONE NOT NULL,
    frequency TEXT CHECK (frequency IN ('once', 'daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    is_active BOOLEAN DEFAULT true,
    last_sent TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vision_board table
CREATE TABLE IF NOT EXISTS public.vision_board (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_vision_goals_user_id ON public.vision_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_milestones_goal_id ON public.vision_milestones(vision_goal_id);
CREATE INDEX IF NOT EXISTS idx_vision_tasks_milestone_id ON public.vision_tasks(milestone_id);
CREATE INDEX IF NOT EXISTS idx_vision_reflections_goal_id ON public.vision_reflections(vision_goal_id);
CREATE INDEX IF NOT EXISTS idx_vision_reviews_goal_id ON public.vision_reviews(vision_goal_id);
CREATE INDEX IF NOT EXISTS idx_vision_reminders_user_id ON public.vision_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_vision_reminders_date ON public.vision_reminders(reminder_date) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vision_board_user_id ON public.vision_board(user_id);

-- Add RLS policies
ALTER TABLE public.vision_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_reflections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_mentorship ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vision_board ENABLE ROW LEVEL SECURITY;

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

-- Similar policies for milestones
CREATE POLICY "Users can view milestones of their goals"
    ON public.vision_milestones FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vision_goals
        WHERE vision_goals.id = vision_milestones.vision_goal_id
        AND vision_goals.user_id = auth.uid()
    ));

-- Similar policies for tasks
CREATE POLICY "Users can view tasks of their milestones"
    ON public.vision_tasks FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vision_milestones
        JOIN public.vision_goals ON vision_goals.id = vision_milestones.vision_goal_id
        WHERE vision_milestones.id = vision_tasks.milestone_id
        AND vision_goals.user_id = auth.uid()
    ));

-- Similar policies for reflections
CREATE POLICY "Users can view reflections of their goals"
    ON public.vision_reflections FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vision_goals
        WHERE vision_goals.id = vision_reflections.vision_goal_id
        AND vision_goals.user_id = auth.uid()
    ));

-- Similar policies for reviews
CREATE POLICY "Users can view reviews of their goals"
    ON public.vision_reviews FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.vision_goals
        WHERE vision_goals.id = vision_reviews.vision_goal_id
        AND vision_goals.user_id = auth.uid()
    ));

-- Similar policies for reminders
CREATE POLICY "Users can view their own reminders"
    ON public.vision_reminders FOR SELECT
    USING (auth.uid() = user_id);

-- Similar policies for vision board
CREATE POLICY "Users can view their own vision board"
    ON public.vision_board FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own vision board"
    ON public.vision_board FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own vision board"
    ON public.vision_board FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own vision board"
    ON public.vision_board FOR DELETE
    USING (auth.uid() = user_id);

-- Storage policies for vision board media
CREATE POLICY "Users can upload vision board media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'media' AND path LIKE 'vision-board/%');

CREATE POLICY "Users can view vision board media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'media' AND path LIKE 'vision-board/%');

-- Create storage bucket for vision board media
INSERT INTO storage.buckets (id, name)
VALUES ('media', 'Media Storage')
ON CONFLICT DO NOTHING;