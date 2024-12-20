import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { Key, Lock, Eye, EyeOff, Copy, Trash2, Edit2, Plus, Shield, RefreshCw } from 'react-feather';
import zxcvbn from 'zxcvbn';
import { useSupabase, useSupabaseUser } from '@/hooks/useSupabase';

interface PasswordVault {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color: string;
  is_favorite: boolean;
}

interface PasswordEntry {
  id: string;
  vault_id: string;
  title: string;
  username?: string;
  email?: string;
  encrypted_password: string;
  website_url?: string;
  notes?: string;
  icon?: string;
  color?: string;
  category?: string;
  tags: string[];
  strength_score: number;
  last_used_at: string;
  expiry_date?: string;
  auto_generated: boolean;
}

const SPECIAL_CHARS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
const NUMBERS = '0123456789';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const PasswordManager: React.FC = () => {
  const [vaults, setVaults] = useState<PasswordVault[]>([]);
  const [selectedVault, setSelectedVault] = useState<string | null>(null);
  const [entries, setEntries] = useState<PasswordEntry[]>([]);
  const [showNewVault, setShowNewVault] = useState(false);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [masterPassword, setMasterPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPasswordGenerator, setShowPasswordGenerator] = useState(false);
  const [generatorOptions, setGeneratorOptions] = useState({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
  });
  const [generatedPassword, setGeneratedPassword] = useState('');

  const supabase = useSupabase();
  const user = useSupabaseUser();

  useEffect(() => {
    if (user && isUnlocked) {
      loadVaults();
    }
  }, [user, isUnlocked]);

  useEffect(() => {
    if (selectedVault) {
      loadEntries();
    }
  }, [selectedVault]);

  const loadVaults = async () => {
    try {
      const { data, error } = await supabase
        .from('password_vaults')
        .select('*')
        .eq('user_id', user?.id)
        .order('is_favorite', { ascending: false })
        .order('name');

      if (error) throw error;
      setVaults(data || []);
    } catch (error) {
      console.error('Error loading vaults:', error);
      toast.error('Failed to load password vaults');
    }
  };

  const loadEntries = async () => {
    if (!selectedVault) return;

    try {
      const { data, error } = await supabase
        .from('password_entries')
        .select('*')
        .eq('vault_id', selectedVault)
        .order('title');

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error loading entries:', error);
      toast.error('Failed to load passwords');
    }
  };

  const createVault = async (name: string, description?: string) => {
    try {
      const { data, error } = await supabase
        .from('password_vaults')
        .insert([
          {
            name,
            description,
            user_id: user?.id,
            master_password_hash: masterPassword, // In production, use proper password hashing
            color: '#' + Math.floor(Math.random()*16777215).toString(16),
          },
        ])
        .select();

      if (error) throw error;
      setVaults([...vaults, data[0]]);
      toast.success('Vault created successfully!');
    } catch (error) {
      console.error('Error creating vault:', error);
      toast.error('Failed to create vault');
    }
  };

  const generatePassword = () => {
    let chars = '';
    if (generatorOptions.uppercase) chars += UPPERCASE;
    if (generatorOptions.lowercase) chars += LOWERCASE;
    if (generatorOptions.numbers) chars += NUMBERS;
    if (generatorOptions.symbols) chars += SPECIAL_CHARS;

    let password = '';
    for (let i = 0; i < generatorOptions.length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // Ensure at least one character from each selected type
    if (generatorOptions.uppercase) {
      password = UPPERCASE.charAt(Math.floor(Math.random() * UPPERCASE.length)) + password.slice(1);
    }
    if (generatorOptions.lowercase) {
      password = password.slice(0, 1) + LOWERCASE.charAt(Math.floor(Math.random() * LOWERCASE.length)) + password.slice(2);
    }
    if (generatorOptions.numbers) {
      password = password.slice(0, 2) + NUMBERS.charAt(Math.floor(Math.random() * NUMBERS.length)) + password.slice(3);
    }
    if (generatorOptions.symbols) {
      password = password.slice(0, 3) + SPECIAL_CHARS.charAt(Math.floor(Math.random() * SPECIAL_CHARS.length)) + password.slice(4);
    }

    setGeneratedPassword(password);
  };

  const addPasswordEntry = async (entry: Partial<PasswordEntry>) => {
    if (!selectedVault) return;

    try {
      const strength = zxcvbn(entry.encrypted_password || '');
      
      const { data, error } = await supabase
        .from('password_entries')
        .insert([
          {
            ...entry,
            vault_id: selectedVault,
            strength_score: strength.score,
            last_used_at: new Date().toISOString(),
          },
        ])
        .select();

      if (error) throw error;
      setEntries([...entries, data[0]]);
      toast.success('Password added successfully!');
    } catch (error) {
      console.error('Error adding password:', error);
      toast.error('Failed to add password');
    }
  };

  const deleteEntry = async (entryId: string) => {
    try {
      const { error } = await supabase
        .from('password_entries')
        .delete()
        .eq('id', entryId);

      if (error) throw error;
      setEntries(entries.filter(entry => entry.id !== entryId));
      toast.success('Password deleted successfully!');
    } catch (error) {
      console.error('Error deleting password:', error);
      toast.error('Failed to delete password');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy to clipboard');
    }
  };

  if (!isUnlocked) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
          <div className="flex items-center justify-center mb-8">
            <Lock className="w-12 h-12 text-blue-500" />
          </div>
          <h2 className="text-2xl font-bold text-center mb-6">Unlock Password Manager</h2>
          <div className="space-y-4">
            <input
              type="password"
              value={masterPassword}
              onChange={(e) => setMasterPassword(e.target.value)}
              placeholder="Enter master password"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => setIsUnlocked(true)} // In production, verify master password
              className="w-full px-4 py-2 text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Unlock
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-64 bg-gray-50 p-4 border-r">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Vaults</h2>
          <button
            onClick={() => setShowNewVault(true)}
            className="p-2 text-blue-500 hover:bg-blue-50 rounded-full"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {vaults.map((vault) => (
            <button
              key={vault.id}
              onClick={() => setSelectedVault(vault.id)}
              className={`w-full flex items-center p-2 rounded ${
                selectedVault === vault.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full mr-3"
                style={{ backgroundColor: vault.color }}
              />
              <span>{vault.name}</span>
            </button>
          ))}
        </div>

        <div className="mt-8">
          <button
            onClick={() => setShowPasswordGenerator(true)}
            className="w-full flex items-center justify-center px-4 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Generate Password
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search passwords..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg"
              />
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            </div>
          </div>
          {selectedVault && (
            <button
              onClick={() => setShowNewEntry(true)}
              className="ml-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Add Password
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries
            .filter(entry => 
              entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
              entry.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
              entry.email?.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((entry) => (
              <motion.div
                key={entry.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-white rounded-lg shadow-sm border"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">{entry.title}</h3>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyToClipboard(entry.encrypted_password)}
                      className="p-1 hover:bg-gray-100 rounded"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="p-1 hover:bg-gray-100 rounded text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                {entry.username && (
                  <div className="text-sm text-gray-600 mb-1">
                    Username: {entry.username}
                  </div>
                )}
                {entry.email && (
                  <div className="text-sm text-gray-600 mb-1">
                    Email: {entry.email}
                  </div>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <div
                    className="h-1 flex-1 rounded-full bg-gray-200 overflow-hidden"
                  >
                    <div
                      className={`h-full ${
                        entry.strength_score >= 4
                          ? 'bg-green-500'
                          : entry.strength_score >= 3
                          ? 'bg-blue-500'
                          : entry.strength_score >= 2
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${(entry.strength_score + 1) * 20}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {entry.strength_score >= 4
                      ? 'Very Strong'
                      : entry.strength_score >= 3
                      ? 'Strong'
                      : entry.strength_score >= 2
                      ? 'Medium'
                      : 'Weak'}
                  </span>
                </div>
              </motion.div>
            ))}
        </div>
      </div>

      {/* Password Generator Modal */}
      <AnimatePresence>
        {showPasswordGenerator && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-lg p-6 max-w-md w-full"
            >
              <h2 className="text-xl font-bold mb-4">Password Generator</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Password Length: {generatorOptions.length}
                  </label>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={generatorOptions.length}
                    onChange={(e) =>
                      setGeneratorOptions({
                        ...generatorOptions,
                        length: parseInt(e.target.value),
                      })
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.uppercase}
                      onChange={(e) =>
                        setGeneratorOptions({
                          ...generatorOptions,
                          uppercase: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Include Uppercase Letters
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.lowercase}
                      onChange={(e) =>
                        setGeneratorOptions({
                          ...generatorOptions,
                          lowercase: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Include Lowercase Letters
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.numbers}
                      onChange={(e) =>
                        setGeneratorOptions({
                          ...generatorOptions,
                          numbers: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Include Numbers
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={generatorOptions.symbols}
                      onChange={(e) =>
                        setGeneratorOptions({
                          ...generatorOptions,
                          symbols: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Include Symbols
                  </label>
                </div>
                {generatedPassword && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="font-mono">{generatedPassword}</span>
                      <button
                        onClick={() => copyToClipboard(generatedPassword)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={generatePassword}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    Generate
                  </button>
                  <button
                    onClick={() => setShowPasswordGenerator(false)}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PasswordManager;
