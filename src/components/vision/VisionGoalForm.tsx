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
import { Badge } from '@/components/ui/Badge';
import { Progress } from '@/components/ui/Progress';
import { useSupabase } from '@/hooks/useSupabase';
import { VisionGoalCategory } from '@/types/vision';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiBriefcase, 
  FiUser, 
  FiHeart, 
  FiDollarSign, 
  FiActivity, 
  FiBook, 
  FiMoreHorizontal,
  FiCalendar,
  FiFlag,
  FiClock
} from 'react-icons/fi';
import { colors } from '@/styles/colors';

const categoryIcons = {
  Career: FiBriefcase,
  Personal: FiUser,
  Relationships: FiHeart,
  Financial: FiDollarSign,
  Health: FiActivity,
  Education: FiBook,
  Other: FiMoreHorizontal,
};

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.object({
    value: z.string(),
    label: z.string(),
  }),
  priority: z.object({
    value: z.enum(['High', 'Medium', 'Low']),
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
      currentValue: z.number().optional(),
    }).optional(),
    achievable: z.array(z.string()).optional(),
    relevant: z.string().optional(),
    timeBound: z.object({
      startDate: z.string(),
      endDate: z.string(),
      checkpoints: z.array(z.string()),
    }).optional(),
  }).optional(),
  reminders: z.array(z.object({
    type: z.enum(['daily', 'weekly', 'monthly', 'custom']),
    time: z.string(),
    enabled: z.boolean(),
  })).optional(),
});

type FormData = z.infer<typeof schema>;

interface VisionGoalFormProps {
  onSubmit: () => void;
  initialData?: Partial<FormData>;
}

export function VisionGoalForm({ onSubmit, initialData }: VisionGoalFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
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
      ...initialData,
      priority: initialData?.priority || { value: 'Medium', label: 'Medium' },
      reminders: initialData?.reminders || [
        { type: 'weekly', time: '09:00', enabled: true }
      ],
    },
  });

  const isSmartGoal = watch('isSmartGoal');
  const category = watch('category');
  const CategoryIcon = category ? categoryIcons[category.value as keyof typeof categoryIcons] : null;

  const priorityColors = {
    High: colors.error[500],
    Medium: colors.warning[500],
    Low: colors.success[500],
  };

  const handleFormSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from('vision_goals').insert([
        {
          title: data.title,
          description: data.description,
          category: data.category.value,
          priority: data.priority.value,
          target_date: data.targetDate.toISOString(),
          is_smart_goal: data.isSmartGoal,
          specific_details: data.isSmartGoal ? { specific: data.smartDetails?.specific } : null,
          measurable_metrics: data.isSmartGoal ? data.smartDetails?.measurable : null,
          achievable_steps: data.isSmartGoal ? data.smartDetails?.achievable : null,
          relevant_reasons: data.isSmartGoal ? data.smartDetails?.relevant : null,
          time_bound_dates: data.isSmartGoal ? data.smartDetails?.timeBound : null,
          reminders: data.reminders,
          status: 'Not Started',
          progress: 0,
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
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-500">Step {activeStep} of 3</span>
            <Progress value={activeStep * 33.33} className="w-24" />
          </div>
        </div>
        {CategoryIcon && (
          <Badge 
            variant="outline" 
            className="flex items-center space-x-2 px-3 py-1"
            style={{ borderColor: colors[category.value.toLowerCase() as keyof typeof colors][500] }}
          >
            <CategoryIcon className="h-4 w-4" style={{ color: colors[category.value.toLowerCase() as keyof typeof colors][500] }} />
            <span>{category.value}</span>
          </Badge>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div>
              <Input
                label="Goal Title"
                {...register('title')}
                error={errors.title?.message}
                placeholder="Enter your long-term goal"
                className="text-lg font-medium"
              />
            </div>

            <div>
              <Textarea
                label="Description"
                {...register('description')}
                error={errors.description?.message}
                placeholder="Describe your goal in detail"
                className="h-32"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                options={Object.keys(categoryIcons).map(cat => ({
                  value: cat,
                  label: cat,
                }))}
                value={watch('category')}
                onChange={(value) => setValue('category', value)}
                error={errors.category?.message}
              />

              <Select
                label="Priority"
                options={[
                  { value: 'High', label: 'High' },
                  { value: 'Medium', label: 'Medium' },
                  { value: 'Low', label: 'Low' },
                ]}
                value={watch('priority')}
                onChange={(value) => setValue('priority', value)}
                renderOption={(option) => (
                  <div className="flex items-center space-x-2">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: priorityColors[option.value as keyof typeof priorityColors] }}
                    />
                    <span>{option.label}</span>
                  </div>
                )}
              />
            </div>

            <Button 
              type="button" 
              onClick={() => setActiveStep(2)}
              className="w-full"
            >
              Next: Timeline & Tracking
            </Button>
          </motion.div>
        )}

        {activeStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                label="Target Date"
                date={watch('targetDate')}
                onDateChange={(date) => setValue('targetDate', date)}
                error={!!errors.targetDate}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reminders
                </label>
                <div className="space-y-2">
                  {watch('reminders')?.map((reminder, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Select
                        value={{ value: reminder.type, label: reminder.type }}
                        onChange={(value) => {
                          const newReminders = [...(watch('reminders') || [])];
                          newReminders[index] = { ...reminder, type: value.value };
                          setValue('reminders', newReminders);
                        }}
                        options={[
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                          { value: 'monthly', label: 'Monthly' },
                          { value: 'custom', label: 'Custom' },
                        ]}
                      />
                      <Input
                        type="time"
                        value={reminder.time}
                        onChange={(e) => {
                          const newReminders = [...(watch('reminders') || [])];
                          newReminders[index] = { ...reminder, time: e.target.value };
                          setValue('reminders', newReminders);
                        }}
                      />
                      <Switch
                        checked={reminder.enabled}
                        onCheckedChange={(checked) => {
                          const newReminders = [...(watch('reminders') || [])];
                          newReminders[index] = { ...reminder, enabled: checked };
                          setValue('reminders', newReminders);
                        }}
                      />
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newReminders = [...(watch('reminders') || [])];
                      newReminders.push({ type: 'weekly', time: '09:00', enabled: true });
                      setValue('reminders', newReminders);
                    }}
                  >
                    Add Reminder
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setActiveStep(1)}
              >
                Back
              </Button>
              <Button 
                type="button" 
                onClick={() => setActiveStep(3)}
              >
                Next: SMART Goals
              </Button>
            </div>
          </motion.div>
        )}

        {activeStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
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
              <div className="space-y-4 border rounded-lg p-6 bg-gray-50">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Achievable Steps
                  </label>
                  <div className="space-y-2">
                    {watch('smartDetails.achievable')?.map((step, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          value={step}
                          onChange={(e) => {
                            const newSteps = [...(watch('smartDetails.achievable') || [])];
                            newSteps[index] = e.target.value;
                            setValue('smartDetails.achievable', newSteps);
                          }}
                          placeholder={`Step ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const newSteps = [...(watch('smartDetails.achievable') || [])];
                            newSteps.splice(index, 1);
                            setValue('smartDetails.achievable', newSteps);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newSteps = [...(watch('smartDetails.achievable') || [])];
                        newSteps.push('');
                        setValue('smartDetails.achievable', newSteps);
                      }}
                    >
                      Add Step
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setActiveStep(2)}
              >
                Back
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Vision Goal'}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
