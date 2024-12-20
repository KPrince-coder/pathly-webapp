import { useState, useEffect } from 'react';
import { FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './Button';
import { Popover, Transition } from '@headlessui/react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

interface DatePickerProps {
  date: Date | string;
  onDateChange: (date: Date) => void;
  label?: string;
  error?: boolean;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  label,
  error,
  className,
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(
    typeof date === 'string' ? new Date(date) : date
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (date) {
      setSelectedDate(typeof date === 'string' ? new Date(date) : date);
    }
  }, [date]);

  if (!mounted) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            error && 'border-red-500 focus:ring-red-500',
          )}
        >
          <FiCalendar className="mr-2 h-4 w-4" />
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <Popover className="relative">
        <Popover.Button
          as={Button}
          variant="outline"
          className={cn(
            'w-full justify-start text-left font-normal',
            error && 'border-red-500 focus:ring-red-500',
            !selectedDate && 'text-gray-500'
          )}
        >
          <FiCalendar className="mr-2 h-4 w-4" />
          {selectedDate ? format(selectedDate, 'PPP') : 'Pick a date'}
        </Popover.Button>
        <Transition
          show={isOpen}
          enter="transition duration-100 ease-out"
          enterFrom="transform scale-95 opacity-0"
          enterTo="transform scale-100 opacity-100"
          leave="transition duration-75 ease-out"
          leaveFrom="transform scale-100 opacity-100"
          leaveTo="transform scale-95 opacity-0"
        >
          <Popover.Panel className="absolute z-10 mt-2">
            <div className="rounded-md border border-gray-200 bg-white p-2 shadow-lg">
              <Calendar
                onChange={(value) => {
                  onDateChange(value as Date);
                  setIsOpen(false);
                }}
                value={selectedDate}
                className="border-0"
              />
            </div>
          </Popover.Panel>
        </Transition>
      </Popover>
    </div>
  );
}
