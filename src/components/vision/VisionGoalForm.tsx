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
import { Switch } from '@/components/ui/Switch';
import { useSupabase } from '@/hooks/useSupabase';
import { VisionGoalCategory } from '@/types/vision';

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.object({
    value: z.string(),
    label: z.string(),
  }),
  targetDate: z.date(),
  isSmartGoal: z.boolean(),
  smartDetails: z.object({
    specific: z.string().optional(),
    measurable: z.object({
      metric: z.string(),
      targetValue: z.number(),
      unit: z.string(),
    }).optional(),
    achievable: z.array(z.string()).optional(),
    relevant: z.string().optional(),
    timeBound: z.object({
      startDate: z.string(),
      endDate: z.string(),
      checkpoints: z.array(z.string()),
    }).optional(),
  }).optional(),
});

type FormData = z.infer<typeof schema>;

interface VisionGoalFormProps {
  onSubmit: () => void;
  initialData?: Partial<FormData>;
}

export function VisionGoalForm({ onSubmit, initialData }: VisionGoalFormProps) {
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
    defaultValues: initialData,
  });

  const isSmartGoal = watch('isSmartGoal');

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vision_goals').insert([
        {
          title: data.title,
          description: data.description,
          category: data.category.value,
          target_date: data.targetDate.toISOString(),
          is_smart_goal: data.isSmartGoal,
          specific_details: data.isSmartGoal ? { specific: data.smartDetails?.specific } : null,
          measurable_metrics: data.isSmartGoal ? data.smartDetails?.measurable : null,
          achievable_steps: data.isSmartGoal ? data.smartDetails?.achievable : null,
          relevant_reasons: data.isSmartGoal ? data.smartDetails?.relevant : null,
          time_bound_dates: data.isSmartGoal ? data.smartDetails?.timeBound : null,
        },
      ]);

      if (error) throw error;
      onSubmit();
    } catch (error) {
      console.error('Error creating vision goal:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div>
        <Input
          label="Goal Title"
          {...register('title')}
          error={errors.title?.message}
          placeholder="Enter your long-term goal"
        />
      </div>

      <div>
        <Textarea
          label="Description"
          {...register('description')}
          error={errors.description?.message}
          placeholder="Describe your goal in detail"
        />
      </div>

      <div>
        <Select
          label="Category"
          options={[
            { value: 'Career', label: 'Career' },
            { value: 'Personal', label: 'Personal' },
            { value: 'Relationships', label: 'Relationships' },
            { value: 'Financial', label: 'Financial' },
            { value: 'Health', label: 'Health' },
            { value: 'Education', label: 'Education' },
            { value: 'Other', label: 'Other' },
          ]}
          value={watch('category')}
          onChange={(value) => setValue('category', value)}
          error={errors.category?.message}
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

      <div className="flex items-center space-x-2">
        <Switch
          checked={watch('isSmartGoal')}
          onCheckedChange={(checked) => setValue('isSmartGoal', checked)}
        />
        <span className="text-sm font-medium text-gray-700">
          Make this a SMART goal
        </span>
      </div>

      {isSmartGoal && (
        <div className="space-y-4 border rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900">SMART Goal Details</h3>
          
          <div>
            <Input
              label="Specific"
              {...register('smartDetails.specific')}
              placeholder="What exactly do you want to accomplish?"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Metric"
              {...register('smartDetails.measurable.metric')}
              placeholder="What to measure"
            />
            <Input
              label="Target Value"
              type="number"
              {...register('smartDetails.measurable.targetValue')}
              placeholder="Target number"
            />
            <Input
              label="Unit"
              {...register('smartDetails.measurable.unit')}
              placeholder="Unit of measurement"
            />
          </div>

          <div>
            <Textarea
              label="Relevant"
              {...register('smartDetails.relevant')}
              placeholder="Why is this goal important to you?"
            />
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Creating...' : 'Create Vision Goal'}
        </Button>
      </div>
    </form>
  );
}
