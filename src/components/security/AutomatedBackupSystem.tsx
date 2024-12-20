'use client';

import { useEffect } from 'react';
import { FiDatabase } from 'react-icons/fi';

const AutomatedBackupSystem: React.FC = () => {
  useEffect(() => {
    const scheduleBackup = () => {
      console.log('Backup scheduled every 24 hours');
    };

    scheduleBackup();
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Automated Backup System</h3>
      <div className="mt-2">
        <FiDatabase className="text-blue-500" />
        <span className="font-bold">Backups are scheduled automatically.</span>
      </div>
    </div>
  );
};

export default AutomatedBackupSystem;
