'use client';

import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import {
  FiPlus,
  FiCalendar,
  FiSmile,
  FiMeh,
  FiAlertCircle,
  FiTrash2,
  FiEdit2,
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

interface Reflection {
  id: string;
  reflection_date: string;
  content: string;
  mood: 'Positive' | 'Neutral' | 'Challenging';
  created_at: string;
}

interface VisionReflectionFormProps {
  goalId: string;
  reflections: Reflection[];
  onUpdate?: () => void;
}

export function VisionReflectionForm({
  goalId,
  reflections: initialReflections,
  onUpdate,
}: VisionReflectionFormProps) {
  const [reflections, setReflections] = useState<Reflection[]>(initialReflections);
  const [showNewReflection, setShowNewReflection] = useState(false);
  const [newReflection, setNewReflection] = useState<Partial<Reflection>>({
    reflection_date: new Date().toISOString(),
    content: '',
    mood: 'Neutral',
  });
  const supabase = useSupabase();

  const handleAddReflection = async () => {
    try {
      const { error } = await supabase.from('vision_reflections').insert([
        {
          vision_goal_id: goalId,
          reflection_date: newReflection.reflection_date,
          content: newReflection.content,
          mood: newReflection.mood,
        },
      ]);

      if (error) throw error;
      setShowNewReflection(false);
      setNewReflection({
        reflection_date: new Date().toISOString(),
        content: '',
        mood: 'Neutral',
      });
      onUpdate?.();
    } catch (error) {
      console.error('Error adding reflection:', error);
    }
  };

  const handleDeleteReflection = async (id: string) => {
    try {
      const { error } = await supabase
        .from('vision_reflections')
        .delete()
        .eq('id', id);

      if (error) throw error;
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting reflection:', error);
    }
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'Positive':
        return <FiSmile className="h-5 w-5 text-success-500" />;
      case 'Challenging':
        return <FiAlertCircle className="h-5 w-5 text-error-500" />;
      default:
        return <FiMeh className="h-5 w-5 text-warning-500" />;
    }
  };

  const getMoodColor = (mood: string) => {
    switch (mood) {
      case 'Positive':
        return colors.success[500];
      case 'Challenging':
        return colors.error[500];
      default:
        return colors.warning[500];
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Reflections & Notes</h3>
        <Button
          onClick={() => setShowNewReflection(true)}
          className="flex items-center space-x-2"
        >
          <FiPlus className="h-4 w-4" />
          <span>Add Reflection</span>
        </Button>
      </div>

      <AnimatePresence mode="popLayout">
        {showNewReflection && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="p-6 space-y-4">
              <DatePicker
                label="Reflection Date"
                date={
                  newReflection.reflection_date
                    ? new Date(newReflection.reflection_date)
                    : null
                }
                onDateChange={(date) =>
                  setNewReflection((prev) => ({
                    ...prev,
                    reflection_date: date?.toISOString(),
                  }))
                }
              />

              <Textarea
                label="Reflection"
                value={newReflection.content}
                onChange={(e) =>
                  setNewReflection((prev) => ({
                    ...prev,
                    content: e.target.value,
                  }))
                }
                placeholder="Share your thoughts, progress, and learnings..."
                rows={4}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mood
                </label>
                <div className="flex space-x-2">
                  {['Positive', 'Neutral', 'Challenging'].map((mood) => (
                    <Button
                      key={mood}
                      type="button"
                      variant={
                        newReflection.mood === mood ? 'default' : 'outline'
                      }
                      onClick={() =>
                        setNewReflection((prev) => ({
                          ...prev,
                          mood: mood as Reflection['mood'],
                        }))
                      }
                      className="flex items-center space-x-2"
                      style={{
                        borderColor:
                          newReflection.mood === mood
                            ? getMoodColor(mood)
                            : undefined,
                        backgroundColor:
                          newReflection.mood === mood
                            ? getMoodColor(mood)
                            : undefined,
                        color: newReflection.mood === mood ? 'white' : undefined,
                      }}
                    >
                      {getMoodIcon(mood)}
                      <span>{mood}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  variant="outline"
                  onClick={() => setShowNewReflection(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddReflection}>Add Reflection</Button>
              </div>
            </Card>
          </motion.div>
        )}

        <div className="space-y-4">
          {reflections.map((reflection, index) => (
            <motion.div
              key={reflection.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <FiCalendar className="h-4 w-4" />
                        <span>
                          {format(
                            new Date(reflection.reflection_date),
                            'MMM dd, yyyy'
                          )}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className="flex items-center space-x-1"
                        style={{
                          borderColor: getMoodColor(reflection.mood),
                          color: getMoodColor(reflection.mood),
                        }}
                      >
                        {getMoodIcon(reflection.mood)}
                        <span>{reflection.mood}</span>
                      </Badge>
                    </div>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {reflection.content}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReflection(reflection.id)}
                    >
                      <FiTrash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
