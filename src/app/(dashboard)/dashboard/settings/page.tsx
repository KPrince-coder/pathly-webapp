"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { Switch } from '@headlessui/react';
import { cn } from '@/lib/utils';

const themeOptions: SelectOption[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
];

const timezoneOptions: SelectOption[] = [
  { value: 'UTC', label: 'UTC' },
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
];

export default function SettingsPage() {
  const [theme, setTheme] = useState(themeOptions[0]);
  const [timezone, setTimezone] = useState(timezoneOptions[0]);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <Input defaultValue="John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input defaultValue="john@example.com" type="email" />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Theme
              </label>
              <Select
                value={theme}
                onChange={setTheme}
                options={themeOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <CardTitle>Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timezone
              </label>
              <Select
                value={timezone}
                onChange={setTimezone}
                options={timezoneOptions}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Email Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  Receive email notifications for important updates
                </p>
              </div>
              <Switch
                checked={emailNotifications}
                onChange={setEmailNotifications}
                className={cn(
                  emailNotifications ? 'bg-blue-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                )}
              >
                <span
                  className={cn(
                    emailNotifications ? 'translate-x-6' : 'translate-x-1',
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-1'
                  )}
                />
              </Switch>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Push Notifications
                </h3>
                <p className="text-sm text-gray-500">
                  Receive push notifications for task reminders
                </p>
              </div>
              <Switch
                checked={pushNotifications}
                onChange={setPushNotifications}
                className={cn(
                  pushNotifications ? 'bg-blue-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out'
                )}
              >
                <span
                  className={cn(
                    pushNotifications ? 'translate-x-6' : 'translate-x-1',
                    'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out mt-1'
                  )}
                />
              </Switch>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Once you delete your account, there is no going back. Please be
                  certain.
                </p>
              </div>
              <Button variant="danger">Delete Account</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
