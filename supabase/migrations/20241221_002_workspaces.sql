-- Workspaces
CREATE TABLE workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE TABLE workspace_members (
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'away')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    PRIMARY KEY (workspace_id, user_id)
);

-- Enable RLS for workspace_members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

-- Create workspace policies
CREATE POLICY "Users can view workspaces they are members of"
    ON workspaces FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create workspaces"
    ON workspaces FOR INSERT
    WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Workspace admins can update workspace details"
    ON workspaces FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspaces.id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Create workspace_members policies
CREATE POLICY "Users can view members of their workspaces"
    ON workspace_members FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members AS wm
            WHERE wm.workspace_id = workspace_members.workspace_id
            AND wm.user_id = auth.uid()
        )
    );

CREATE POLICY "Workspace admins can manage members"
    ON workspace_members FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM workspace_members
            WHERE workspace_id = workspace_members.workspace_id
            AND user_id = auth.uid()
            AND role = 'admin'
        )
    );

-- Function to automatically add creator as admin
CREATE OR REPLACE FUNCTION public.handle_new_workspace()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO workspace_members (workspace_id, user_id, role)
    VALUES (NEW.id, NEW.created_by, 'admin');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new workspace creation
CREATE TRIGGER on_workspace_created
    AFTER INSERT ON workspaces
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_workspace();
