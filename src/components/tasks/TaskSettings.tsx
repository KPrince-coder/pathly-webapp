'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Switch } from '@/components/ui/Switch';
import { Slider } from '@/components/ui/Slider';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import { Label } from '@/components/ui/Label';
import { cn } from '@/lib/utils';

export function TaskSettings() {
  const { state, actions } = useTask();
  const [activeTab, setActiveTab] = useState('general');

  const handleWorkingHoursChange = (field: 'start' | 'end', value: string) => {
    actions.updateSettings({
      workingHours: {
        ...state.settings.workingHours,
        [field]: value
      }
    });
  };

  const handlePomodoroSettingChange = (
    field: keyof typeof state.settings.pomodoroSettings,
    value: number
  ) => {
    actions.updateSettings({
      pomodoroSettings: {
        ...state.settings.pomodoroSettings,
        [field]: value
      }
    });
  };

  const handleNotificationChange = (
    field: keyof typeof state.settings.notifications,
    value: boolean
  ) => {
    actions.updateSettings({
      notifications: {
        ...state.settings.notifications,
        [field]: value
      }
    });
  };

  const handleAutoSchedulingChange = (
    field: keyof typeof state.settings.autoScheduling,
    value: number | boolean
  ) => {
    actions.updateSettings({
      autoScheduling: {
        ...state.settings.autoScheduling,
        [field]: value
      }
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Task Settings</h2>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 gap-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Working Hours</Label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={state.settings.workingHours.start}
                    onChange={e => handleWorkingHoursChange('start', e.target.value)}
                  />
                </div>
                <div>
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={state.settings.workingHours.end}
                    onChange={e => handleWorkingHoursChange('end', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label>Default Task Duration (minutes)</Label>
              <Input
                type="number"
                min={5}
                max={480}
                value={state.settings.defaultTaskDuration}
                onChange={e => actions.updateSettings({
                  defaultTaskDuration: parseInt(e.target.value)
                })}
              />
            </div>

            <div>
              <Label>Calendar View Style</Label>
              <Select
                value={state.settings.theme.calendarView}
                onChange={value => actions.updateSettings({
                  theme: {
                    ...state.settings.theme,
                    calendarView: value as 'minimal' | 'detailed'
                  }
                })}
                options={[
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'detailed', label: 'Detailed' }
                ]}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pomodoro" className="space-y-4">
          <div className="space-y-4">
            <div>
              <Label>Work Duration (minutes)</Label>
              <Slider
                min={5}
                max={60}
                step={5}
                value={[state.settings.pomodoroSettings.workDuration]}
                onValueChange={([value]) => handlePomodoroSettingChange('workDuration', value)}
              />
            </div>

            <div>
              <Label>Short Break Duration (minutes)</Label>
              <Slider
                min={1}
                max={15}
                step={1}
                value={[state.settings.pomodoroSettings.shortBreakDuration]}
                onValueChange={([value]) => handlePomodoroSettingChange('shortBreakDuration', value)}
              />
            </div>

            <div>
              <Label>Long Break Duration (minutes)</Label>
              <Slider
                min={5}
                max={30}
                step={5}
                value={[state.settings.pomodoroSettings.longBreakDuration]}
                onValueChange={([value]) => handlePomodoroSettingChange('longBreakDuration', value)}
              />
            </div>

            <div>
              <Label>Cycles Before Long Break</Label>
              <Input
                type="number"
                min={2}
                max={8}
                value={state.settings.pomodoroSettings.cyclesBeforeLongBreak}
                onChange={e => handlePomodoroSettingChange(
                  'cyclesBeforeLongBreak',
                  parseInt(e.target.value)
                )}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="space-y-4">
            {Object.entries(state.settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <Label className="capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </Label>
                <Switch
                  checked={value}
                  onCheckedChange={checked => handleNotificationChange(
                    key as keyof typeof state.settings.notifications,
                    checked
                  )}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="scheduling" className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Enable Auto-Scheduling</Label>
              <Switch
                checked={state.settings.autoScheduling.enabled}
                onCheckedChange={checked => handleAutoSchedulingChange('enabled', checked)}
              />
            </div>

            <div>
              <Label>Priority Weight</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[state.settings.autoScheduling.priorityWeight]}
                onValueChange={([value]) => handleAutoSchedulingChange('priorityWeight', value)}
              />
            </div>

            <div>
              <Label>Deadline Weight</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[state.settings.autoScheduling.deadlineWeight]}
                onValueChange={([value]) => handleAutoSchedulingChange('deadlineWeight', value)}
              />
            </div>

            <div>
              <Label>Energy Level Weight</Label>
              <Slider
                min={0}
                max={1}
                step={0.1}
                value={[state.settings.autoScheduling.energyLevelWeight]}
                onValueChange={([value]) => handleAutoSchedulingChange('energyLevelWeight', value)}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2">
        <Button
          variant="outline"
          onClick={() => {
            // Reset to defaults
            actions.updateSettings(initialState.settings);
          }}
        >
          Reset to Defaults
        </Button>
        <Button>Save Changes</Button>
      </div>
    </Card>
  );
}
