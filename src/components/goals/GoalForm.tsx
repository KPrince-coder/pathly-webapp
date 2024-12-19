import { Goal, GoalCategory, Priority, GoalStatus } from '@/types';
import { Form, FormField } from '../ui/Form';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectOption } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { z } from 'zod';

const goalSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  category: z.object({
    value: z.string(),
    label: z.string(),
  }),
  priority: z.object({
    value: z.string(),
    label: z.string(),
  }),
  deadline: z.date(),
  status: z.object({
    value: z.string(),
    label: z.string(),
  }),
});

type GoalFormData = z.infer<typeof goalSchema>;

interface GoalFormProps {
  onSubmit: (data: GoalFormData) => void;
  initialData?: Partial<Goal>;
  isSubmitting?: boolean;
}

const categoryOptions: SelectOption[] = [
  { value: 'Personal', label: 'Personal' },
  { value: 'Work', label: 'Work' },
  { value: 'Health', label: 'Health' },
  { value: 'Education', label: 'Education' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Social', label: 'Social' },
  { value: 'Other', label: 'Other' },
];

const priorityOptions: SelectOption[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const statusOptions: SelectOption[] = [
  { value: 'Not Started', label: 'Not Started' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Completed', label: 'Completed' },
];

export function GoalForm({ onSubmit, initialData, isSubmitting }: GoalFormProps) {
  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: categoryOptions.find(
      (option) => option.value === initialData?.category
    ) || categoryOptions[0],
    priority: priorityOptions.find(
      (option) => option.value === initialData?.priority
    ) || priorityOptions[0],
    deadline: initialData?.deadline || new Date(),
    status: statusOptions.find(
      (option) => option.value === initialData?.status
    ) || statusOptions[0],
  };

  return (
    <Form schema={goalSchema} onSubmit={onSubmit}>
      {({ register, formState: { errors }, setValue, watch }) => (
        <>
          <FormField label="Title" error={errors.title?.message}>
            <Input
              {...register('title')}
              placeholder="Enter goal title"
              error={!!errors.title}
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Enter goal description"
              error={!!errors.description}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category" error={errors.category?.message}>
              <Select
                value={watch('category') || defaultValues.category}
                onChange={(value) => setValue('category', value)}
                options={categoryOptions}
                error={!!errors.category}
              />
            </FormField>

            <FormField label="Priority" error={errors.priority?.message}>
              <Select
                value={watch('priority') || defaultValues.priority}
                onChange={(value) => setValue('priority', value)}
                options={priorityOptions}
                error={!!errors.priority}
              />
            </FormField>
          </div>

          <FormField label="Deadline" error={errors.deadline?.message}>
            <DatePicker
              date={watch('deadline') || defaultValues.deadline}
              onDateChange={(date) => setValue('deadline', date)}
              error={!!errors.deadline}
            />
          </FormField>

          <FormField label="Status" error={errors.status?.message}>
            <Select
              value={watch('status') || defaultValues.status}
              onChange={(value) => setValue('status', value)}
              options={statusOptions}
              error={!!errors.status}
            />
          </FormField>

          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Goal' : 'Create Goal'}
            </Button>
          </div>
        </>
      )}
    </Form>
  );
}
