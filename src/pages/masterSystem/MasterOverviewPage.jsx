import React from 'react';
import {
  Sliders,
  Users2,
  ShoppingCart,
  Package,
  Truck,
  Building,
  Building2,
  UserCheck,
  Clock,
  Server,
  Calendar,
  CalendarDays,
  Plus,
  ArrowRight
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, DEFAULT_COMPANY_DETAILS } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function MasterOverviewPage() {
  const navigate = useNavigate();

  const salesVendors = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);
  const purchaseVendors = useOTDStorage(STORAGE_KEYS.PURCHASE_VENDORS, []);
  const products = useOTDStorage(STORAGE_KEYS.PRODUCTS, []);
  const transporters = useOTDStorage(STORAGE_KEYS.TRANSPORTERS, []);
  const departments = useOTDStorage(STORAGE_KEYS.DEPARTMENTS, []);
  const users = useOTDStorage(STORAGE_KEYS.EMPLOYEES, []);
  const tatConfigs = useOTDStorage(STORAGE_KEYS.TAT, []);
  const systems = useOTDStorage(STORAGE_KEYS.SYSTEMS, []);
  const stages = useOTDStorage(STORAGE_KEYS.STAGES, []);
  const holidays = useOTDStorage(STORAGE_KEYS.HOLIDAYS, []);
  const companyDetails = useOTDStorage(STORAGE_KEYS.COMPANY_DETAILS, DEFAULT_COMPANY_DETAILS);

  const masterCards = [
    { title: 'Our Company Details (PO Profile)', count: companyDetails?.companyName ? 'Active Profile' : 'Configure', path: '/master-system/company-details', icon: Building2, color: 'blue' },
    { title: 'Vendors Master (Sales, Purchase, Transporters)', count: salesVendors.length + purchaseVendors.length + transporters.length, path: '/master-system/vendors', icon: Users2, color: 'emerald' },
    { title: 'Product Master', count: products.length, path: '/master-system/products', icon: Package, color: 'indigo' },
    { title: 'Department Master', count: departments.length, path: '/master-system/departments', icon: Building, color: 'cyan' },
    { title: 'User / Employee Master', count: users.length, path: '/master-system/users', icon: UserCheck, color: 'rose' },
    { title: 'TAT Management', count: tatConfigs.length, path: '/master-system/tat', icon: Clock, color: 'teal' },
    { title: 'Working Day Calendar', count: 'Active Rules', path: '/master-system/working-calendar', icon: CalendarDays, color: 'purple' },
    { title: 'Holidays Master', count: holidays.length, path: '/master-system/holidays', icon: Calendar, color: 'orange' },
  ];

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase tracking-wider border border-rose-200 dark:border-rose-800/80">
            Master System
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Master System Database Hub</h1>
        </div>
      </div>

      {/* Grid of Master Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {masterCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">{card.title}</h3>
                    <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{card.count} <span className="text-xs font-normal text-slate-400">records</span></p>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                <span className="text-[11px] text-slate-400 font-medium">Single Source Dropdown</span>
                <button
                  onClick={() => navigate(card.path)}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl transition-all"
                >
                  <span>Manage</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
