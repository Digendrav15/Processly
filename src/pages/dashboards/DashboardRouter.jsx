import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { MainAdminDashboard } from './MainAdminDashboard';
import { ManagerDashboard } from './ManagerDashboard';
import { EmployeeDashboard } from './EmployeeDashboard';

export function DashboardRouter() {
  const { isAdmin, isManager } = useAuth();

  if (isAdmin) {
    return <MainAdminDashboard />;
  }

  if (isManager) {
    return <ManagerDashboard />;
  }

  return <EmployeeDashboard />;
}
