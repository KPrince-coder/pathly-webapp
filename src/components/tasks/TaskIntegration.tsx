'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs';
import {
  Github,
  Trello,
  Slack,
  Calendar as CalendarIcon,
  Link2,
  Settings2,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  status: 'connected' | 'disconnected';
  lastSync?: Date;
  settings: {
    [key: string]: boolean | string;
  };
}

const AVAILABLE_INTEGRATIONS: Integration[] = [
  {
    id: 'github',
    name: 'GitHub',
    description: 'Sync tasks with GitHub issues and projects',
    icon: Github,
    status: 'disconnected',
    settings: {
      syncIssues: true,
      syncProjects: true,
      autoCreateBranches: false,
      repository: ''
    }
  },
  {
    id: 'trello',
    name: 'Trello',
    description: 'Import and sync Trello boards and cards',
    icon: Trello,
    status: 'disconnected',
    settings: {
      syncBoards: true,
      syncCards: true,
      autoAssign: true,
      boardId: ''
    }
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Get notifications and create tasks from Slack',
    icon: Slack,
    status: 'disconnected',
    settings: {
      notifications: true,
      taskCreation: true,
      channelUpdates: false,
      channel: ''
    }
  },
  {
    id: 'calendar',
    name: 'Google Calendar',
    description: 'Sync task deadlines with Google Calendar',
    icon: CalendarIcon,
    status: 'disconnected',
    settings: {
      syncDeadlines: true,
      createEvents: true,
      notifications: true,
      calendarId: ''
    }
  }
];

export function TaskIntegration() {
  const [integrations, setIntegrations] = useState<Integration[]>(AVAILABLE_INTEGRATIONS);
  const [activeTab, setActiveTab] = useState('connected');
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleConnect = (integrationId: string) => {
    // In a real app, this would open OAuth flow or API key input
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              status: 'connected',
              lastSync: new Date()
            }
          : integration
      )
    );
  };

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              status: 'disconnected',
              lastSync: undefined
            }
          : integration
      )
    );
  };

  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId);
    // Simulate sync delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              lastSync: new Date()
            }
          : integration
      )
    );
    setSyncing(null);
  };

  const handleSettingChange = (
    integrationId: string,
    setting: string,
    value: boolean | string
  ) => {
    setIntegrations(prev =>
      prev.map(integration =>
        integration.id === integrationId
          ? {
              ...integration,
              settings: {
                ...integration.settings,
                [setting]: value
              }
            }
          : integration
      )
    );
  };

  const renderIntegrationCard = (integration: Integration) => (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      key={integration.id}
    >
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div
              className={cn(
                'p-2 rounded-lg',
                integration.status === 'connected'
                  ? 'bg-primary/10'
                  : 'bg-muted'
              )}
            >
              <integration.icon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium">{integration.name}</h3>
              <p className="text-sm text-muted-foreground">
                {integration.description}
              </p>
            </div>
          </div>
          {integration.status === 'connected' ? (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleSync(integration.id)}
                disabled={syncing === integration.id}
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4',
                    syncing === integration.id && 'animate-spin'
                  )}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDisconnect(integration.id)}
              >
                <Settings2 className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <Button onClick={() => handleConnect(integration.id)}>
              Connect
            </Button>
          )}
        </div>

        {integration.status === 'connected' && (
          <div className="mt-4 space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Last synced</span>
              <span>
                {integration.lastSync
                  ? new Intl.DateTimeFormat('en-US', {
                      dateStyle: 'medium',
                      timeStyle: 'short'
                    }).format(integration.lastSync)
                  : 'Never'}
              </span>
            </div>

            <div className="space-y-2">
              {Object.entries(integration.settings).map(([key, value]) => (
                <div
                  key={key}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">
                      {key
                        .replace(/([A-Z])/g, ' $1')
                        .replace(/^./, str => str.toUpperCase())}
                    </span>
                    {typeof value === 'boolean' && (
                      <Switch
                        checked={value}
                        onCheckedChange={checked =>
                          handleSettingChange(
                            integration.id,
                            key,
                            checked
                          )
                        }
                      />
                    )}
                  </div>
                  {typeof value === 'string' && (
                    <Input
                      value={value}
                      onChange={e =>
                        handleSettingChange(
                          integration.id,
                          key,
                          e.target.value
                        )
                      }
                      className="w-48"
                      placeholder={`Enter ${key}`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </motion.div>
  );

  const connectedIntegrations = integrations.filter(
    i => i.status === 'connected'
  );
  const availableIntegrations = integrations.filter(
    i => i.status === 'disconnected'
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Integrations</h2>
          <p className="text-muted-foreground">
            Connect and manage your external tools and services
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Add Custom Integration
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="connected">
            Connected
            <Badge variant="secondary" className="ml-2">
              {connectedIntegrations.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="available">
            Available
            <Badge variant="secondary" className="ml-2">
              {availableIntegrations.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="connected" className="space-y-4">
          <AnimatePresence mode="popLayout">
            {connectedIntegrations.length > 0 ? (
              connectedIntegrations.map(renderIntegrationCard)
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center py-12"
              >
                <Link2 className="w-12 h-12 mx-auto text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">
                  No Connected Integrations
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Connect your favorite tools to enhance your workflow
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <AnimatePresence mode="popLayout">
            {availableIntegrations.map(renderIntegrationCard)}
          </AnimatePresence>
        </TabsContent>
      </Tabs>
    </div>
  );
}
