-- Drop all tables in reverse order of creation
DROP TABLE IF EXISTS automation_logs;
DROP TABLE IF EXISTS automation_rules;

DROP TABLE IF EXISTS emails;
DROP TABLE IF EXISTS email_integrations;
DROP TABLE IF EXISTS calendar_events;
DROP TABLE IF EXISTS calendar_integrations;

DROP TABLE IF EXISTS task_recurrence;
DROP TABLE IF EXISTS time_blocks;
DROP TABLE IF EXISTS task_dependencies;
DROP TABLE IF EXISTS tasks;

DROP TABLE IF EXISTS vision_mentorships;
DROP TABLE IF EXISTS vision_reflections;
DROP TABLE IF EXISTS vision_tasks;
DROP TABLE IF EXISTS vision_milestones;
DROP TABLE IF EXISTS vision_goals;

DROP TABLE IF EXISTS workspace_members;
DROP TABLE IF EXISTS workspaces;

DROP TABLE IF EXISTS user_settings;
DROP TABLE IF EXISTS profiles;

-- Drop functions and triggers
DROP TRIGGER IF EXISTS clean_logs_trigger ON automation_logs;
DROP FUNCTION IF EXISTS trigger_clean_old_logs();
DROP FUNCTION IF EXISTS clean_old_automation_logs();

-- Drop extensions (if needed)
-- DROP EXTENSION IF EXISTS "uuid-ossp";
-- DROP EXTENSION IF EXISTS "pgcrypto";
