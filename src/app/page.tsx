import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="max-w-5xl w-full text-center">
        <h1 className="text-6xl font-bold mb-8">
          Welcome to{' '}
          <span className="text-blue-600">Pathly</span>
        </h1>
        <p className="text-xl mb-12">
          Your comprehensive goal setting and task management application
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-white text-blue-600 px-6 py-3 rounded-lg border border-blue-600 hover:bg-blue-50 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  );
}
