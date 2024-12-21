'use client';

import { useState } from 'react';
import { useTask } from '@/contexts/TaskContext';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover';
import { Calendar } from '@/components/ui/Calendar';
import {
  Filter,
  SortAsc,
  SortDesc,
  Calendar as CalendarIcon,
  Tag,
  Clock,
  User,
  Flag
} from 'lucide-react';
import { format } from 'date-fns';
import { Task } from '@/types/task';

interface TaskFilterProps {
  onFilterChange: (filters: TaskFilters) => void;
}

interface TaskFilters {
  search: string;
  priority: Task['priority'][];
  tags: string[];
  dateRange: {
    from: Date | null;
    to: Date | null;
  };
  assignees: string[];
  sortBy: 'priority' | 'dueDate' | 'createdAt' | 'title';
  sortOrder: 'asc' | 'desc';
}

export function TaskFilter({ onFilterChange }: TaskFilterProps) {
  const { state } = useTask();
  const [filters, setFilters] = useState<TaskFilters>({
    search: '',
    priority: [],
    tags: [],
    dateRange: {
      from: null,
      to: null
    },
    assignees: [],
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  // Get unique tags from all tasks
  const availableTags = Array.from(
    new Set(state.tasks.flatMap(task => task.tags || []))
  );

  // Get unique assignees from all tasks
  const availableAssignees = Array.from(
    new Set(state.tasks.map(task => task.assignedTo).filter(Boolean))
  );

  const updateFilters = (newFilters: Partial<TaskFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const togglePriority = (priority: Task['priority']) => {
    const newPriorities = filters.priority.includes(priority)
      ? filters.priority.filter(p => p !== priority)
      : [...filters.priority, priority];
    updateFilters({ priority: newPriorities });
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    updateFilters({ tags: newTags });
  };

  const toggleAssignee = (assignee: string) => {
    const newAssignees = filters.assignees.includes(assignee)
      ? filters.assignees.filter(a => a !== assignee)
      : [...filters.assignees, assignee];
    updateFilters({ assignees: newAssignees });
  };

  const clearFilters = () => {
    const defaultFilters: TaskFilters = {
      search: '',
      priority: [],
      tags: [],
      dateRange: {
        from: null,
        to: null
      },
      assignees: [],
      sortBy: 'createdAt',
      sortOrder: 'desc'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };

  return (
    <Card className="p-4 mb-6">
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Input
              placeholder="Search tasks..."
              value={filters.search}
              onChange={e => updateFilters({ search: e.target.value })}
              className="w-full"
            />
          </div>
          <Select
            value={filters.sortBy}
            onValueChange={value =>
              updateFilters({ sortBy: value as TaskFilters['sortBy'] })
            }
          >
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
            <option value="createdAt">Created Date</option>
            <option value="title">Title</option>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() =>
              updateFilters({
                sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc'
              })
            }
          >
            {filters.sortOrder === 'asc' ? (
              <SortAsc className="w-4 h-4" />
            ) : (
              <SortDesc className="w-4 h-4" />
            )}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Flag className="w-4 h-4" />
            <span className="text-sm">Priority:</span>
            {(['high', 'medium', 'low'] as const).map(priority => (
              <Badge
                key={priority}
                variant={filters.priority.includes(priority) ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => togglePriority(priority)}
              >
                {priority}
              </Badge>
            ))}
          </div>

          {availableTags.length > 0 && (
            <div className="flex items-center space-x-2">
              <Tag className="w-4 h-4" />
              <span className="text-sm">Tags:</span>
              {availableTags.map(tag => (
                <Badge
                  key={tag}
                  variant={filters.tags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {availableAssignees.length > 0 && (
            <div className="flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span className="text-sm">Assignees:</span>
              {availableAssignees.map(assignee => (
                <Badge
                  key={assignee}
                  variant={filters.assignees.includes(assignee) ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => toggleAssignee(assignee)}
                >
                  {assignee}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Date Range:</span>
            <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  {filters.dateRange.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, 'LLL dd')} -{' '}
                        {format(filters.dateRange.to, 'LLL dd')}
                      </>
                    ) : (
                      format(filters.dateRange.from, 'LLL dd')
                    )
                  ) : (
                    'Pick dates'
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="range"
                  selected={{
                    from: filters.dateRange.from,
                    to: filters.dateRange.to
                  }}
                  onSelect={range =>
                    updateFilters({
                      dateRange: {
                        from: range?.from || null,
                        to: range?.to || null
                      }
                    })
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="ml-auto"
          >
            Clear Filters
          </Button>
        </div>
      </div>
    </Card>
  );
}
