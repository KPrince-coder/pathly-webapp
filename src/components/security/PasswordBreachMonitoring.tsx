'use client';

import { useEffect, useState } from 'react';
import { FiAlertTriangle } from 'react-icons/fi';

const PasswordBreachMonitoring: React.FC = () => {
  const [breachAlerts, setBreachAlerts] = useState<string[]>([]);

  useEffect(() => {
    const checkForBreaches = async () => {
      const alerts = []; // Fetch alerts from a breach monitoring service
      setBreachAlerts(alerts);
    };

    checkForBreaches();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Password Breach Monitoring</h3>
      {breachAlerts.length > 0 ? (
        <ul className="mt-2 text-red-500">
          {breachAlerts.map((alert, index) => (
            <li key={index}>
              <FiAlertTriangle className="inline-block mr-1" />
              {alert}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-2">No breaches detected.</div>
      )}
    </div>
  );
};

export default PasswordBreachMonitoring;
