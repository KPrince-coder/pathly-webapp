# Pathly Web App

A modern web application built with Next.js, TypeScript, and Tailwind CSS for path-based learning and productivity tracking.

## Features

- User Authentication
- Task Management
- Time Tracking
- Pomodoro Timer
- Progress Analytics

## Tech Stack

- Next.js 13+ (App Router)
- TypeScript
- Tailwind CSS
- Supabase
- Framer Motion

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/pathly-webapp.git
cd pathly-webapp
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory and add your environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
src/
  ├── app/              # Next.js app router pages
  ├── components/       # Reusable UI components
  ├── hooks/           # Custom React hooks
  ├── lib/             # Utility functions and configurations
  └── types/           # TypeScript type definitions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
