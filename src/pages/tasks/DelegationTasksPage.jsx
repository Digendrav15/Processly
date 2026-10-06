import React from 'react';
import { TaskListView } from '../../components/tasks/TaskListView';
import { UserCheck } from 'lucide-react';

export function DelegationTasksPage() {
  return (
    <TaskListView
      category="delegation"
      title="Delegation Task"
      subtitle="Operational work items delegated across team members with ownership & follow-up"
      icon={UserCheck}
      badgeText="Team Delegation"
      accentColor="emerald"
    />
  );
}

export default DelegationTasksPage;
