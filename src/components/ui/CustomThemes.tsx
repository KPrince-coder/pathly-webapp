'use client';

import { useState } from 'react';
import { FiPalette } from 'react-icons/fi';

const CustomThemes: React.FC = () => {
  const [theme, setTheme] = useState('');

  const applyTheme = (themeName: string) => {
    // Logic to apply the selected theme
    setTheme(`Applied ${themeName} theme`);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Custom Themes</h3>
      <button onClick={() => applyTheme('Dark')} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiPalette /> Apply Dark Theme
      </button>
      {theme && <p className="mt-2">{theme}</p>}
    </div>
  );
};

export default CustomThemes;
