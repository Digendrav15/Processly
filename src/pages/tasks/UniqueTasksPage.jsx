import React from 'react';
import { TaskListView } from '../../components/tasks/TaskListView';
import { Sparkles } from 'lucide-react';

export function UniqueTasksPage() {
  return (
    <TaskListView
      category="unique"
      title="Unique Task"
      subtitle="Single deliverables, ad-hoc jobs, and individual one-time work items"
      icon={Sparkles}
      badgeText="One-Time Task"
      accentColor="purple"
    />
  );
}

export default UniqueTasksPage;
