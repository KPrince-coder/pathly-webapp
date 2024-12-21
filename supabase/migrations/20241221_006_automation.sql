-- Automation Rules
CREATE TABLE automation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    trigger_type TEXT NOT NULL,
    trigger_conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Automation Logs
CREATE TABLE automation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_id UUID REFERENCES automation_rules(id) ON DELETE SET NULL,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    trigger_type TEXT NOT NULL,
    trigger_data JSONB,
    action_results JSONB,
    status TEXT NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for automation_rules
CREATE POLICY "Users can view their automation rules"
    ON automation_rules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their automation rules"
    ON automation_rules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their automation rules"
    ON automation_rules FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their automation rules"
    ON automation_rules FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for automation_logs
CREATE POLICY "Users can view their automation logs"
    ON automation_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "System can create automation logs"
    ON automation_logs FOR INSERT
    WITH CHECK (
        auth.uid() = user_id 
        OR auth.role() = 'service_role'
    );

CREATE POLICY "No manual updates to automation logs"
    ON automation_logs FOR UPDATE
    USING (false);

CREATE POLICY "Users can delete their old automation logs"
    ON automation_logs FOR DELETE
    USING (
        auth.uid() = user_id
        AND created_at < NOW() - INTERVAL '30 days'
    );

-- Add security constraints
ALTER TABLE automation_rules
    ADD CONSTRAINT valid_rule_name CHECK (length(name) >= 3),
    ADD CONSTRAINT valid_trigger_type CHECK (
        trigger_type IN (
            'task_created',
            'task_completed',
            'goal_achieved',
            'milestone_reached',
            'schedule_time',
            'email_received',
            'calendar_event_created'
        )
    );

ALTER TABLE automation_logs
    ADD CONSTRAINT valid_log_status CHECK (
        status IN ('success', 'failure', 'pending', 'cancelled')
    );

-- Add function to clean old logs
CREATE OR REPLACE FUNCTION clean_old_automation_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM automation_logs
    WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger for cleaning old logs
CREATE OR REPLACE FUNCTION trigger_clean_old_logs()
RETURNS trigger AS $$
BEGIN
    IF (SELECT COUNT(*) FROM automation_logs) > 10000 THEN
        PERFORM clean_old_automation_logs();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER clean_logs_trigger
    AFTER INSERT ON automation_logs
    FOR EACH STATEMENT
    EXECUTE FUNCTION trigger_clean_old_logs();

-- Indexes
CREATE INDEX idx_automation_rules_user ON automation_rules(user_id);
CREATE INDEX idx_automation_logs_user ON automation_logs(user_id);
CREATE INDEX idx_automation_logs_rule ON automation_logs(rule_id);
CREATE INDEX idx_automation_logs_created ON automation_logs(created_at);

-- Common Functions
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all relevant tables
DO $$ 
BEGIN
    -- Core tables
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON profiles
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON user_settings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    -- Workspace tables
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON workspaces
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    -- Vision Planner tables
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON vision_goals
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON vision_milestones
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON vision_tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON vision_mentorships
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    -- Task Management tables
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON tasks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON time_blocks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON task_recurrence
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    -- Integration tables
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON calendar_integrations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON calendar_events
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON email_integrations
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON emails
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
            
    -- Automation tables
    EXECUTE 'CREATE TRIGGER set_updated_at
            BEFORE UPDATE ON automation_rules
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at()';
END $$;
