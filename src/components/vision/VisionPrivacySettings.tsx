'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiLock,
  FiUsers,
  FiGlobe,
  FiPlus,
  FiX,
  FiSearch,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

interface SharedUser {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface VisionPrivacySettingsProps {
  entityId: string;
  entityType: 'goal' | 'milestone' | 'task' | 'reflection' | 'mentor';
  initialVisibility?: 'private' | 'shared' | 'public';
  initialSharedWith?: SharedUser[];
  onUpdate?: () => void;
}

export function VisionPrivacySettings({
  entityId,
  entityType,
  initialVisibility = 'private',
  initialSharedWith = [],
  onUpdate,
}: VisionPrivacySettingsProps) {
  const [visibility, setVisibility] = useState(initialVisibility);
  const [sharedWith, setSharedWith] = useState<SharedUser[]>(initialSharedWith);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SharedUser[]>([]);
  const supabase = useSupabase();

  useEffect(() => {
    fetchPrivacySettings();
  }, [entityId, entityType]);

  const fetchPrivacySettings = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_privacy_settings')
        .select('visibility, shared_with')
        .eq('entity_id', entityId)
        .eq('entity_type', entityType)
        .single();

      if (error) throw error;

      if (data) {
        setVisibility(data.visibility);
        if (data.shared_with?.length > 0) {
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', data.shared_with);

          if (userError) throw userError;
          setSharedWith(userData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    }
  };

  const handleVisibilityChange = async (newVisibility: typeof visibility) => {
    try {
      const { error } = await supabase
        .from('vision_privacy_settings')
        .upsert({
          entity_id: entityId,
          entity_type: entityType,
          visibility: newVisibility,
          user_id: (await supabase.auth.getUser()).data.user?.id,
        });

      if (error) throw error;
      setVisibility(newVisibility);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating visibility:', error);
    }
  };

  const handleUserSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(
        (data || []).filter((user) => !sharedWith.some((u) => u.id === user.id))
      );
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleAddUser = async (user: SharedUser) => {
    try {
      const { error } = await supabase.from('vision_privacy_settings').upsert({
        entity_id: entityId,
        entity_type: entityType,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        shared_with: [...sharedWith.map((u) => u.id), user.id],
      });

      if (error) throw error;
      setSharedWith([...sharedWith, user]);
      setSearchResults(searchResults.filter((u) => u.id !== user.id));
      onUpdate?.();
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleRemoveUser = async (userId: string) => {
    try {
      const { error } = await supabase.from('vision_privacy_settings').upsert({
        entity_id: entityId,
        entity_type: entityType,
        user_id: (await supabase.auth.getUser()).data.user?.id,
        shared_with: sharedWith.filter((u) => u.id !== userId).map((u) => u.id),
      });

      if (error) throw error;
      setSharedWith(sharedWith.filter((u) => u.id !== userId));
      onUpdate?.();
    } catch (error) {
      console.error('Error removing user:', error);
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-medium text-gray-900">Privacy Settings</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Visibility
            </label>
            <div className="flex space-x-2">
              <Button
                variant={visibility === 'private' ? 'default' : 'outline'}
                onClick={() => handleVisibilityChange('private')}
                className="flex items-center space-x-2"
              >
                <FiLock className="h-4 w-4" />
                <span>Private</span>
              </Button>
              <Button
                variant={visibility === 'shared' ? 'default' : 'outline'}
                onClick={() => handleVisibilityChange('shared')}
                className="flex items-center space-x-2"
              >
                <FiUsers className="h-4 w-4" />
                <span>Shared</span>
              </Button>
              <Button
                variant={visibility === 'public' ? 'default' : 'outline'}
                onClick={() => handleVisibilityChange('public')}
                className="flex items-center space-x-2"
              >
                <FiGlobe className="h-4 w-4" />
                <span>Public</span>
              </Button>
            </div>
          </div>

          {visibility === 'shared' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-700">
                  Shared With
                </label>
                <Button
                  size="sm"
                  onClick={() => setShowUserSearch(true)}
                  className="flex items-center space-x-2"
                >
                  <FiPlus className="h-4 w-4" />
                  <span>Add People</span>
                </Button>
              </div>

              <AnimatePresence mode="popLayout">
                {showUserSearch && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <Input
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          handleUserSearch(e.target.value);
                        }}
                        placeholder="Search people..."
                        className="pl-10"
                      />
                      <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    </div>

                    {searchResults.length > 0 && (
                      <div className="space-y-2">
                        {searchResults.map((user) => (
                          <motion.div
                            key={user.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                          >
                            <div className="flex items-center space-x-3">
                              <Avatar
                                src={user.avatar_url}
                                alt={user.full_name}
                                fallback={user.full_name[0]}
                              />
                              <span className="font-medium">
                                {user.full_name}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              onClick={() => handleAddUser(user)}
                            >
                              Add
                            </Button>
                          </motion.div>
                        ))}
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowUserSearch(false);
                          setSearchQuery('');
                          setSearchResults([]);
                        }}
                      >
                        Done
                      </Button>
                    </div>
                  </motion.div>
                )}

                <div className="space-y-2">
                  {sharedWith.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Avatar
                          src={user.avatar_url}
                          alt={user.full_name}
                          fallback={user.full_name[0]}
                        />
                        <span className="font-medium">{user.full_name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveUser(user.id)}
                      >
                        <FiX className="h-4 w-4 text-red-500" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
