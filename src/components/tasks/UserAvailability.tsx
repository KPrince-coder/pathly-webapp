'use client';

import { useState } from 'react';
import { format, parse } from 'date-fns';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { Select } from '@/components/ui/Select';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface DayAvailability {
  isWorkingDay: boolean;
  timeSlots: TimeSlot[];
  breaks: TimeSlot[];
}

interface WeeklyAvailability {
  [key: string]: DayAvailability;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DEFAULT_WORKING_HOURS: TimeSlot = { startTime: '09:00', endTime: '17:00' };
const DEFAULT_LUNCH_BREAK: TimeSlot = { startTime: '12:00', endTime: '13:00' };

export function UserAvailability() {
  const [availability, setAvailability] = useState<WeeklyAvailability>(() => {
    const initial: WeeklyAvailability = {};
    DAYS.forEach(day => {
      initial[day] = {
        isWorkingDay: day !== 'Saturday' && day !== 'Sunday',
        timeSlots: [{ ...DEFAULT_WORKING_HOURS }],
        breaks: [{ ...DEFAULT_LUNCH_BREAK }]
      };
    });
    return initial;
  });

  const timeOptions = Array.from({ length: 48 }, (_, i) => {
    const hour = Math.floor(i / 2);
    const minute = i % 2 === 0 ? '00' : '30';
    const time = `${hour.toString().padStart(2, '0')}:${minute}`;
    return {
      value: time,
      label: format(parse(time, 'HH:mm', new Date()), 'h:mm a')
    };
  });

  const handleWorkingDayToggle = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        isWorkingDay: !prev[day].isWorkingDay
      }
    }));
  };

  const handleTimeSlotChange = (
    day: string,
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.map((slot, i) =>
          i === index ? { ...slot, [field]: value } : slot
        )
      }
    }));
  };

  const handleBreakChange = (
    day: string,
    index: number,
    field: 'startTime' | 'endTime',
    value: string
  ) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.map((breakSlot, i) =>
          i === index ? { ...breakSlot, [field]: value } : breakSlot
        )
      }
    }));
  };

  const addTimeSlot = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: [
          ...prev[day].timeSlots,
          { startTime: '09:00', endTime: '17:00' }
        ]
      }
    }));
  };

  const addBreak = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: [
          ...prev[day].breaks,
          { startTime: '12:00', endTime: '13:00' }
        ]
      }
    }));
  };

  const removeTimeSlot = (day: string, index: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        timeSlots: prev[day].timeSlots.filter((_, i) => i !== index)
      }
    }));
  };

  const removeBreak = (day: string, index: number) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        breaks: prev[day].breaks.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Weekly Availability</h2>
      
      <div className="space-y-4">
        {DAYS.map(day => (
          <Card key={day} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={availability[day].isWorkingDay}
                    onCheckedChange={() => handleWorkingDayToggle(day)}
                  />
                  <h3 className="text-lg font-medium">{day}</h3>
                </div>
              </div>

              {availability[day].isWorkingDay && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Working Hours</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addTimeSlot(day)}
                      >
                        Add Time Slot
                      </Button>
                    </div>
                    {availability[day].timeSlots.map((slot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Select
                          value={slot.startTime}
                          onChange={value => handleTimeSlotChange(day, index, 'startTime', value)}
                          options={timeOptions}
                        />
                        <span>to</span>
                        <Select
                          value={slot.endTime}
                          onChange={value => handleTimeSlotChange(day, index, 'endTime', value)}
                          options={timeOptions}
                        />
                        {availability[day].timeSlots.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTimeSlot(day, index)}
                          >
                            ×
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Breaks</h4>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addBreak(day)}
                      >
                        Add Break
                      </Button>
                    </div>
                    {availability[day].breaks.map((breakSlot, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Select
                          value={breakSlot.startTime}
                          onChange={value => handleBreakChange(day, index, 'startTime', value)}
                          options={timeOptions}
                        />
                        <span>to</span>
                        <Select
                          value={breakSlot.endTime}
                          onChange={value => handleBreakChange(day, index, 'endTime', value)}
                          options={timeOptions}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeBreak(day, index)}
                        >
                          ×
                        </Button>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-end">
        <Button onClick={() => console.log(availability)}>Save Availability</Button>
      </div>
    </div>
  );
}
