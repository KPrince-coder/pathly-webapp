#!/bin/bash

# Function to commit changes
commit_changes() {
    local files=("$@")
    local message="$1"
    shift
    
    echo "Committing: $message"
    git add "${files[@]}"
    git commit -m "$message"
}

# Initialize repository if needed
if [ ! -d .git ]; then
    git init
    echo "Git repository initialized"
fi

# 1. Documentation Changes
echo "Committing documentation changes..."
commit_changes "docs: Add comprehensive feature documentation" \
    docs/features-documentation.md \
    README.md

# 2. Security Features
echo "Committing security features..."
commit_changes "feat(security): Add biometric auth and encryption" \
    src/components/security/BiometricAuth.tsx \
    src/lib/encryption.ts \
    src/lib/security/breachMonitor.ts

# 3. Integration Features
echo "Committing integration features..."
commit_changes "feat(integrations): Add calendar, email, and API integrations" \
    src/lib/integrations/calendar.ts \
    src/lib/integrations/email.ts \
    src/lib/integrations/api.ts

# 4. Automation Features
echo "Committing automation features..."
commit_changes "feat(automation): Add rules engine and workflow automation" \
    src/lib/automation/rules.ts

# 5. Database Schema
echo "Committing database schema..."
commit_changes "feat(db): Add integration and automation schema" \
    supabase/migrations/20241220_integrations.sql

# Set up remote if provided
if [ ! -z "$1" ]; then
    git remote add origin $1
    echo "Remote origin added: $1"
fi

# Push changes if remote is set
if git remote -v | grep -q origin; then
    echo "Pushing changes to remote..."
    git push -u origin main
else
    echo "No remote repository set. To push changes, run:"
    echo "git remote add origin <repository-url>"
    echo "git push -u origin main"
fi
