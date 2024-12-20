'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Modal } from '@/components/ui/Modal';
import { format } from 'date-fns';
import { FiUserPlus, FiCheck, FiX } from 'react-icons/fi';
import { VisionMentorship, MentorshipStatus } from '@/types/vision';

interface VisionMentorshipProps {
  goalId: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
}

export function VisionMentorship({ goalId }: VisionMentorshipProps) {
  const [mentorships, setMentorships] = useState<
    (VisionMentorship & { mentor: UserProfile; mentee: UserProfile })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const supabase = useSupabase();

  useEffect(() => {
    fetchMentorships();
  }, [goalId]);

  const fetchMentorships = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_mentorship')
        .select(
          `
          *,
          mentor:mentor_id(id, email, full_name, avatar_url),
          mentee:mentee_id(id, email, full_name, avatar_url)
        `
        )
        .eq('vision_goal_id', goalId);

      if (error) throw error;
      setMentorships(data || []);
    } catch (error) {
      console.error('Error fetching mentorships:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async (email: string) => {
    if (!email) {
      setSearchResults([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name, avatar_url')
        .ilike('email', `%${email}%`)
        .limit(5);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Error searching users:', error);
    }
  };

  const inviteMentor = async (mentorId: string) => {
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
      setShowInviteModal(false);
      setInviteEmail('');
      setSearchResults([]);
      await fetchMentorships();
    } catch (error) {
      console.error('Error inviting mentor:', error);
    }
  };

  const updateMentorshipStatus = async (
    mentorshipId: string,
    status: MentorshipStatus
  ) => {
    try {
      const { error } = await supabase
        .from('vision_mentorship')
        .update({ status })
        .eq('id', mentorshipId);

      if (error) throw error;
      await fetchMentorships();
    } catch (error) {
      console.error('Error updating mentorship status:', error);
    }
  };

  const getStatusColor = (status: MentorshipStatus) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Declined':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading mentorships...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Mentorship</h3>
        <Button
          variant="outline"
          onClick={() => setShowInviteModal(true)}
          className="flex items-center"
        >
          <FiUserPlus className="mr-2" />
          Invite Mentor
        </Button>
      </div>

      <div className="space-y-4">
        {mentorships.map((mentorship) => (
          <Card key={mentorship.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <Avatar
                  src={mentorship.mentor.avatar_url}
                  alt={mentorship.mentor.full_name}
                  fallback={mentorship.mentor.full_name[0]}
                />
                <div>
                  <h4 className="font-medium text-gray-900">
                    {mentorship.mentor.full_name}
                  </h4>
                  <p className="text-sm text-gray-500">
                    {mentorship.mentor.email}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(mentorship.status)}>
                {mentorship.status}
              </Badge>
            </div>

            {mentorship.status === 'Pending' && (
              <div className="mt-4 flex justify-end space-x-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    updateMentorshipStatus(mentorship.id, 'Declined')
                  }
                >
                  <FiX className="mr-2" />
                  Decline
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateMentorshipStatus(mentorship.id, 'Active')}
                >
                  <FiCheck className="mr-2" />
                  Accept
                </Button>
              </div>
            )}
          </Card>
        ))}

        {mentorships.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No mentors yet. Invite someone to guide you on your journey!
          </div>
        )}
      </div>

      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setInviteEmail('');
          setSearchResults([]);
        }}
        title="Invite a Mentor"
      >
        <div className="space-y-4">
          <Input
            label="Search by Email"
            value={inviteEmail}
            onChange={(e) => {
              setInviteEmail(e.target.value);
              searchUsers(e.target.value);
            }}
            placeholder="Enter email address"
          />

          <div className="space-y-2">
            {searchResults.map((user) => (
              <div
                key={user.id}
                className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer"
                onClick={() => inviteMentor(user.id)}
              >
                <div className="flex items-center space-x-3">
                  <Avatar
                    src={user.avatar_url}
                    alt={user.full_name}
                    fallback={user.full_name[0]}
                  />
                  <div>
                    <p className="font-medium text-gray-900">{user.full_name}</p>
                    <p className="text-sm text-gray-500">{user.email}</p>
                  </div>
                </div>
                <Button size="sm">Invite</Button>
              </div>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  );
}
