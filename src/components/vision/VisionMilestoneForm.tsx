'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Slider } from '@/components/ui/Slider';
import { useSupabase } from '@/hooks/useSupabase';
import { VisionMilestone, VisionMilestoneStatus } from '@/types/vision';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  targetDate: z.date(),
  status: z.object({
    value: z.string(),
    label: z.string(),
  }),
  progress: z.number().min(0).max(100),
});

type FormData = z.infer<typeof schema>;

interface VisionMilestoneFormProps {
  goalId: string;
  initialData?: Partial<VisionMilestone>;
  onSubmit: () => void;
}

export function VisionMilestoneForm({
  goalId,
  initialData,
  onSubmit,
}: VisionMilestoneFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = useSupabase();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      targetDate: initialData?.targetDate ? new Date(initialData.targetDate) : new Date(),
      status: initialData?.status
        ? { value: initialData.status, label: initialData.status }
        : { value: 'Not Started', label: 'Not Started' },
      progress: initialData?.progress || 0,
    },
  });

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const milestoneData = {
        vision_goal_id: goalId,
        title: data.title,
        description: data.description,
        target_date: data.targetDate.toISOString(),
        status: data.status.value as VisionMilestoneStatus,
        progress: data.progress,
      };

      if (initialData?.id) {
        const { error } = await supabase
          .from('vision_milestones')
          .update(milestoneData)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('vision_milestones')
          .insert([milestoneData]);

        if (error) throw error;
      }

      onSubmit();
    } catch (error) {
      console.error('Error saving milestone:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Input
          label="Milestone Title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Enter milestone title"
        />
      </div>

      <div>
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Describe this milestone"
        />
      </div>

      <div>
        <DatePicker
          label="Target Date"
          date={watch('targetDate')}
          onDateChange={(date) => setValue('targetDate', date)}
          error={!!errors.targetDate}
        />
      </div>

      <div>
        <Select
          label="Status"
          options={[
            { value: 'Not Started', label: 'Not Started' },
            { value: 'In Progress', label: 'In Progress' },
            { value: 'Completed', label: 'Completed' },
            { value: 'On Hold', label: 'On Hold' },
          ]}
          value={watch('status')}
          onChange={(value) => setValue('status', value)}
          error={errors.status?.message}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Progress ({watch('progress')}%)
        </label>
        <Slider
          value={[watch('progress')]}
          onValueChange={(values) => setValue('progress', values[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : initialData?.id
            ? 'Update Milestone'
            : 'Create Milestone'}
        </Button>
      </div>
    </form>
  );
}
