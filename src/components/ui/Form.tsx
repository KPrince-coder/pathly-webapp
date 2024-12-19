import {
  useForm,
  UseFormReturn,
  SubmitHandler,
  FieldValues,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ZodType } from 'zod';
import { cn } from '@/lib/utils';

interface FormProps<T extends FieldValues> {
  className?: string;
  onSubmit: SubmitHandler<T>;
  children: (methods: UseFormReturn<T>) => React.ReactNode;
  schema: ZodType<T>;
}

export function Form<T extends FieldValues>({
  className,
  onSubmit,
  children,
  schema,
}: FormProps<T>) {
  const methods = useForm<T>({
    resolver: zodResolver(schema),
  });

  return (
    <form
      className={cn('space-y-6', className)}
      onSubmit={methods.handleSubmit(onSubmit)}
    >
      {children(methods)}
    </form>
  );
}

interface FormFieldProps {
  label?: string;
  error?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormField({
  label,
  error,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
