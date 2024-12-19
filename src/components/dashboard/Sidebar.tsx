import Link from 'next/link';
import { 
  FiHome, 
  FiTarget, 
  FiCalendar, 
  FiList,
  FiBarChart2,
  FiSettings 
} from 'react-icons/fi';

export function Sidebar() {
  const menuItems = [
    { icon: FiHome, label: 'Dashboard', href: '/dashboard' },
    { icon: FiTarget, label: 'Goals', href: '/dashboard/goals' },
    { icon: FiList, label: 'Tasks', href: '/dashboard/tasks' },
    { icon: FiCalendar, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: FiBarChart2, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: FiSettings, label: 'Settings', href: '/dashboard/settings' },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200">
      <div className="h-16 flex items-center px-6">
        <Link href="/dashboard" className="text-2xl font-bold text-blue-600">
          Pathly
        </Link>
      </div>
      <nav className="mt-6">
        <ul>
          {menuItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center px-6 py-3 text-gray-700 hover:bg-gray-50 hover:text-blue-600"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
