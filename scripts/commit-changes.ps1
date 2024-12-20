# Function to commit changes
function Commit-Changes {
    param (
        [string]$message,
        [string[]]$files
    )
    
    Write-Host "Committing: $message"
    git add $files
    git commit -m $message
}

# Initialize repository if needed
if (-not (Test-Path .git)) {
    git init
    Write-Host "Git repository initialized"
}

# 1. Documentation Changes
Write-Host "Committing documentation changes..."
Commit-Changes `
    "docs: Add comprehensive feature documentation" `
    @("docs/features-documentation.md", "README.md")

# 2. Security Features
Write-Host "Committing security features..."
Commit-Changes `
    "feat(security): Add biometric auth and encryption" `
    @(
        "src/components/security/BiometricAuth.tsx",
        "src/lib/encryption.ts",
        "src/lib/security/breachMonitor.ts"
    )

# 3. Integration Features
Write-Host "Committing integration features..."
Commit-Changes `
    "feat(integrations): Add calendar, email, and API integrations" `
    @(
        "src/lib/integrations/calendar.ts",
        "src/lib/integrations/email.ts",
        "src/lib/integrations/api.ts"
    )

# 4. Automation Features
Write-Host "Committing automation features..."
Commit-Changes `
    "feat(automation): Add rules engine and workflow automation" `
    @("src/lib/automation/rules.ts")

# 5. Database Schema
Write-Host "Committing database schema..."
Commit-Changes `
    "feat(db): Add integration and automation schema" `
    @("supabase/migrations/20241220_integrations.sql")

# Set up remote if provided
$remoteUrl = $args[0]
if ($remoteUrl) {
    git remote add origin $remoteUrl
    Write-Host "Remote origin added: $remoteUrl"
}

# Push changes if remote is set
if (git remote -v | Select-String -Pattern "origin") {
    Write-Host "Pushing changes to remote..."
    git push -u origin main
} else {
    Write-Host "No remote repository set. To push changes, run:"
    Write-Host "git remote add origin <repository-url>"
    Write-Host "git push -u origin main"
}
