'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import dynamic from 'next/dynamic';
import { RealtimeChannel } from '@supabase/supabase-js';
import useFeatureStore from '@/store/features';
import {
  FiUsers,
  FiMessageSquare,
  FiVideo,
  FiMic,
  FiMicOff,
  FiVideoOff,
  FiShare2,
  FiLock,
} from 'react-icons/fi';

// Dynamic imports for heavy components
const ForceGraph = dynamic(() => import('react-force-graph'), { ssr: false });
const ThreeScene = dynamic(() => import('./ThreeScene'), { ssr: false });

interface Participant {
  id: string;
  name: string;
  avatar: string;
  cursor: { x: number; y: number };
  selection: { start: number; end: number };
  camera: boolean;
  microphone: boolean;
  status: 'active' | 'idle' | 'away';
}

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  type: 'text' | 'file' | 'code' | 'drawing';
  metadata?: any;
}

interface SharedDocument {
  id: string;
  type: 'note' | 'code' | 'canvas';
  content: string;
  version: number;
  lastEdit: {
    user: string;
    timestamp: Date;
  };
  cursors: Record<string, { x: number; y: number }>;
  selections: Record<string, { start: number; end: number }>;
}

const LiveWorkspace: React.FC = () => {
  const supabase = useSupabaseClient();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeDocument, setActiveDocument] = useState<SharedDocument | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({});
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize real-time collaboration
  useEffect(() => {
    const initCollaboration = async () => {
      // Subscribe to presence channel
      const channel = supabase.channel('workspace');
      
      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState();
          updateParticipants(state);
        })
        .on('presence', { event: 'join' }, ({ key, newPresence }) => {
          // Handle new participant
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresence }) => {
          // Handle participant leave
        })
        .on('broadcast', { event: 'cursor' }, ({ payload }) => {
          // Handle cursor updates
        })
        .on('broadcast', { event: 'selection' }, ({ payload }) => {
          // Handle selection updates
        })
        .on('broadcast', { event: 'edit' }, ({ payload }) => {
          // Handle document edits
        });

      await channel.subscribe();
      setChannel(channel);
    };

    initCollaboration();
  }, []);

  // Initialize WebRTC
  useEffect(() => {
    const initWebRTC = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
      }
    };

    initWebRTC();
    return () => {
      localStream?.getTracks().forEach(track => track.stop());
    };
  }, []);

  // Track cursor movements
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!channel) return;

      const cursor = {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      };

      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: cursor,
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [channel]);

  // Handle document changes
  const handleDocumentChange = (content: string) => {
    if (!channel || !activeDocument) return;

    channel.send({
      type: 'broadcast',
      event: 'edit',
      payload: {
        documentId: activeDocument.id,
        content,
        version: activeDocument.version + 1,
      },
    });
  };

  // Send message
  const sendMessage = (content: string, type: Message['type'] = 'text') => {
    if (!channel) return;

    const message: Message = {
      id: crypto.randomUUID(),
      sender: 'current-user',
      content,
      timestamp: new Date(),
      type,
    };

    channel.send({
      type: 'broadcast',
      event: 'message',
      payload: message,
    });

    setMessages(prev => [...prev, message]);
  };

  // Update participants from presence state
  const updateParticipants = (state: Record<string, any>) => {
    const participantList = Object.entries(state).map(([key, value]) => ({
      id: key,
      ...value[0],
    }));
    setParticipants(participantList);
  };

  return (
    <div className="flex h-screen">
      {/* Participants Sidebar */}
      <div className="w-64 bg-white border-r">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Participants</h2>
          <div className="space-y-2">
            {participants.map(participant => (
              <motion.div
                key={participant.id}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-8 h-8 rounded-full"
                />
                <div>
                  <div className="font-medium">{participant.name}</div>
                  <div className="text-sm text-gray-500">{participant.status}</div>
                </div>
                <div className="ml-auto flex items-center gap-1">
                  {participant.camera && <FiVideo className="w-4 h-4" />}
                  {participant.microphone && <FiMic className="w-4 h-4" />}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="h-16 border-b bg-white px-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <FiShare2 className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <FiLock className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            {localStream && (
              <>
                <button
                  onClick={() => {
                    const videoTrack = localStream.getVideoTracks()[0];
                    videoTrack.enabled = !videoTrack.enabled;
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {localStream.getVideoTracks()[0].enabled ? (
                    <FiVideo className="w-5 h-5" />
                  ) : (
                    <FiVideoOff className="w-5 h-5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    const audioTrack = localStream.getAudioTracks()[0];
                    audioTrack.enabled = !audioTrack.enabled;
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  {localStream.getAudioTracks()[0].enabled ? (
                    <FiMic className="w-5 h-5" />
                  ) : (
                    <FiMicOff className="w-5 h-5" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex">
          {/* Document/Canvas */}
          <div className="flex-1 relative">
            {activeDocument && (
              <>
                {/* Cursors */}
                {Object.entries(activeDocument.cursors).map(([userId, cursor]) => (
                  <motion.div
                    key={userId}
                    className="absolute w-4 h-4 pointer-events-none"
                    style={{
                      left: `${cursor.x * 100}%`,
                      top: `${cursor.y * 100}%`,
                    }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    <div className="w-3 h-3 transform rotate-45 bg-blue-500" />
                    <div className="absolute top-4 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded whitespace-nowrap">
                      {participants.find(p => p.id === userId)?.name}
                    </div>
                  </motion.div>
                ))}

                {/* Content */}
                {activeDocument.type === 'canvas' && (
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full"
                  />
                )}
              </>
            )}
          </div>

          {/* Chat */}
          <div className="w-80 border-l bg-white">
            <div className="flex flex-col h-full">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Chat</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'current-user'
                        ? 'justify-end'
                        : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === 'current-user'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-100'
                      }`}
                    >
                      <div className="text-sm">
                        {message.sender !== 'current-user' && (
                          <div className="font-medium mb-1">
                            {participants.find(p => p.id === message.sender)?.name}
                          </div>
                        )}
                        {message.content}
                      </div>
                      <div className="text-xs opacity-75 mt-1">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t">
                <input
                  type="text"
                  placeholder="Type a message..."
                  className="w-full px-4 py-2 border rounded-lg"
                  onKeyPress={e => {
                    if (e.key === 'Enter') {
                      sendMessage(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Grid */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        {localStream && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-48 h-36 bg-black rounded-lg overflow-hidden"
          >
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          </motion.div>
        )}
        {Object.entries(remoteStreams).map(([userId, stream]) => (
          <motion.div
            key={userId}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-48 h-36 bg-black rounded-lg overflow-hidden"
          >
            <video
              autoPlay
              playsInline
              className="w-full h-full object-cover"
              ref={el => {
                if (el) el.srcObject = stream;
              }}
            />
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default LiveWorkspace;
