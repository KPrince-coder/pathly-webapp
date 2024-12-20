import React, { useState, useEffect } from 'react';
import { useSupabase, useSupabaseUser } from '@/hooks/useSupabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, Folder, Tag, Search } from 'react-feather';
import { toast } from 'react-hot-toast';

interface Note {
  id: string;
  title: string;
  content: string;
  is_encrypted: boolean;
  privacy_level: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

interface Folder {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export const NoteList: React.FC = () => {
  const supabase = useSupabase();
  const user = useSupabaseUser();
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadNotes();
      loadFolders();
      loadTags();
    }
  }, [user, selectedFolder, searchQuery, selectedTags, sortBy]);

  const loadNotes = async () => {
    try {
      let query = supabase
        .from('notes')
        .select('*')
        .eq('user_id', user?.id);

      if (selectedFolder) {
        query = query.eq('folder_id', selectedFolder);
      }

      if (searchQuery) {
        query = query.ilike('title', `%${searchQuery}%`);
      }

      if (selectedTags.length > 0) {
        query = query.contains('tags', selectedTags);
      }

      switch (sortBy) {
        case 'updated':
          query = query.order('updated_at', { ascending: false });
          break;
        case 'created':
          query = query.order('created_at', { ascending: false });
          break;
        case 'title':
          query = query.order('title');
          break;
      }

      const { data, error } = await query;

      if (error) throw error;
      setNotes(data || []);
    } catch (error) {
      console.error('Error loading notes:', error);
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  };

  const loadFolders = async () => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .select('*')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setFolders(data || []);
    } catch (error) {
      console.error('Error loading folders:', error);
      toast.error('Failed to load folders');
    }
  };

  const loadTags = async () => {
    try {
      const { data, error } = await supabase
        .from('tags')
        .select('name')
        .eq('user_id', user?.id)
        .order('name');

      if (error) throw error;
      setAllTags(data.map(tag => tag.name));
    } catch (error) {
      console.error('Error loading tags:', error);
      toast.error('Failed to load tags');
    }
  };

  const createFolder = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('folders')
        .insert([
          {
            name,
            user_id: user?.id,
            icon: '📁',
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
          },
        ])
        .select();

      if (error) throw error;
      setFolders([...folders, data[0]]);
      toast.success('Folder created successfully!');
    } catch (error) {
      console.error('Error creating folder:', error);
      toast.error('Failed to create folder');
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      setNotes(notes.filter(note => note.id !== noteId));
      toast.success('Note deleted successfully!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Failed to delete note');
    }
  };

  const moveNoteToFolder = async (noteId: string, folderId: string) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ folder_id: folderId })
        .eq('id', noteId);

      if (error) throw error;
      await loadNotes();
      toast.success('Note moved successfully!');
    } catch (error) {
      console.error('Error moving note:', error);
      toast.error('Failed to move note');
    }
  };

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 p-4 border-r">
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">Folders</h3>
            <button
              onClick={() => {
                const name = prompt('Enter folder name:');
                if (name) createFolder(name);
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              + New
            </button>
          </div>
          <div className="space-y-1">
            <button
              onClick={() => setSelectedFolder(null)}
              className={`w-full text-left px-3 py-2 rounded ${
                !selectedFolder ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              All Notes
            </button>
            {folders.map((folder) => (
              <button
                key={folder.id}
                onClick={() => setSelectedFolder(folder.id)}
                className={`w-full text-left px-3 py-2 rounded flex items-center ${
                  selectedFolder === folder.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
                }`}
              >
                <span style={{ color: folder.color }}>{folder.icon}</span>
                <span className="ml-2">{folder.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => {
                  if (selectedTags.includes(tag)) {
                    setSelectedTags(selectedTags.filter(t => t !== tag));
                  } else {
                    setSelectedTags([...selectedTags, tag]);
                  }
                }}
                className={`px-2 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 hover:bg-gray-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {selectedFolder
              ? folders.find(f => f.id === selectedFolder)?.name || 'Notes'
              : 'All Notes'}
          </h2>
          <div className="flex items-center space-x-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border rounded-md px-3 py-1"
            >
              <option value="updated">Last Updated</option>
              <option value="created">Created Date</option>
              <option value="title">Title</option>
            </select>
            <button
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              {viewMode === 'grid' ? '📝' : '📊'}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <AnimatePresence>
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 gap-4' : 'space-y-4'}>
              {notes.map((note) => (
                <motion.div
                  key={note.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`bg-white rounded-lg shadow-sm border p-4 ${
                    viewMode === 'list' ? 'flex items-center justify-between' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium">{note.title}</h3>
                      <div className="flex items-center space-x-2">
                        {note.is_encrypted && <Lock className="w-4 h-4 text-gray-500" />}
                        {note.privacy_level === 'private' ? (
                          <EyeOff className="w-4 h-4 text-gray-500" />
                        ) : (
                          <Eye className="w-4 h-4 text-gray-500" />
                        )}
                      </div>
                    </div>
                    {viewMode === 'grid' && (
                      <>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                          {note.content}
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {note.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gray-100 rounded-full text-xs"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </>
                    )}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        Updated {new Date(note.updated_at).toLocaleDateString()}
                      </span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => {
                            const folderId = prompt('Enter folder ID:');
                            if (folderId) moveNoteToFolder(note.id, folderId);
                          }}
                          className="hover:text-gray-700"
                        >
                          <Folder className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Are you sure you want to delete this note?')) {
                              deleteNote(note.id);
                            }
                          }}
                          className="text-red-500 hover:text-red-600"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default NoteList;
