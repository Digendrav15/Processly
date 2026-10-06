import React from 'react';
import { TaskListView } from '../../components/tasks/TaskListView';
import { ListTodo } from 'lucide-react';

export function ChecklistTasksPage() {
  return (
    <TaskListView
      category="checklist"
      title="Checklist Task"
      subtitle="Recurring operational workflows & scheduled routines (Daily, Weekly, Monthly)"
      icon={ListTodo}
      badgeText="Recurring Checklist"
      accentColor="indigo"
    />
  );
}

export default ChecklistTasksPage;
