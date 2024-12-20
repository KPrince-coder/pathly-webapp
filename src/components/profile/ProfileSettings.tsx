import React, { useState, useEffect } from 'react';
import { useSupabase, useSupabaseUser } from '@/hooks/useSupabase';
import { motion } from 'framer-motion';
import { Camera, User, Lock, Bell, Moon, Sun, LogOut } from 'react-feather';
import { toast } from 'react-hot-toast';
import { generateRandomAvatar } from '@/lib/avatar';

const AVATAR_OPTIONS = [
  '/avatars/default1.png',
  '/avatars/default2.png',
  '/avatars/default3.png',
  '/avatars/default4.png',
  '/avatars/default5.png',
];

interface ProfileData {
  username: string;
  display_name: string;
  bio: string;
  avatar_type: 'default' | 'custom' | 'generated';
  avatar_url: string;
  theme_preference: {
    mode: 'light' | 'dark';
    color: string;
  };
  privacy_settings: {
    default_note_visibility: 'private' | 'public';
    show_online_status: boolean;
  };
  notification_settings: {
    email: boolean;
    push: boolean;
  };
}

export const ProfileSettings: React.FC = () => {
  const supabase = useSupabase();
  const user = useSupabaseUser();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [selectedTab, setSelectedTab] = useState('profile');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (file: File) => {
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user?.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      await updateProfile({
        avatar_type: 'custom',
        avatar_url: publicUrl,
      });

      toast.success('Avatar updated successfully!');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Failed to upload avatar');
    }
  };

  const generateNewAvatar = async () => {
    try {
      const newAvatar = generateRandomAvatar();
      await updateProfile({
        avatar_type: 'generated',
        avatar_url: newAvatar,
      });
      toast.success('Generated new avatar!');
    } catch (error) {
      console.error('Error generating avatar:', error);
      toast.error('Failed to generate avatar');
    }
  };

  const updateProfile = async (updates: Partial<ProfileData>) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user?.id);

      if (error) throw error;
      setProfile((prev) => ({ ...prev!, ...updates }));
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.new !== passwordData.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.new,
      });

      if (error) throw error;
      toast.success('Password updated successfully!');
      setIsChangingPassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Failed to change password');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      toast.success('Logged out successfully!');
    } catch (error) {
      console.error('Error logging out:', error);
      toast.error('Failed to log out');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex space-x-6">
        <div className="w-64 space-y-4">
          <div className="relative group">
            <img
              src={profile?.avatar_url || '/avatars/default.png'}
              alt="Profile"
              className="w-64 h-64 rounded-lg object-cover"
            />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
              <div className="hidden group-hover:flex space-x-2">
                <label className="cursor-pointer p-2 bg-white rounded-full hover:bg-gray-100">
                  <Camera className="w-5 h-5" />
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleAvatarChange(e.target.files[0])}
                  />
                </label>
                <button
                  onClick={generateNewAvatar}
                  className="p-2 bg-white rounded-full hover:bg-gray-100"
                >
                  <User className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              onClick={() => setSelectedTab('profile')}
              className={`w-full text-left p-2 rounded ${
                selectedTab === 'profile' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <User className="inline-block w-5 h-5 mr-2" /> Profile
            </button>
            <button
              onClick={() => setSelectedTab('security')}
              className={`w-full text-left p-2 rounded ${
                selectedTab === 'security' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <Lock className="inline-block w-5 h-5 mr-2" /> Security
            </button>
            <button
              onClick={() => setSelectedTab('notifications')}
              className={`w-full text-left p-2 rounded ${
                selectedTab === 'notifications' ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-50'
              }`}
            >
              <Bell className="inline-block w-5 h-5 mr-2" /> Notifications
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left p-2 rounded text-red-600 hover:bg-red-50"
            >
              <LogOut className="inline-block w-5 h-5 mr-2" /> Logout
            </button>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-lg p-6 shadow-sm">
          {selectedTab === 'profile' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Profile Settings</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={profile?.username || ''}
                    onChange={(e) => updateProfile({ username: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Name</label>
                  <input
                    type="text"
                    value={profile?.display_name || ''}
                    onChange={(e) => updateProfile({ display_name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Bio</label>
                  <textarea
                    value={profile?.bio || ''}
                    onChange={(e) => updateProfile({ bio: e.target.value })}
                    rows={4}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'security' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Security Settings</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">Password</span>
                  <button
                    onClick={() => setIsChangingPassword(!isChangingPassword)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Change Password
                  </button>
                </div>
                {isChangingPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4"
                  >
                    <input
                      type="password"
                      placeholder="Current Password"
                      value={passwordData.current}
                      onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="New Password"
                      value={passwordData.new}
                      onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <input
                      type="password"
                      placeholder="Confirm New Password"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <button
                      onClick={handlePasswordChange}
                      className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Update Password
                    </button>
                  </motion.div>
                )}
                <div>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={profile?.privacy_settings.show_online_status}
                      onChange={(e) =>
                        updateProfile({
                          privacy_settings: {
                            ...profile?.privacy_settings!,
                            show_online_status: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">Show online status</span>
                  </label>
                </div>
              </div>
            </motion.div>
          )}

          {selectedTab === 'notifications' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold">Notification Settings</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile?.notification_settings.email}
                    onChange={(e) =>
                      updateProfile({
                        notification_settings: {
                          ...profile?.notification_settings!,
                          email: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={profile?.notification_settings.push}
                    onChange={(e) =>
                      updateProfile({
                        notification_settings: {
                          ...profile?.notification_settings!,
                          push: e.target.checked,
                        },
                      })
                    }
                    className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Push notifications</span>
                </label>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSettings;
