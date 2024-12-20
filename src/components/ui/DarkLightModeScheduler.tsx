'use client';

import { useEffect, useState } from 'react';
import { FiSun, FiMoon } from 'react-icons/fi';

const DarkLightModeScheduler: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const hour = new Date().getHours();
    setIsDarkMode(hour >= 18 || hour < 6);
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Dark/Light Mode Scheduling</h3>
      <p className="mt-2">
        <span>{isDarkMode ? <FiMoon /> : <FiSun />} {isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
      </p>
    </div>
  );
};

export default DarkLightModeScheduler;
