import { Task, Priority, TaskStatus } from '@/types';
import { Form, FormField } from '../ui/Form';
import { Input } from '../ui/Input';
import { Textarea } from '../ui/Textarea';
import { Select, SelectOption } from '../ui/Select';
import { DatePicker } from '../ui/DatePicker';
import { Button } from '../ui/Button';
import { z } from 'zod';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
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

type TaskFormData = z.infer<typeof taskSchema>;

interface TaskFormProps {
  onSubmit: (data: TaskFormData) => void;
  initialData?: Partial<Task>;
  isSubmitting?: boolean;
}

const priorityOptions: SelectOption[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

const statusOptions: SelectOption[] = [
  { value: 'Todo', label: 'Todo' },
  { value: 'In Progress', label: 'In Progress' },
  { value: 'Done', label: 'Done' },
];

export function TaskForm({ onSubmit, initialData, isSubmitting }: TaskFormProps) {
  const defaultValues = {
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: priorityOptions.find(
      (option) => option.value === initialData?.priority
    ) || priorityOptions[0],
    deadline: initialData?.deadline || new Date(),
    status: statusOptions.find(
      (option) => option.value === initialData?.status
    ) || statusOptions[0],
  };

  return (
    <Form schema={taskSchema} onSubmit={onSubmit}>
      {({ register, formState: { errors }, setValue, watch }) => (
        <>
          <FormField label="Title" error={errors.title?.message}>
            <Input
              {...register('title')}
              placeholder="Enter task title"
              error={!!errors.title}
            />
          </FormField>

          <FormField label="Description" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="Enter task description"
              error={!!errors.description}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Priority" error={errors.priority?.message}>
              <Select
                value={watch('priority') || defaultValues.priority}
                onChange={(value) => setValue('priority', value)}
                options={priorityOptions}
                error={!!errors.priority}
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
          </div>

          <FormField label="Deadline" error={errors.deadline?.message}>
            <DatePicker
              date={watch('deadline') || defaultValues.deadline}
              onDateChange={(date) => setValue('deadline', date)}
              error={!!errors.deadline}
            />
          </FormField>

          <div className="flex justify-end space-x-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update Task' : 'Create Task'}
            </Button>
          </div>
        </>
      )}
    </Form>
  );
}
