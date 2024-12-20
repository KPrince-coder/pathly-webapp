'use client';

import { useEffect, useState } from 'react';
import { FiBell } from 'react-icons/fi';

const SmartNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<string[]>([]);

  useEffect(() => {
    const generateNotification = () => {
      const newNotification = `Reminder: ${Math.random()}`;
      setNotifications(prev => [...prev, newNotification]);
    };

    const interval = setInterval(generateNotification, 5000); // Generate a notification every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Smart Notifications</h3>
      <ul className="mt-2">
        {notifications.map((notification, index) => (
          <li key={index} className="text-blue-500">{notification}</li>
        ))}
      </ul>
    </div>
  );
};

export default SmartNotifications;
