'use client';

import { useState } from 'react';
import { FiGrid } from 'react-icons/fi';

const CustomizableDashboard: React.FC = () => {
  const [widgets, setWidgets] = useState<string[]>(['Widget 1', 'Widget 2']);

  const addWidget = () => {
    setWidgets([...widgets, `Widget ${widgets.length + 1}`]);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Customizable Dashboard</h3>
      <button onClick={addWidget} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiGrid /> Add Widget
      </button>
      <ul className="mt-4">
        {widgets.map((widget, index) => (
          <li key={index}>{widget}</li>
        ))}
      </ul>
    </div>
  );
};

export default CustomizableDashboard;
