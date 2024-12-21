'use client';

import { useState, useEffect } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DatePicker } from '@/components/ui/DatePicker';
import { Badge } from '@/components/ui/Badge';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Command, CommandInput, CommandList, CommandItem } from '@/components/ui/Command';
import { cn } from '@/lib/utils';

interface FilterOption {
  value: string;
  label: string;
  color?: string;
}

const PRIORITY_OPTIONS: FilterOption[] = [
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' }
];

const STATUS_OPTIONS: FilterOption[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' }
];

export function TaskFilterBar() {
  const { state, actions } = useTask();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [availableTags, setAvailableTags] = useState<string[]>([]);

  useEffect(() => {
    // Collect all unique tags from tasks
    const tags = new Set<string>();
    state.tasks.forEach(task => {
      task.tags?.forEach(tag => tags.add(tag));
    });
    setAvailableTags(Array.from(tags));
  }, [state.tasks]);

  const handleStatusChange = (status: string) => {
    const currentStatuses = state.filters.status;
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    actions.setFilters({ status: newStatuses });
  };

  const handlePriorityChange = (priority: string) => {
    const currentPriorities = state.filters.priority;
    const newPriorities = currentPriorities.includes(priority)
      ? currentPriorities.filter(p => p !== priority)
      : [...currentPriorities, priority];
    
    actions.setFilters({ priority: newPriorities });
  };

  const handleTagChange = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter(t => t !== tag)
      : [...selectedTags, tag];
    
    setSelectedTags(newTags);
    actions.setFilters({ tags: newTags });
  };

  const handleDateRangeChange = (start: Date | null, end: Date | null) => {
    actions.setFilters({
      dateRange: { start, end }
    });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTags([]);
    actions.setFilters({
      status: [],
      priority: [],
      tags: [],
      dateRange: { start: null, end: null }
    });
  };

  return (
    <div className="p-4 space-y-4 bg-card rounded-lg border border-border">
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Search tasks..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Status
              {state.filters.status.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {state.filters.status.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                {STATUS_OPTIONS.map(status => (
                  <CommandItem
                    key={status.value}
                    onSelect={() => handleStatusChange(status.value)}
                  >
                    <div className={cn(
                      'flex items-center gap-2 w-full',
                      state.filters.status.includes(status.value) && 'font-bold'
                    )}>
                      {status.label}
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Priority
              {state.filters.priority.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {state.filters.priority.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandList>
                {PRIORITY_OPTIONS.map(priority => (
                  <CommandItem
                    key={priority.value}
                    onSelect={() => handlePriorityChange(priority.value)}
                  >
                    <div className={cn(
                      'flex items-center gap-2 w-full',
                      state.filters.priority.includes(priority.value) && 'font-bold'
                    )}>
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        priority.color
                      )} />
                      {priority.label}
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Tags
              {selectedTags.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {selectedTags.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[200px] p-0">
            <Command>
              <CommandInput placeholder="Search tags..." />
              <CommandList>
                {availableTags.map(tag => (
                  <CommandItem
                    key={tag}
                    onSelect={() => handleTagChange(tag)}
                  >
                    <div className={cn(
                      'flex items-center gap-2 w-full',
                      selectedTags.includes(tag) && 'font-bold'
                    )}>
                      #
                      {tag}
                    </div>
                  </CommandItem>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline">
              Date Range
              {(state.filters.dateRange.start || state.filters.dateRange.end) && (
                <Badge variant="secondary" className="ml-2">
                  Active
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] p-4">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <DatePicker
                  value={state.filters.dateRange.start}
                  onChange={date => handleDateRangeChange(date, state.filters.dateRange.end)}
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <DatePicker
                  value={state.filters.dateRange.end}
                  onChange={date => handleDateRangeChange(state.filters.dateRange.start, date)}
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {(state.filters.status.length > 0 ||
          state.filters.priority.length > 0 ||
          selectedTags.length > 0 ||
          state.filters.dateRange.start ||
          state.filters.dateRange.end ||
          searchTerm) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="ml-auto"
          >
            Clear Filters
          </Button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {state.filters.status.map(status => (
          <Badge
            key={status}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handleStatusChange(status)}
          >
            {STATUS_OPTIONS.find(opt => opt.value === status)?.label}
            <span className="ml-1">×</span>
          </Badge>
        ))}
        
        {state.filters.priority.map(priority => (
          <Badge
            key={priority}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handlePriorityChange(priority)}
          >
            {PRIORITY_OPTIONS.find(opt => opt.value === priority)?.label}
            <span className="ml-1">×</span>
          </Badge>
        ))}

        {selectedTags.map(tag => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer"
            onClick={() => handleTagChange(tag)}
          >
            #{tag}
            <span className="ml-1">×</span>
          </Badge>
        ))}
      </div>
    </div>
  );
}
