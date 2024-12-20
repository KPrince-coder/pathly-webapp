'use client';

import { useState } from 'react';
import { FiEyeOff, FiEye } from 'react-icons/fi';

const FocusMode: React.FC = () => {
  const [isFocused, setIsFocused] = useState(false);

  const toggleFocus = () => {
    setIsFocused(!isFocused);
    // Logic to block distractions, e.g., hide notifications
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Focus Mode</h3>
      <button onClick={toggleFocus} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        {isFocused ? <FiEyeOff /> : <FiEye />} {isFocused ? 'Exit Focus Mode' : 'Enter Focus Mode'}
      </button>
    </div>
  );
};

export default FocusMode;
