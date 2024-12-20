'use client';

import { useState, useEffect } from 'react';
import { VisionMilestone } from '@/types/vision';
import { useSupabase } from '@/hooks/useSupabase';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { VisionMilestoneForm } from './VisionMilestoneForm';
import { format } from 'date-fns';
import { FiPlus, FiEdit2, FiTrash2 } from 'react-icons/fi';

interface VisionMilestoneListProps {
  goalId: string;
  onUpdate?: () => void;
}

export function VisionMilestoneList({ goalId, onUpdate }: VisionMilestoneListProps) {
  const [milestones, setMilestones] = useState<VisionMilestone[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<VisionMilestone | null>(null);
  const supabase = useSupabase();

  useEffect(() => {
    fetchMilestones();
  }, [goalId]);

  const fetchMilestones = async () => {
    try {
      const { data, error } = await supabase
        .from('vision_milestones')
        .select('*')
        .eq('vision_goal_id', goalId)
        .order('target_date', { ascending: true });

      if (error) throw error;
      setMilestones(data || []);
    } catch (error) {
      console.error('Error fetching milestones:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (milestoneId: string) => {
    try {
      const { error } = await supabase
        .from('vision_milestones')
        .delete()
        .eq('id', milestoneId);

      if (error) throw error;
      await fetchMilestones();
      onUpdate?.();
    } catch (error) {
      console.error('Error deleting milestone:', error);
    }
  };

  if (loading) {
    return <div>Loading milestones...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Milestones</h3>
        <Button
          variant="outline"
          onClick={() => setShowNewModal(true)}
          className="flex items-center"
        >
          <FiPlus className="mr-2" />
          Add Milestone
        </Button>
      </div>

      <div className="space-y-4">
        {milestones.map((milestone) => (
          <Card key={milestone.id} className="p-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-medium text-gray-900">{milestone.title}</h4>
                <p className="text-sm text-gray-500 mt-1">
                  Due: {format(new Date(milestone.targetDate), 'MMM dd, yyyy')}
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMilestone(milestone)}
                >
                  <FiEdit2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(milestone.id)}
                >
                  <FiTrash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </div>

            {milestone.description && (
              <p className="text-sm text-gray-600 mt-2">{milestone.description}</p>
            )}

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{milestone.progress}%</span>
              </div>
              <Progress value={milestone.progress} />
            </div>

            <div className="mt-4">
              <Badge variant={milestone.status === 'Completed' ? 'success' : 'default'}>
                {milestone.status}
              </Badge>
            </div>
          </Card>
        ))}

        {milestones.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No milestones yet. Add one to track your progress!
          </div>
        )}
      </div>

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Add New Milestone"
      >
        <VisionMilestoneForm
          goalId={goalId}
          onSubmit={() => {
            setShowNewModal(false);
            fetchMilestones();
            onUpdate?.();
          }}
        />
      </Modal>

      <Modal
        isOpen={!!editingMilestone}
        onClose={() => setEditingMilestone(null)}
        title="Edit Milestone"
      >
        {editingMilestone && (
          <VisionMilestoneForm
            goalId={goalId}
            initialData={editingMilestone}
            onSubmit={() => {
              setEditingMilestone(null);
              fetchMilestones();
              onUpdate?.();
            }}
          />
        )}
      </Modal>
    </div>
  );
}
