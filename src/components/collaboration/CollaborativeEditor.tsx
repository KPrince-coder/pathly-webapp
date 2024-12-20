'use client';

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import { FiEdit, FiSave } from 'react-icons/fi';

const CollaborativeEditor: React.FC<{ noteId: string }> = ({ noteId }) => {
  const supabase = useSupabaseClient();
  const [content, setContent] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const fetchNoteContent = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('content')
        .eq('id', noteId)
        .single();

      if (error) console.error('Error fetching note:', error);
      else setContent(data.content);
    };

    fetchNoteContent();

    const subscription = supabase
      .from(`notes:id=eq.${noteId}`)
      .on('UPDATE', payload => {
        setContent(payload.new.content);
      })
      .subscribe();

    return () => {
      supabase.removeSubscription(subscription);
    };
  }, [noteId, supabase]);

  const handleSave = async () => {
    const { error } = await supabase
      .from('notes')
      .update({ content })
      .eq('id', noteId);

    if (error) console.error('Error saving note:', error);
    else setIsEditing(false);
  };

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Collaborative Editor</h3>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full h-40 border rounded p-2"
        disabled={!isEditing}
      />
      <div className="flex justify-end mt-2">
        {isEditing ? (
          <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded flex items-center gap-2">
            <FiSave /> Save
          </button>
        ) : (
          <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-blue-500 text-white rounded flex items-center gap-2">
            <FiEdit /> Edit
          </button>
        )}
      </div>
    </div>
  );
};

export default CollaborativeEditor;
