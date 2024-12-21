'use client';

import { useState, useEffect, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FiSend,
  FiPaperclip,
  FiImage,
  FiMoreVertical,
  FiChevronLeft,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  attachments?: {
    type: 'image' | 'file';
    url: string;
    name: string;
  }[];
}

interface ChatParticipant {
  id: string;
  full_name: string;
  avatar_url?: string;
}

interface VisionMentorChatProps {
  goalId: string;
  mentorId: string;
  menteeId: string;
  onClose?: () => void;
}

export function VisionMentorChat({
  goalId,
  mentorId,
  menteeId,
  onClose,
}: VisionMentorChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [participants, setParticipants] = useState<{
    mentor: ChatParticipant;
    mentee: ChatParticipant;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const supabase = useSupabase();

  useEffect(() => {
    fetchParticipants();
    fetchMessages();
    subscribeToNewMessages();
  }, [goalId, mentorId, menteeId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchParticipants = async () => {
    try {
      const { data: mentorData, error: mentorError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', mentorId)
        .single();

      const { data: menteeData, error: menteeError } = await supabase
        .from('profiles')
        .select('id, full_name, avatar_url')
        .eq('id', menteeId)
        .single();

      if (mentorError) throw mentorError;
      if (menteeError) throw menteeError;

      setParticipants({
        mentor: mentorData,
        mentee: menteeData,
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_messages')
        .select('*')
        .eq('vision_goal_id', goalId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      setIsLoading(false);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setIsLoading(false);
    }
  };

  const subscribeToNewMessages = () => {
    const channel = supabase
      .channel(`vision_messages:${goalId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vision_messages',
          filter: `vision_goal_id=eq.${goalId}`,
        },
        (payload) => {
          setMessages((current) => [...current, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const { error } = await supabase.from('vision_messages').insert([
        {
          vision_goal_id: goalId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          content: newMessage,
        },
      ]);

      if (error) throw error;
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `vision-messages/${goalId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('attachments')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('attachments')
        .getPublicUrl(filePath);

      await supabase.from('vision_messages').insert([
        {
          vision_goal_id: goalId,
          sender_id: (await supabase.auth.getUser()).data.user?.id,
          content: 'Sent an attachment',
          attachments: [
            {
              type: file.type.startsWith('image/') ? 'image' : 'file',
              url: publicUrl,
              name: file.name,
            },
          ],
        },
      ]);
    } catch (error) {
      console.error('Error uploading file:', error);
    }
  };

  if (isLoading) {
    return <div>Loading chat...</div>;
  }

  if (!participants) {
    return <div>Error loading chat participants</div>;
  }

  return (
    <Card className="flex flex-col h-[600px]">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FiChevronLeft className="h-5 w-5" />
          </Button>
          <Avatar
            src={participants.mentor.avatar_url}
            alt={participants.mentor.full_name}
            fallback={participants.mentor.full_name[0]}
          />
          <div>
            <p className="font-medium">{participants.mentor.full_name}</p>
            <p className="text-sm text-gray-500">Mentor</p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <FiMoreVertical className="h-5 w-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence mode="popLayout">
          {messages.map((message, index) => {
            const isSender = message.sender_id === (participants.mentee.id);
            const participant = isSender
              ? participants.mentee
              : participants.mentor;

            return (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                className={`flex ${isSender ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-start space-x-2 max-w-[70%] ${
                    isSender ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  <Avatar
                    src={participant.avatar_url}
                    alt={participant.full_name}
                    fallback={participant.full_name[0]}
                    className="h-8 w-8"
                  />
                  <div>
                    <div
                      className={`rounded-lg p-3 ${
                        isSender
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 text-gray-900'
                      }`}
                    >
                      {message.attachments?.map((attachment, i) => (
                        <div key={i} className="mb-2">
                          {attachment.type === 'image' ? (
                            <img
                              src={attachment.url}
                              alt={attachment.name}
                              className="rounded-lg max-w-full"
                            />
                          ) : (
                            <a
                              href={attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center space-x-2 text-sm underline"
                            >
                              <FiPaperclip className="h-4 w-4" />
                              <span>{attachment.name}</span>
                            </a>
                          )}
                        </div>
                      ))}
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t">
        <div className="flex items-center space-x-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1"
          />
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx"
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <FiPaperclip className="h-5 w-5" />
          </Button>
          <Button onClick={handleSendMessage}>
            <FiSend className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
