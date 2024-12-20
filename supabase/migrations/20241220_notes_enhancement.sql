-- Add voice notes and media support to notes table
ALTER TABLE public.notes
ADD COLUMN media_files JSONB [] DEFAULT '{}',
    ADD COLUMN voice_note_url TEXT,
    ADD COLUMN color TEXT DEFAULT '#ffffff',
    ADD COLUMN voice_transcription TEXT,
    ADD COLUMN last_read_at TIMESTAMP WITH TIME ZONE;
-- Create password manager tables
CREATE TABLE public.password_vaults (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    color TEXT DEFAULT '#4f46e5',
    is_favorite BOOLEAN DEFAULT false,
    master_password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE TABLE public.password_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vault_id UUID REFERENCES public.password_vaults(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    username TEXT,
    email TEXT,
    encrypted_password TEXT NOT NULL,
    website_url TEXT,
    notes TEXT,
    icon TEXT,
    color TEXT,
    category TEXT,
    tags TEXT [],
    strength_score INTEGER,
    last_used_at TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    auto_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Password history for tracking changes
CREATE TABLE public.password_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    entry_id UUID REFERENCES public.password_entries(id) ON DELETE CASCADE,
    encrypted_password TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Note version history with media support
CREATE TABLE public.note_media_versions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE,
    media_files JSONB [],
    voice_note_url TEXT,
    version INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
-- Create profiles table if it doesn't exist
create table if not exists public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz,
    username text unique,
    full_name text,
    avatar_url text,
    preferences jsonb default '{}'::jsonb
);
-- Enable RLS
alter table public.profiles enable row level security;
-- Create profiles policies
create policy "Public profiles are viewable by everyone" on profiles for
select using (true);
create policy "Users can insert their own profile" on profiles for
insert with check (auth.uid() = id);
create policy "Users can update their own profile" on profiles for
update using (auth.uid() = id);
-- Set up storage
insert into storage.buckets (id, name)
values ('avatars', 'avatars') on conflict do nothing;
create policy "Avatar images are publicly accessible" on storage.objects for
select using (bucket_id = 'avatars');
create policy "Anyone can upload an avatar" on storage.objects for
insert with check (bucket_id = 'avatars');
-- RLS Policies for password manager
ALTER TABLE public.password_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_history ENABLE ROW LEVEL SECURITY;
-- Vault access policies
CREATE POLICY "Users can view their own vaults" ON public.password_vaults FOR
SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own vaults" ON public.password_vaults FOR
INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own vaults" ON public.password_vaults FOR
UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own vaults" ON public.password_vaults FOR DELETE USING (auth.uid() = user_id);
-- Password entries policies
CREATE POLICY "Users can view their own password entries" ON public.password_entries FOR
SELECT USING (
        vault_id IN (
            SELECT id
            FROM public.password_vaults
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can create password entries in their vaults" ON public.password_entries FOR
INSERT WITH CHECK (
        vault_id IN (
            SELECT id
            FROM public.password_vaults
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can update their own password entries" ON public.password_entries FOR
UPDATE USING (
        vault_id IN (
            SELECT id
            FROM public.password_vaults
            WHERE user_id = auth.uid()
        )
    ) WITH CHECK (
        vault_id IN (
            SELECT id
            FROM public.password_vaults
            WHERE user_id = auth.uid()
        )
    );
CREATE POLICY "Users can delete their own password entries" ON public.password_entries FOR DELETE USING (
    vault_id IN (
        SELECT id
        FROM public.password_vaults
        WHERE user_id = auth.uid()
    )
);
-- Password history policies
CREATE POLICY "Users can view their own password history" ON public.password_history FOR
SELECT USING (
        entry_id IN (
            SELECT id
            FROM public.password_entries
            WHERE vault_id IN (
                    SELECT id
                    FROM public.password_vaults
                    WHERE user_id = auth.uid()
                )
        )
    );