#!/bin/bash

# 1. Database schema changes
git add supabase/migrations/20241220_notes_enhancement.sql
git commit -m "feat(db): Add schema for enhanced notes and password manager

- Add columns for note media, voice notes, and colors
- Create password vaults and entries tables
- Implement Row Level Security policies
- Add timestamps and version tracking"

# 2. Dependencies
git add package.json
git commit -m "chore(deps): Add dependencies for enhanced features

- Add TipTap extensions for rich text editing
- Add html2canvas and jspdf for PDF export
- Add react-colorful for color picker
- Add react-speech-recognition for voice notes
- Add zxcvbn for password strength analysis"

# 3. Note system enhancements
git add src/components/notes/*
git commit -m "feat(notes): Implement enhanced note-taking system

- Add rich text editor with formatting options
- Implement voice recording and transcription
- Add image upload and embedding
- Add PDF export functionality
- Add color customization
- Add tags and folders organization
- Add timestamps and version history"

# 4. Password manager
git add src/components/password-manager/* src/app/\(dashboard\)/passwords/*
git commit -m "feat(security): Add password manager system

- Create password vaults with master password protection
- Implement password generator with customization options
- Add strength analysis and security features
- Add search and categorization functionality
- Implement password history tracking
- Add secure storage and encryption"

# 5. UI/UX improvements
git add .
git commit -m "feat(ui): Enhance user interface and experience

- Add modern and responsive design
- Implement smooth animations with Framer Motion
- Add toast notifications for user feedback
- Add loading states and error handling
- Improve navigation and accessibility"

# 6. Documentation update
git add README.md
git commit -m "docs: Update README with comprehensive documentation

- Add detailed feature descriptions
  - Enhanced note-taking system
  - Password manager
  - Task management
- Update installation and setup instructions
- Add technology stack breakdown
- Include configuration details
- Provide usage guides
- Update contributing guidelines
- Add support information"

# Push all changes
git push origin main
