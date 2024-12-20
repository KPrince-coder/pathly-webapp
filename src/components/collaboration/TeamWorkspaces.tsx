'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FiPlus, FiTrash } from 'react-icons/fi';

const TeamWorkspaces: React.FC = () => {
  const supabase = useSupabaseClient();
  const [workspaces, setWorkspaces] = useState<{ id: string; name: string }[]>([]);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      const { data, error } = await supabase.from('workspaces').select('*');
      if (error) console.error('Error fetching workspaces:', error);
      else setWorkspaces(data);
    };
    fetchWorkspaces();
  }, [supabase]);

  const addWorkspace = async () => {
    const { data, error } = await supabase.from('workspaces').insert([{ name: newWorkspaceName }]);
    if (error) console.error('Error adding workspace:', error);
    else setWorkspaces([...workspaces, data[0]]);
    setNewWorkspaceName('');
  };

  const deleteWorkspace = async (id: string) => {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) console.error('Error deleting workspace:', error);
    else setWorkspaces(workspaces.filter(ws => ws.id !== id));
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Team Workspaces</h3>
      <input
        type="text"
        value={newWorkspaceName}
        onChange={(e) => setNewWorkspaceName(e.target.value)}
        placeholder="New Workspace Name"
        className="border rounded p-2"
      />
      <button onClick={addWorkspace} className="mt-2 px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
        <FiPlus /> Add Workspace
      </button>
      <ul className="mt-4">
        {workspaces.map(ws => (
          <li key={ws.id} className="flex justify-between items-center">
            <span>{ws.name}</span>
            <button onClick={() => deleteWorkspace(ws.id)} className="text-red-500">
              <FiTrash />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TeamWorkspaces;
