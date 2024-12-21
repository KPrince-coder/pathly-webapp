'use client';

import { useState, useEffect, useRef } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ScrollArea } from '@/components/ui/ScrollArea';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Settings,
  Command
} from 'lucide-react';
import { format, addMinutes, parseISO } from 'date-fns';

interface VoiceCommand {
  command: string;
  timestamp: Date;
  status: 'success' | 'error' | 'processing';
  response?: string;
}

export function TaskVoiceAssistant() {
  const { state, actions } = useTask();
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [commandHistory, setCommandHistory] = useState<VoiceCommand[]>([]);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const recognition = useRef<any>(null);
  const synthesis = useRef<SpeechSynthesis | null>(null);
  const currentUtterance = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      recognition.current = new (window as any).webkitSpeechRecognition();
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join('');
        setTranscript(transcript);
        processVoiceCommand(transcript);
      };

      recognition.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    // Initialize speech synthesis
    if (typeof window !== 'undefined') {
      synthesis.current = window.speechSynthesis;
    }

    return () => {
      if (recognition.current) {
        recognition.current.stop();
      }
      if (synthesis.current && currentUtterance.current) {
        synthesis.current.cancel();
      }
    };
  }, []);

  const processVoiceCommand = async (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    const newCommand: VoiceCommand = {
      command: normalizedCommand,
      timestamp: new Date(),
      status: 'processing'
    };

    setCommandHistory(prev => [newCommand, ...prev]);

    try {
      if (normalizedCommand.includes('create task')) {
        const title = normalizedCommand.replace('create task', '').trim();
        await actions.createTask({
          title,
          status: 'todo',
          createdAt: new Date()
        });
        speak(`Created new task: ${title}`);
        updateCommandStatus(newCommand, 'success', `Created task: ${title}`);
      }
      else if (normalizedCommand.includes('complete task')) {
        const taskTitle = normalizedCommand.replace('complete task', '').trim();
        const task = state.tasks.find(t => 
          t.title.toLowerCase().includes(taskTitle) &&
          t.status !== 'completed'
        );
        if (task) {
          await actions.updateTask({
            ...task,
            status: 'completed',
            completedAt: new Date()
          });
          speak(`Marked task as complete: ${task.title}`);
          updateCommandStatus(newCommand, 'success', `Completed task: ${task.title}`);
        } else {
          speak(`Could not find task: ${taskTitle}`);
          updateCommandStatus(newCommand, 'error', `Task not found: ${taskTitle}`);
        }
      }
      else if (normalizedCommand.includes('list tasks')) {
        const incompleteTasks = state.tasks.filter(t => t.status !== 'completed');
        const response = incompleteTasks.length > 0
          ? `You have ${incompleteTasks.length} incomplete tasks. ${
              incompleteTasks.slice(0, 3).map(t => t.title).join(', ')
            }${incompleteTasks.length > 3 ? ' and more.' : '.'}`
          : 'You have no incomplete tasks.';
        speak(response);
        updateCommandStatus(newCommand, 'success', response);
      }
      else if (normalizedCommand.includes('schedule task')) {
        const taskInfo = normalizedCommand.replace('schedule task', '').trim();
        const timeMatch = taskInfo.match(/\d{1,2}(?::\d{2})?\s*(?:am|pm)/i);
        if (timeMatch) {
          const time = timeMatch[0];
          const title = taskInfo.replace(time, '').trim();
          const [hours, minutes = '00'] = time.replace(/[^\d:]/g, '').split(':');
          const isPM = time.toLowerCase().includes('pm');
          
          const scheduledTime = new Date();
          scheduledTime.setHours(
            (parseInt(hours) % 12) + (isPM ? 12 : 0),
            parseInt(minutes),
            0,
            0
          );

          await actions.createTask({
            title,
            status: 'todo',
            createdAt: new Date(),
            timeBlock: {
              startTime: scheduledTime.toISOString(),
              endTime: addMinutes(scheduledTime, 60).toISOString()
            }
          });
          
          speak(`Scheduled task "${title}" for ${format(scheduledTime, 'h:mm a')}`);
          updateCommandStatus(
            newCommand,
            'success',
            `Scheduled: ${title} at ${format(scheduledTime, 'h:mm a')}`
          );
        } else {
          speak('Please specify a time for the task.');
          updateCommandStatus(newCommand, 'error', 'No time specified');
        }
      }
      else if (normalizedCommand.includes('summarize day')) {
        const today = new Date();
        const todaysTasks = state.tasks.filter(task => {
          const taskDate = task.timeBlock
            ? parseISO(task.timeBlock.startTime)
            : task.createdAt;
          return format(taskDate, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
        });

        const completed = todaysTasks.filter(t => t.status === 'completed').length;
        const remaining = todaysTasks.length - completed;
        const response = `Today's summary: ${completed} tasks completed, ${remaining} remaining. ${
          remaining > 0
            ? `Next up: ${todaysTasks.find(t => t.status !== 'completed')?.title}`
            : 'All tasks completed!'
        }`;
        
        speak(response);
        updateCommandStatus(newCommand, 'success', response);
      }
      else {
        speak('Sorry, I didn\'t understand that command.');
        updateCommandStatus(newCommand, 'error', 'Unknown command');
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      speak('Sorry, there was an error processing your command.');
      updateCommandStatus(newCommand, 'error', 'Processing error');
    }
  };

  const updateCommandStatus = (
    command: VoiceCommand,
    status: 'success' | 'error',
    response?: string
  ) => {
    setCommandHistory(prev =>
      prev.map(cmd =>
        cmd.command === command.command && cmd.timestamp === command.timestamp
          ? { ...cmd, status, response }
          : cmd
      )
    );
  };

  const toggleListening = () => {
    if (isListening) {
      recognition.current?.stop();
    } else {
      recognition.current?.start();
    }
    setIsListening(!isListening);
  };

  const speak = (text: string) => {
    if (!synthesis.current || isMuted) return;

    if (currentUtterance.current) {
      synthesis.current.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.volume = volume;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    currentUtterance.current = utterance;
    synthesis.current.speak(utterance);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (isMuted && currentUtterance.current) {
      currentUtterance.current.volume = volume;
    }
  };

  const adjustVolume = (newVolume: number) => {
    setVolume(newVolume);
    if (currentUtterance.current) {
      currentUtterance.current.volume = newVolume;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant={isListening ? 'default' : 'outline'}
              size="icon"
              onClick={toggleListening}
              className={isListening ? 'animate-pulse' : ''}
            >
              {isListening ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={toggleMute}
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </Button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={e => adjustVolume(parseFloat(e.target.value))}
              className="w-24"
            />
          </div>
          <div className="flex items-center space-x-2">
            {isSpeaking && (
              <Badge variant="outline" className="animate-pulse">
                Speaking...
              </Badge>
            )}
            {isListening && (
              <Badge variant="outline" className="animate-pulse">
                Listening...
              </Badge>
            )}
          </div>
        </div>

        {transcript && (
          <div className="p-3 bg-secondary/50 rounded-lg mb-4">
            <p className="text-sm font-medium">Transcript:</p>
            <p className="text-sm text-muted-foreground">{transcript}</p>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">Available Commands:</p>
          <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
            <div>• "Create task [title]"</div>
            <div>• "Complete task [title]"</div>
            <div>• "List tasks"</div>
            <div>• "Schedule task [title] at [time]"</div>
            <div>• "Summarize day"</div>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">Command History</h3>
        <ScrollArea className="h-[300px]">
          <AnimatePresence>
            {commandHistory.map((cmd, index) => (
              <motion.div
                key={`${cmd.timestamp.getTime()}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="mb-3"
              >
                <div className="flex items-start space-x-3">
                  <Command className="w-4 h-4 mt-1 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{cmd.command}</p>
                      <Badge
                        variant="outline"
                        className={cn(
                          cmd.status === 'success' && 'border-green-500 text-green-500',
                          cmd.status === 'error' && 'border-red-500 text-red-500',
                          cmd.status === 'processing' && 'border-blue-500 text-blue-500'
                        )}
                      >
                        {cmd.status}
                      </Badge>
                    </div>
                    {cmd.response && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {cmd.response}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(cmd.timestamp, 'h:mm a')}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </ScrollArea>
      </Card>
    </div>
  );
}
