-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.note_shares CASCADE;
DROP TABLE IF EXISTS public.note_versions CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.folders CASCADE;
DROP TABLE IF EXISTS public.folder_notes CASCADE;

-- Create auth schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS auth;

-- Create auth.users if it doesn't exist (this is usually created by Supabase automatically)
CREATE TABLE IF NOT EXISTS auth.users (
    id uuid NOT NULL PRIMARY KEY,
    email text,
    encrypted_password text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT DEFAULT '',
    avatar_type TEXT DEFAULT 'default' CHECK (avatar_type IN ('default', 'custom', 'generated')),
    avatar_url TEXT,
    avatar_seed TEXT,
    theme_preference JSONB DEFAULT '{"mode": "light", "color": "blue"}'::jsonb NOT NULL,
    privacy_settings JSONB DEFAULT '{"default_note_visibility": "private", "show_online_status": true}'::jsonb NOT NULL,
    notification_settings JSONB DEFAULT '{"email": true, "push": true}'::jsonb NOT NULL,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles (username);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON public.profiles (created_at);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Notes table with encryption and privacy features
CREATE TABLE IF NOT EXISTS public.notes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    encrypted_content TEXT, -- For encrypted notes
    is_encrypted BOOLEAN DEFAULT false,
    category TEXT,
    tags TEXT[],
    color TEXT,
    pinned BOOLEAN DEFAULT false,
    archived BOOLEAN DEFAULT false,
    privacy_level TEXT CHECK (privacy_level IN ('public', 'private', 'shared', 'password_protected')) DEFAULT 'private',
    password_hash TEXT, -- For password-protected notes
    version INTEGER DEFAULT 1,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note sharing and collaboration
CREATE TABLE IF NOT EXISTS public.note_shares (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES auth.users(id),
    shared_with UUID REFERENCES auth.users(id),
    permission_level TEXT CHECK (permission_level IN ('view', 'edit', 'admin')) DEFAULT 'view',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note versions for history
CREATE TABLE IF NOT EXISTS public.note_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    content TEXT,
    encrypted_content TEXT,
    version INTEGER,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tags management
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, name)
);

-- Folders for organization
CREATE TABLE IF NOT EXISTS public.folders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    name TEXT NOT NULL,
    parent_id UUID REFERENCES public.folders(id),
    icon TEXT,
    color TEXT,
    is_private BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Note-folder relationship
CREATE TABLE IF NOT EXISTS public.folder_notes (
    folder_id UUID REFERENCES public.folders(id) ON DELETE CASCADE,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (folder_id, note_id)
);

-- Enable Row Level Security
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.folder_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies
CREATE POLICY "Users can view their own notes"
    ON public.notes FOR SELECT
    USING (
        auth.uid() = user_id
        OR id IN (
            SELECT note_id FROM public.note_shares
            WHERE shared_with = auth.uid()
        )
        OR privacy_level = 'public'
    );

CREATE POLICY "Users can insert their own notes"
    ON public.notes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
    ON public.notes FOR UPDATE
    USING (
        auth.uid() = user_id
        OR id IN (
            SELECT note_id FROM public.note_shares
            WHERE shared_with = auth.uid()
            AND permission_level IN ('edit', 'admin')
        )
    );

CREATE POLICY "Users can delete their own notes"
    ON public.notes FOR DELETE
    USING (
        auth.uid() = user_id
        OR id IN (
            SELECT note_id FROM public.note_shares
            WHERE shared_with = auth.uid()
            AND permission_level = 'admin'
        )
    );

CREATE POLICY "Users can view shares of their notes"
    ON public.note_shares FOR SELECT
    USING (
        auth.uid() = shared_by
        OR auth.uid() = shared_with
    );

CREATE POLICY "Users can share their own notes"
    ON public.note_shares FOR INSERT
    WITH CHECK (
        auth.uid() = shared_by
        AND EXISTS (
            SELECT 1 FROM public.notes
            WHERE id = note_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update shares of their notes"
    ON public.note_shares FOR UPDATE
    USING (
        auth.uid() = shared_by
        AND EXISTS (
            SELECT 1 FROM public.notes
            WHERE id = note_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete shares of their notes"
    ON public.note_shares FOR DELETE
    USING (
        auth.uid() = shared_by
        OR auth.uid() = shared_with
    );

CREATE POLICY "Users can view their own tags"
    ON public.tags FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
    ON public.tags FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
    ON public.tags FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
    ON public.tags FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own folders"
    ON public.folders FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
    ON public.folders FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
    ON public.folders FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
    ON public.folders FOR DELETE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their folder notes"
    ON public.folder_notes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.folders
            WHERE id = folder_id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage their folder notes"
    ON public.folder_notes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.folders
            WHERE id = folder_id
            AND user_id = auth.uid()
        )
        AND EXISTS (
            SELECT 1 FROM public.notes
            WHERE id = note_id
            AND user_id = auth.uid()
        )
    );
