-- Enable pgcrypto for password hashing and encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Profiles table with enhanced features
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    username TEXT UNIQUE,
    display_name TEXT,
    bio TEXT,
    avatar_type TEXT CHECK (avatar_type IN ('default', 'custom', 'generated')),
    avatar_url TEXT,
    avatar_seed TEXT, -- For generating consistent random avatars
    theme_preference JSONB DEFAULT '{"mode": "light", "color": "blue"}',
    privacy_settings JSONB DEFAULT '{"default_note_visibility": "private", "show_online_status": true}',
    notification_settings JSONB DEFAULT '{"email": true, "push": true}',
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- Functions and Triggers

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_folders_updated_at
    BEFORE UPDATE ON public.folders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to handle note encryption
CREATE OR REPLACE FUNCTION encrypt_note_content()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_encrypted THEN
        -- Only encrypt if content has changed and note is marked as encrypted
        IF TG_OP = 'INSERT' OR OLD.content != NEW.content THEN
            -- Use pgcrypto to encrypt content
            NEW.encrypted_content = encode(encrypt(
                NEW.content::bytea,
                NEW.password_hash::bytea,
                'aes'
            ), 'base64');
            NEW.content = NULL; -- Clear plaintext content
        END IF;
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER encrypt_note_content_trigger
    BEFORE INSERT OR UPDATE ON public.notes
    FOR EACH ROW
    EXECUTE FUNCTION encrypt_note_content();

-- RLS Policies

-- Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Notes
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

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

-- Note shares
ALTER TABLE public.note_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their shared notes"
    ON public.note_shares FOR SELECT
    USING (
        auth.uid() = shared_by
        OR auth.uid() = shared_with
    );

CREATE POLICY "Users can share their own notes"
    ON public.note_shares FOR INSERT
    WITH CHECK (
        auth.uid() = shared_by
        AND note_id IN (
            SELECT id FROM public.notes
            WHERE user_id = auth.uid()
        )
    );

-- Folders
ALTER TABLE public.folders ENABLE ROW LEVEL SECURITY;

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
