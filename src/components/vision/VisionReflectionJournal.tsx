'use client';

import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { format } from 'date-fns';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';
import { VisionReflection, VisionReflectionMood } from '@/types/vision';

interface VisionReflectionJournalProps {
  goalId: string;
}

export function VisionReflectionJournal({ goalId }: VisionReflectionJournalProps) {
  const [reflections, setReflections] = useState<VisionReflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingReflection, setIsAddingReflection] = useState(false);
  const [editingReflection, setEditingReflection] = useState<VisionReflection | null>(
    null
  );
  const [newReflection, setNewReflection] = useState({
    content: '',
    mood: 'Neutral' as VisionReflectionMood,
  });
  const supabase = useSupabase();

  useEffect(() => {
    fetchReflections();
  }, [goalId]);

  const fetchReflections = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_reflections')
        .select('*')
        .eq('vision_goal_id', goalId)
        .order('reflection_date', { ascending: false });

      if (error) throw error;
      setReflections(data || []);
    } catch (error) {
      console.error('Error fetching reflections:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveReflection = async () => {
    try {
      if (editingReflection) {
        const { error } = await supabase
          .from('vision_reflections')
          .update({
            content: newReflection.content,
            mood: newReflection.mood,
          })
          .eq('id', editingReflection.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('vision_reflections').insert([
          {
            vision_goal_id: goalId,
            content: newReflection.content,
            mood: newReflection.mood,
            reflection_date: new Date().toISOString(),
          },
        ]);

        if (error) throw error;
      }

      setIsAddingReflection(false);
      setEditingReflection(null);
      setNewReflection({ content: '', mood: 'Neutral' });
      await fetchReflections();
    } catch (error) {
      console.error('Error saving reflection:', error);
    }
  };

  const handleDelete = async (reflectionId: string) => {
    try {
      const { error } = await supabase
        .from('vision_reflections')
        .delete()
        .eq('id', reflectionId);

      if (error) throw error;
      await fetchReflections();
    } catch (error) {
      console.error('Error deleting reflection:', error);
    }
  };

  const handleEdit = (reflection: VisionReflection) => {
    setEditingReflection(reflection);
    setNewReflection({
      content: reflection.content,
      mood: reflection.mood,
    });
    setIsAddingReflection(true);
  };

  const getMoodColor = (mood: VisionReflectionMood) => {
    switch (mood) {
      case 'Positive':
        return 'bg-green-100 text-green-800';
      case 'Challenging':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div>Loading reflections...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Reflection Journal</h3>
        {!isAddingReflection && (
          <Button
            variant="outline"
            onClick={() => setIsAddingReflection(true)}
            className="flex items-center"
          >
            <FiPlus className="mr-2" />
            Add Reflection
          </Button>
        )}
      </div>

      {isAddingReflection && (
        <Card className="p-4">
          <div className="space-y-4">
            <Textarea
              label="Your Reflection"
              value={newReflection.content}
              onChange={(e) =>
                setNewReflection({ ...newReflection, content: e.target.value })
              }
              placeholder="Share your thoughts, progress, and feelings about this goal..."
              rows={4}
            />

            <Select
              label="Mood"
              options={[
                { value: 'Positive', label: 'Positive' },
                { value: 'Neutral', label: 'Neutral' },
                { value: 'Challenging', label: 'Challenging' },
              ]}
              value={{ value: newReflection.mood, label: newReflection.mood }}
              onChange={(value) =>
                setNewReflection({
                  ...newReflection,
                  mood: value.value as VisionReflectionMood,
                })
              }
            />

            <div className="flex justify-end space-x-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAddingReflection(false);
                  setEditingReflection(null);
                  setNewReflection({ content: '', mood: 'Neutral' });
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveReflection}
                disabled={!newReflection.content.trim()}
              >
                {editingReflection ? 'Update' : 'Save'} Reflection
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {reflections.map((reflection) => (
          <Card key={reflection.id} className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {format(new Date(reflection.reflectionDate), 'MMM dd, yyyy')}
                </span>
                <Badge className={getMoodColor(reflection.mood)}>
                  {reflection.mood}
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(reflection)}
                >
                  <FiEdit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(reflection.id)}
                >
                  <FiTrash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>
            <p className="mt-2 text-gray-600 whitespace-pre-wrap">
              {reflection.content}
            </p>
          </Card>
        ))}

        {reflections.length === 0 && !isAddingReflection && (
          <div className="text-center py-8 text-gray-500">
            No reflections yet. Start journaling your progress!
          </div>
        )}
      </div>
    </div>
  );
}
