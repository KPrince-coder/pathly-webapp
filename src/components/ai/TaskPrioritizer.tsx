'use client';

import { useEffect, useState } from 'react';
import { FiCheckCircle } from 'react-icons/fi';

interface Task {
  id: string;
  title: string;
  deadline: string; // ISO format date
  importance: number; // Scale of 1-10
}

const TaskPrioritizer: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const [prioritizedTasks, setPrioritizedTasks] = useState<Task[]>([]);

  useEffect(() => {
    const prioritizeTasks = () => {
      const now = new Date();
      const sortedTasks = tasks.sort((a, b) => {
        const deadlineA = new Date(a.deadline);
        const deadlineB = new Date(b.deadline);
        const urgencyA = deadlineA.getTime() - now.getTime() + (10 - a.importance) * 1000 * 60 * 60 * 24;
        const urgencyB = deadlineB.getTime() - now.getTime() + (10 - b.importance) * 1000 * 60 * 60 * 24;
        return urgencyA - urgencyB;
      });
      setPrioritizedTasks(sortedTasks);
    };

    prioritizeTasks();
  }, [tasks]);

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-lg font-semibold">Smart Task Prioritization</h3>
      <ul className="mt-2 space-y-2">
        {prioritizedTasks.map(task => (
          <li key={task.id} className="flex items-center gap-2">
            <FiCheckCircle className="text-green-500" />
            <span>{task.title} (Deadline: {new Date(task.deadline).toLocaleDateString()}, Importance: {task.importance})</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TaskPrioritizer;
