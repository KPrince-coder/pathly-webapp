'use client';

import { useEffect, useState } from 'react';
import { FiClock } from 'react-icons/fi';

const TimeTrackingIntegration: React.FC = () => {
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    // Logic to track time spent on tasks
    const interval = setInterval(() => {
      setTimeSpent(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Time Tracking Integration</h3>
      <p className="mt-2"><FiClock /> Time Spent: {timeSpent} seconds</p>
    </div>
  );
};

export default TimeTrackingIntegration;
