'use client';

import { useState } from 'react';
import { FiFileText } from 'react-icons/fi';

const SmartTemplates: React.FC = () => {
  const [template, setTemplate] = useState('');

  const applyTemplate = (templateName: string) => {
    // Logic to apply the selected template
    setTemplate(`Applied ${templateName} template`);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Smart Templates</h3>
      <button onClick={() => applyTemplate('Note')} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiFileText /> Apply Note Template
      </button>
      {template && <p className="mt-2">{template}</p>}
    </div>
  );
};

export default SmartTemplates;
