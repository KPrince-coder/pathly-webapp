-- Calendar Integrations
CREATE TABLE calendar_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, provider)
);

CREATE TABLE calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    location TEXT,
    attendees JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, external_id)
);

-- Email Integrations
CREATE TABLE email_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    last_sync TIMESTAMP WITH TIME ZONE,
    credentials JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, provider)
);

CREATE TABLE emails (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    message_id VARCHAR(255) NOT NULL,
    subject TEXT,
    from_address TEXT NOT NULL,
    to_addresses JSONB NOT NULL,
    cc_addresses JSONB,
    bcc_addresses JSONB,
    content TEXT,
    html_content TEXT,
    received_at TIMESTAMP WITH TIME ZONE,
    read_at TIMESTAMP WITH TIME ZONE,
    labels TEXT[],
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(user_id, message_id)
);

-- Enable RLS
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;

-- RLS Policies for calendar_integrations
CREATE POLICY "Users can view their calendar integrations"
    ON calendar_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their calendar integrations"
    ON calendar_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their calendar integrations"
    ON calendar_integrations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their calendar integrations"
    ON calendar_integrations FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for calendar_events
CREATE POLICY "Users can view their calendar events"
    ON calendar_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their calendar events"
    ON calendar_events FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their calendar events"
    ON calendar_events FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their calendar events"
    ON calendar_events FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for email_integrations
CREATE POLICY "Users can view their email integrations"
    ON email_integrations FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their email integrations"
    ON email_integrations FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their email integrations"
    ON email_integrations FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their email integrations"
    ON email_integrations FOR DELETE
    USING (auth.uid() = user_id);

-- RLS Policies for emails
CREATE POLICY "Users can view their emails"
    ON emails FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their email records"
    ON emails FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their email records"
    ON emails FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their email records"
    ON emails FOR DELETE
    USING (auth.uid() = user_id);

-- Add security constraints
ALTER TABLE calendar_integrations
    ADD CONSTRAINT valid_calendar_provider CHECK (provider IN ('google', 'outlook', 'apple')),
    ADD CONSTRAINT valid_calendar_status CHECK (status IN ('active', 'inactive', 'error', 'pending'));

ALTER TABLE calendar_events
    ADD CONSTRAINT valid_event_title CHECK (length(title) >= 1),
    ADD CONSTRAINT valid_event_time CHECK (end_time > start_time);

ALTER TABLE email_integrations
    ADD CONSTRAINT valid_email_provider CHECK (provider IN ('gmail', 'outlook', 'yahoo')),
    ADD CONSTRAINT valid_email_status CHECK (status IN ('active', 'inactive', 'error', 'pending'));

ALTER TABLE emails
    ADD CONSTRAINT valid_email_subject CHECK (subject IS NULL OR length(subject) >= 1),
    ADD CONSTRAINT valid_email_addresses CHECK (
        from_address ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
        AND (to_addresses->>'email')::text ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
    );

-- Indexes
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE INDEX idx_emails_user_received ON emails(user_id, received_at);
CREATE INDEX idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX idx_email_integrations_user ON email_integrations(user_id);
