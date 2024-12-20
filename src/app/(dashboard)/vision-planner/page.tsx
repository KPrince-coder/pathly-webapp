'use client';

import { useState } from 'react';
import { VisionGoalList } from '@/components/vision/VisionGoalList';
import { VisionGoalForm } from '@/components/vision/VisionGoalForm';
import { VisionTimeline } from '@/components/vision/VisionTimeline';
import { VisionStats } from '@/components/vision/VisionStats';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { FiPlus } from 'react-icons/fi';

export default function VisionPlannerPage() {
  const [showNewGoalModal, setShowNewGoalModal] = useState(false);
  const [view, setView] = useState<'list' | 'timeline'>('list');

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vision Planner</h1>
          <p className="text-gray-600 mt-2">
            Plan and track your long-term goals and aspirations
          </p>
        </div>
        <Button
          onClick={() => setShowNewGoalModal(true)}
          className="flex items-center"
        >
          <FiPlus className="mr-2" />
          New Vision Goal
        </Button>
      </div>

      <VisionStats className="mb-8" />

      <div className="flex justify-end space-x-4 mb-6">
        <Button
          variant={view === 'list' ? 'default' : 'outline'}
          onClick={() => setView('list')}
        >
          List View
        </Button>
        <Button
          variant={view === 'timeline' ? 'default' : 'outline'}
          onClick={() => setView('timeline')}
        >
          Timeline
        </Button>
      </div>

      {view === 'list' ? (
        <VisionGoalList />
      ) : (
        <VisionTimeline />
      )}

      <Modal
        isOpen={showNewGoalModal}
        onClose={() => setShowNewGoalModal(false)}
        title="Create New Vision Goal"
      >
        <VisionGoalForm
          onSubmit={() => {
            setShowNewGoalModal(false);
            // Refresh goals list
          }}
        />
      </Modal>
    </div>
  );
}
