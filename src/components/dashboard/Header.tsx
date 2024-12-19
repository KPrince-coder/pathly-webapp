import { FiBell, FiUser } from 'react-icons/fi';

export function Header() {
  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-gray-500 hover:text-gray-700">
          <FiBell className="w-6 h-6" />
        </button>
        <button className="flex items-center space-x-2 text-gray-700 hover:text-gray-900">
          <FiUser className="w-6 h-6" />
          <span>Profile</span>
        </button>
      </div>
    </header>
  );
}
