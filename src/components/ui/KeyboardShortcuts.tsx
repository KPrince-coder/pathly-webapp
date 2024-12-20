'use client';

import { useEffect } from 'react';
import { FiKeyboard } from 'react-icons/fi';

const KeyboardShortcuts: React.FC = () => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Logic to handle keyboard shortcuts
      console.log('Key pressed:', event.key);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
      <p className="mt-2"><FiKeyboard /> Use shortcuts to navigate quickly.</p>
    </div>
  );
};

export default KeyboardShortcuts;
