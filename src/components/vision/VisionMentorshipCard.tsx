'use client';

import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FiUserPlus,
  FiMessageSquare,
  FiCheck,
  FiX,
  FiClock,
  FiUser,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';
import { VisionMentorChat } from './VisionMentorChat';

interface Mentor {
  id: string;
  full_name: string;
  avatar_url?: string;
  expertise?: string[];
  status: 'Pending' | 'Active' | 'Completed' | 'Declined';
  created_at: string;
}

interface VisionMentorshipCardProps {
  goalId: string;
  mentors: Mentor[];
  onUpdate?: () => void;
}

export function VisionMentorshipCard({
  goalId,
  mentors: initialMentors,
  onUpdate,
}: VisionMentorshipCardProps) {
  const [mentors, setMentors] = useState<Mentor[]>(initialMentors);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showChat, setShowChat] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const supabase = useSupabase();

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url, expertise')
        .ilike('full_name', `%${query}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const handleInviteMentor = async (mentorId: string) => {
    try {
      const { error } = await supabase.from('vision_mentorship').insert([
        {
          vision_goal_id: goalId,
          mentor_id: mentorId,
          mentee_id: (await supabase.auth.getUser()).data.user?.id,
          status: 'Pending',
        },
      ]);

      if (error) throw error;
      setShowInvite(false);
      setSearchQuery('');
      setSearchResults([]);
      onUpdate?.();
    } catch (error) {
      console.error('Error inviting mentor:', error);
    }
  };

  const handleUpdateStatus = async (mentorId: string, status: Mentor['status']) => {
    try {
      const { error } = await supabase
        .from('vision_mentorship')
        .update({ status })
        .match({ vision_goal_id: goalId, mentor_id: mentorId });

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error updating mentor status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return colors.success[500];
      case 'Pending':
        return colors.warning[500];
      case 'Declined':
        return colors.error[500];
      default:
        return colors.neutral[500];
    }
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Mentorship</h3>
        <Button
          onClick={() => setShowInvite(true)}
          className="flex items-center space-x-2"
        >
          <FiUserPlus className="h-4 w-4" />
          <span>Invite Mentor</span>
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {showInvite && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            <Input
              label="Search Users"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                handleSearch(e.target.value);
              }}
              placeholder="Search by name..."
            />

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
                      <div>
                        <p className="font-medium">{user.full_name}</p>
                        {user.expertise && (
                          <div className="flex gap-1 mt-1">
                            {user.expertise.map((exp: string) => (
                              <Badge
                                key={exp}
                                variant="secondary"
                                className="text-xs"
                              >
                                {exp}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInviteMentor(user.id)}
                    >
                      Invite
                    </Button>
                  </motion.div>
                ))}
              </div>
            )}

            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInvite(false);
                  setSearchQuery('');
                  setSearchResults([]);
                }}
              >
                Cancel
              </Button>
            </div>
          </motion.div>
        )}

        <div className="space-y-4">
          {mentors.map((mentor, index) => (
            <motion.div
              key={mentor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar
                      src={mentor.avatar_url}
                      alt={mentor.full_name}
                      fallback={mentor.full_name[0]}
                    />
                    <div>
                      <p className="font-medium">{mentor.full_name}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FiClock className="h-4 w-4" />
                        <span>
                          Joined{' '}
                          {format(new Date(mentor.created_at), 'MMM dd, yyyy')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getStatusColor(mentor.status),
                        color: getStatusColor(mentor.status),
                      }}
                    >
                      {mentor.status}
                    </Badge>

                    {mentor.status === 'Active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedMentor(mentor);
                          setShowChat(true);
                        }}
                      >
                        <FiMessageSquare className="h-4 w-4" />
                      </Button>
                    )}

                    {mentor.status === 'Pending' && (
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(mentor.id, 'Declined')
                          }
                        >
                          <FiX className="h-4 w-4 text-red-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(mentor.id, 'Active')
                          }
                        >
                          <FiCheck className="h-4 w-4 text-green-500" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>

      {showChat && selectedMentor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl">
            <VisionMentorChat
              goalId={goalId}
              mentorId={selectedMentor.id}
              menteeId={(await supabase.auth.getUser()).data.user?.id}
              onClose={() => {
                setShowChat(false);
                setSelectedMentor(null);
              }}
            />
          </div>
        </div>
      )}
    </Card>
  );
}
