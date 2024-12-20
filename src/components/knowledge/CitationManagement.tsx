'use client';

import { useState } from 'react';
import { FiBookOpen } from 'react-icons/fi';

const CitationManagement: React.FC = () => {
  const [citations, setCitations] = useState([{ title: 'Understanding AI', author: 'John Doe' }]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Citation Management</h3>
      <ul className="mt-2">
        {citations.map((citation, index) => (
          <li key={index} className="border-b py-2">
            <strong>{citation.title}</strong> by {citation.author}
          </li>
        ))}
      </ul>
      <button className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiBookOpen /> Add Citation
      </button>
    </div>
  );
};

export default CitationManagement;
