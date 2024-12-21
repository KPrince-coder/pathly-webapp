# Database Migrations

This directory contains the database migrations for the Pathly application. Each migration file is timestamped and contains a specific set of changes to the database schema.

## Migration Files

- `20241221_000_down.sql`: Rollback script to drop all tables and functions
- `20241221_001_init.sql`: Initial setup with profiles and user settings
- `20241221_002_workspaces.sql`: Workspace management and member roles
- `20241221_003_vision_planner.sql`: Vision planning features (goals, milestones, tasks)
- `20241221_004_tasks.sql`: Task management system
- `20241221_005_integrations.sql`: Calendar and email integrations
- `20241221_006_automation.sql`: Automation rules and logs

## Security Features

All tables implement:
- Row Level Security (RLS) policies
- Data validation constraints
- Proper indexing for performance
- Clear separation of roles and permissions

## Running Migrations

Migrations are automatically applied when you run:
```bash
supabase db reset
```

To apply a specific migration:
```bash
supabase db push
```

To roll back all changes:
```sql
\i supabase/migrations/20241221_000_down.sql
```

## Best Practices

1. Never modify existing migrations that have been deployed
2. Always create new migrations for schema changes
3. Test migrations in a development environment first
4. Keep the `down.sql` script updated with new tables
5. Maintain proper ordering of table creation/deletion

## Security Guidelines

1. All tables must have RLS enabled
2. Use appropriate constraints for data validation
3. Implement proper foreign key relationships
4. Follow the principle of least privilege
5. Protect sensitive operations with role-based access
6. Use parameterized queries to prevent SQL injection
