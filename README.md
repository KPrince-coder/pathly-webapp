# Pathly Webapp

A modern web application built with Next.js, TypeScript, and Tailwind CSS, focusing on task management and productivity tracking with advanced note-taking and password management capabilities.

## 🌟 Features

### 📝 Enhanced Note-Taking System

#### Rich Text Editor
- Full formatting options (bold, italic, underline, etc.)
- Text alignment controls
- Multiple headings
- Bullet and numbered lists
- Code blocks with syntax highlighting
- Quote blocks

#### Media Support
- 🎤 Voice Notes
  - Record voice memos directly in the app
  - Automatic transcription
  - Playback controls
  - Voice-to-text conversion
  
- 📸 Image Support
  - Drag and drop image uploads
  - Image resizing and optimization
  - Caption support
  - Gallery view
  
- 📄 PDF Export
  - Export notes with formatting preserved
  - Custom page layouts
  - Include images and media
  - Batch export capability

#### Organization
- 🎨 Color Customization
  - Custom color picker
  - Preset color themes
  - Color-coded categories
  
- 🏷️ Tags and Categories
  - Create custom tags
  - Filter by multiple tags
  - Nested categories
  - Smart folders
  
- 📅 Version Control
  - Automatic timestamps
  - Edit history
  - Version comparison
  - Restore previous versions

### 🔐 Password Manager

#### Vault Management
- Create multiple password vaults
- Master password protection
- Vault sharing capabilities
- Vault backup and sync

#### Password Generation
- Customizable password generator
  - Length control (8-32 characters)
  - Character type selection
    - Uppercase letters
    - Lowercase letters
    - Numbers
    - Special symbols
  - Exclude similar characters
  - Pronounceable options

#### Security Features
- 🛡️ Password Strength Analysis
  - Real-time strength indicator
  - Common pattern detection
  - Breach detection
  - Age monitoring
  
- 🔒 Encryption
  - AES-256 encryption
  - End-to-end encryption
  - Secure master key storage
  - Zero-knowledge architecture

#### Organization
- 📂 Categories and Tags
  - Custom categories
  - Multiple tags
  - Smart filters
  - Search functionality
  
- 📊 Password Health
  - Overall security score
  - Weak password detection
  - Duplicate password alerts
  - Password age tracking

### 🎯 Task Management

- Create and manage tasks
- Set priorities and deadlines
- Track progress
- Collaborate with team members
- Attach notes and files
- Set reminders

## 🚀 Getting Started

### Prerequisites

- Node.js 18.x or later
- npm or yarn
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/pathly-webapp.git
cd pathly-webapp
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## 🛠️ Technology Stack

- **Frontend**:
  - Next.js 14
  - TypeScript
  - Tailwind CSS
  - Framer Motion
  - TipTap Editor
  - React Speech Recognition
  - React Colorful

- **Backend**:
  - Supabase
  - PostgreSQL
  - Row Level Security
  - Edge Functions

- **Authentication**:
  - Supabase Auth
  - Magic Links
  - OAuth Providers

- **Storage**:
  - Supabase Storage
  - Edge Caching
  - CDN Integration

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Supabase Setup

1. Create a new Supabase project
2. Run the migration scripts in `supabase/migrations`
3. Configure storage buckets for media files
4. Set up Row Level Security policies

## 📚 Usage

### Note-Taking

1. Create a new note using the + button
2. Use the rich text editor toolbar for formatting
3. Record voice notes with the microphone button
4. Upload images via drag & drop or file picker
5. Export to PDF using the download button
6. Organize with tags and colors

### Password Manager

1. Create a master password
2. Set up password vaults
3. Generate secure passwords
4. Save and organize credentials
5. Monitor password health
6. Export and backup securely

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Supabase team for the backend infrastructure
- TipTap team for the rich text editor
- All contributors and users

## 📞 Support

For support, please:
1. Check the documentation
2. Search existing issues
3. Open a new issue if needed
4. Join our Discord community

---

Built with ❤️ by the Pathly Team
