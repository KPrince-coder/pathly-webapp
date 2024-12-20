'use client';

import { useEffect, useState } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { FiGitBranch } from 'react-icons/fi';

const DocumentVersionControl: React.FC<{ noteId: string }> = ({ noteId }) => {
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [versions, setVersions] = useState<{ id: string; content: string; created_at: string }[]>([]);

  useEffect(() => {
    const fetchVersions = async () => {
      const { data, error } = await supabase.from('note_versions').select('*').eq('note_id', noteId);
      if (error) console.error('Error fetching versions:', error);
      else setVersions(data);
    };
    fetchVersions();
  }, [noteId, supabase]);

  const createVersion = async (content: string) => {
    const { error } = await supabase.from('note_versions').insert([{ note_id: noteId, content }]);
    if (error) console.error('Error creating version:', error);
    else fetchVersions(); // Refresh versions
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Document Version Control</h3>
      <button onClick={() => createVersion('Current note content')} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiGitBranch /> Save Version
      </button>
      <ul className="mt-4">
        {versions.map(version => (
          <li key={version.id}>
            <span>{new Date(version.created_at).toLocaleString()}</span>
            <p>{version.content}</p>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentVersionControl;
