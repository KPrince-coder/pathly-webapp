'use client';

import { useState } from 'react';
import { Task, RecurrencePattern } from '@/types/task';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Input } from '@/components/ui/Input';
import { DatePicker } from '@/components/ui/DatePicker';
import { cn } from '@/lib/utils';

interface RecurringTaskManagerProps {
  task: Task;
  onUpdate: (task: Task) => void;
}

interface CustomRecurrence {
  interval: number;
  unit: 'days' | 'weeks' | 'months';
  weekDays?: number[];
  monthDay?: number;
  endDate?: Date;
  exceptions: Date[];
}

export function RecurringTaskManager({ task, onUpdate }: RecurringTaskManagerProps) {
  const [recurrencePattern, setRecurrencePattern] = useState<RecurrencePattern | null>(
    task.recurrence?.pattern || null
  );
  const [customRecurrence, setCustomRecurrence] = useState<CustomRecurrence>({
    interval: 1,
    unit: 'days',
    weekDays: [],
    exceptions: []
  });
  const [showExceptions, setShowExceptions] = useState(false);

  const weekDays = [
    { value: '0', label: 'Sunday' },
    { value: '1', label: 'Monday' },
    { value: '2', label: 'Tuesday' },
    { value: '3', label: 'Wednesday' },
    { value: '4', label: 'Thursday' },
    { value: '5', label: 'Friday' },
    { value: '6', label: 'Saturday' }
  ];

  const handlePatternChange = (pattern: RecurrencePattern | null) => {
    setRecurrencePattern(pattern);
    if (pattern) {
      onUpdate({
        ...task,
        recurrence: {
          pattern,
          ...(pattern === 'custom' ? {
            interval: customRecurrence.interval,
            unit: customRecurrence.unit,
            weekDays: customRecurrence.weekDays,
            monthDay: customRecurrence.monthDay,
            exceptions: customRecurrence.exceptions
          } : {})
        }
      });
    } else {
      const { recurrence, ...taskWithoutRecurrence } = task;
      onUpdate(taskWithoutRecurrence);
    }
  };

  const handleCustomRecurrenceChange = (changes: Partial<CustomRecurrence>) => {
    const updated = { ...customRecurrence, ...changes };
    setCustomRecurrence(updated);
    if (recurrencePattern === 'custom') {
      onUpdate({
        ...task,
        recurrence: {
          pattern: 'custom',
          ...updated
        }
      });
    }
  };

  const addException = (date: Date) => {
    const exceptions = [...customRecurrence.exceptions, date];
    handleCustomRecurrenceChange({ exceptions });
  };

  const removeException = (index: number) => {
    const exceptions = customRecurrence.exceptions.filter((_, i) => i !== index);
    handleCustomRecurrenceChange({ exceptions });
  };

  return (
    <Card className="p-4 space-y-4">
      <div>
        <h3 className="text-lg font-medium mb-2">Recurrence</h3>
        <Select
          value={recurrencePattern || ''}
          onChange={value => handlePatternChange(value as RecurrencePattern)}
          options={[
            { value: '', label: 'No recurrence' },
            { value: 'daily', label: 'Daily' },
            { value: 'weekly', label: 'Weekly' },
            { value: 'monthly', label: 'Monthly' },
            { value: 'custom', label: 'Custom' }
          ]}
        />
      </div>

      {recurrencePattern === 'weekly' && (
        <div className="space-y-2">
          <label className="block text-sm font-medium">Repeat on</label>
          <div className="flex flex-wrap gap-2">
            {weekDays.map(day => (
              <button
                key={day.value}
                onClick={() => {
                  const days = customRecurrence.weekDays || [];
                  const dayNum = parseInt(day.value);
                  const newDays = days.includes(dayNum)
                    ? days.filter(d => d !== dayNum)
                    : [...days, dayNum];
                  handleCustomRecurrenceChange({ weekDays: newDays });
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-sm',
                  customRecurrence.weekDays?.includes(parseInt(day.value))
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary hover:bg-secondary/80'
                )}
              >
                {day.label.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      )}

      {recurrencePattern === 'monthly' && (
        <div>
          <label className="block text-sm font-medium mb-2">Day of month</label>
          <Input
            type="number"
            min={1}
            max={31}
            value={customRecurrence.monthDay || ''}
            onChange={e => handleCustomRecurrenceChange({
              monthDay: parseInt(e.target.value)
            })}
          />
        </div>
      )}

      {recurrencePattern === 'custom' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <span>Every</span>
            <Input
              type="number"
              min={1}
              className="w-20"
              value={customRecurrence.interval}
              onChange={e => handleCustomRecurrenceChange({
                interval: parseInt(e.target.value)
              })}
            />
            <Select
              value={customRecurrence.unit}
              onChange={value => handleCustomRecurrenceChange({
                unit: value as CustomRecurrence['unit']
              })}
              options={[
                { value: 'days', label: 'Days' },
                { value: 'weeks', label: 'Weeks' },
                { value: 'months', label: 'Months' }
              ]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date (Optional)</label>
            <DatePicker
              value={customRecurrence.endDate}
              onChange={date => handleCustomRecurrenceChange({ endDate: date })}
            />
          </div>
        </div>
      )}

      {recurrencePattern && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Exceptions</span>
            <Switch
              checked={showExceptions}
              onCheckedChange={setShowExceptions}
            />
          </div>

          {showExceptions && (
            <div className="space-y-2">
              <DatePicker
                value={null}
                onChange={date => date && addException(date)}
                placeholder="Add exception date"
              />
              
              {customRecurrence.exceptions.map((date, index) => (
                <div
                  key={date.toISOString()}
                  className="flex items-center justify-between p-2 bg-secondary/10 rounded"
                >
                  <span>{date.toLocaleDateString()}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeException(index)}
                  >
                    ×
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
