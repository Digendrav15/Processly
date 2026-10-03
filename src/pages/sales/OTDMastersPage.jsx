import React, { useState } from 'react';
import {
  Sliders,
  Plus,
  Edit2,
  Trash2,
  Users2,
  ShoppingCart,
  Package,
  Truck,
  Building,
  Clock,
  UserCheck,
  Calendar,
  Layers,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Server
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  STORAGE_KEYS,
  setData,
  generateId,
  logAuditAction,
  getCurrentUser,
  setCurrentUser
} from '../../services/otdStorageService';

export function OTDMastersPage() {
  const [activeTab, setActiveTab] = useState('sales_vendors');

  // Master Data Hook Subscriptions
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

  // Modal State
  const [modalState, setModalState] = useState({ isOpen: false, type: '', data: null });
  const [form, setForm] = useState({});
  const [errorMsg, setErrorMsg] = useState('');

  const currentUser = getCurrentUser();

  const handleOpenModal = (type, data = null) => {
    setErrorMsg('');
    setModalState({ isOpen: true, type, data });

    if (type === 'sales_vendor') {
      setForm(
        data || {
          code: `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          type: 'Corporate',
          contactPerson: '',
          mobile: '',
          email: '',
          city: '',
          state: '',
          pincode: '',
          status: 'Active'
        }
      );
    } else if (type === 'purchase_vendor') {
      setForm(
        data || {
          code: `VND-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          contactPerson: '',
          mobile: '',
          email: '',
          gstin: '',
          city: '',
          status: 'Active'
        }
      );
    } else if (type === 'product') {
      setForm(
        data || {
          code: `PRD-${Math.floor(1000 + Math.random() * 9000)}`,
          name: '',
          category: 'Goods',
          subCategory: '',
          unit: 'Pcs',
          taxRate: 18,
          defaultRate: 500,
          status: 'Active'
        }
      );
    } else if (type === 'transporter') {
      setForm(
        data || {
          code: `TRN-${Math.floor(100 + Math.random() * 900)}`,
          name: '',
          contactPerson: '',
          mobile: '',
          vehicleTypes: 'Truck, Container',
          status: 'Active'
        }
      );
    } else if (type === 'department') {
      setForm(
        data || {
          code: `DPT-${Math.floor(100 + Math.random() * 900)}`,
          name: '',
          headName: '',
          status: 'Active'
        }
      );
    } else if (type === 'user') {
      setForm(
        data || {
          code: `EMP-${Math.floor(100 + Math.random() * 900)}`,
          name: '',
          department: departments[0]?.name || 'Sales',
          designation: 'Executive',
          userGroup: 'Sales User',
          mobile: '',
          email: '',
          status: 'Active'
        }
      );
    } else if (type === 'tat') {
      const defaultSys = systems[0]?.name || '';
      const defaultStage = stages.find((s) => s.systemName === defaultSys)?.stageName || '';
      setForm(
        data || {
          systemName: defaultSys,
          stageName: defaultStage,
          tatValue: 2,
          tatUnit: 'Hours',
          status: 'Active'
        }
      );
    } else if (type === 'system') {
      setForm(data || { name: '', description: '', status: 'Active' });
    } else if (type === 'stage') {
      const defaultSys = systems[0]?.name || '';
      setForm(
        data || {
          systemName: defaultSys,
          stageName: '',
          sequence: stages.filter((s) => s.systemName === defaultSys).length + 1,
          status: 'Active'
        }
      );
    } else if (type === 'holiday') {
      setForm(
        data || {
          date: new Date().toISOString().split('T')[0],
          name: '',
          type: 'Public Holiday',
          status: 'Active'
        }
      );
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { type, data: editingItem } = modalState;

    if (type === 'sales_vendor') {
      if (!form.name.trim()) return setErrorMsg('Customer Name is required');
      const updated = editingItem
        ? salesVendors.map((c) => (c.id === editingItem.id ? { ...c, ...form } : c))
        : [...salesVendors, { id: generateId('CUST'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.CUSTOMERS, updated);
      logAuditAction(editingItem ? 'Sales Vendor Updated' : 'Sales Vendor Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'purchase_vendor') {
      if (!form.name.trim()) return setErrorMsg('Vendor Name is required');
      const updated = editingItem
        ? purchaseVendors.map((v) => (v.id === editingItem.id ? { ...v, ...form } : v))
        : [...purchaseVendors, { id: generateId('VND'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.PURCHASE_VENDORS, updated);
      logAuditAction(editingItem ? 'Purchase Vendor Updated' : 'Purchase Vendor Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'product') {
      if (!form.name.trim()) return setErrorMsg('Product Name is required');
      const updated = editingItem
        ? products.map((p) => (p.id === editingItem.id ? { ...p, ...form } : p))
        : [...products, { id: generateId('PRD'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.PRODUCTS, updated);
      logAuditAction(editingItem ? 'Product Updated' : 'Product Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'transporter') {
      if (!form.name.trim()) return setErrorMsg('Transporter Name is required');
      const updated = editingItem
        ? transporters.map((t) => (t.id === editingItem.id ? { ...t, ...form } : t))
        : [...transporters, { id: generateId('TRN'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.TRANSPORTERS, updated);
      logAuditAction(editingItem ? 'Transporter Updated' : 'Transporter Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'department') {
      if (!form.name.trim()) return setErrorMsg('Department Name is required');
      const updated = editingItem
        ? departments.map((d) => (d.id === editingItem.id ? { ...d, ...form } : d))
        : [...departments, { id: generateId('DPT'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.DEPARTMENTS, updated);
      logAuditAction(editingItem ? 'Department Updated' : 'Department Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'user') {
      if (!form.name.trim()) return setErrorMsg('User Name is required');
      const updated = editingItem
        ? users.map((u) => (u.id === editingItem.id ? { ...u, ...form } : u))
        : [...users, { id: generateId('EMP'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.EMPLOYEES, updated);
      logAuditAction(editingItem ? 'User Updated' : 'User Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'tat') {
      if (!form.systemName || !form.stageName) return setErrorMsg('System and Stage are required');
      if (!form.tatValue || parseFloat(form.tatValue) <= 0) return setErrorMsg('TAT Value must be greater than 0');

      if (form.status === 'Active') {
        const dup = tatConfigs.find(
          (t) =>
            t.id !== editingItem?.id &&
            t.status === 'Active' &&
            t.systemName?.toLowerCase() === form.systemName.toLowerCase() &&
            t.stageName?.toLowerCase() === form.stageName.toLowerCase()
        );
        if (dup) return setErrorMsg('TAT is already configured for this stage. Please edit the existing configuration.');
      }

      const updated = editingItem
        ? tatConfigs.map((t) => (t.id === editingItem.id ? { ...t, ...form } : t))
        : [...tatConfigs, { id: generateId('TAT'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.TAT, updated);
      logAuditAction(editingItem ? 'TAT Updated' : 'TAT Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'system') {
      if (!form.name.trim()) return setErrorMsg('System Name is required');
      const updated = editingItem
        ? systems.map((s) => (s.id === editingItem.id ? { ...s, ...form } : s))
        : [...systems, { id: generateId('SYS'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.SYSTEMS, updated);
      logAuditAction(editingItem ? 'System Updated' : 'System Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'stage') {
      if (!form.systemName || !form.stageName.trim()) return setErrorMsg('System and Stage Name are required');
      const updated = editingItem
        ? stages.map((s) => (s.id === editingItem.id ? { ...s, ...form } : s))
        : [...stages, { id: generateId('STG'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.STAGES, updated);
      logAuditAction(editingItem ? 'Stage Updated' : 'Stage Created', 'Master System', editingItem?.id || 'NEW', form);
    } else if (type === 'holiday') {
      if (!form.name.trim() || !form.date) return setErrorMsg('Holiday Name and Date are required');
      const updated = editingItem
        ? holidays.map((h) => (h.id === editingItem.id ? { ...h, ...form } : h))
        : [...holidays, { id: generateId('HOL'), ...form, createdAt: new Date().toISOString() }];
      setData(STORAGE_KEYS.HOLIDAYS, updated);
      logAuditAction(editingItem ? 'Holiday Updated' : 'Holiday Created', 'Master System', editingItem?.id || 'NEW', form);
    }

    setModalState({ isOpen: false, type: '', data: null });
  };

  const handleDelete = (storageKey, id, label) => {
    if (!window.confirm(`Are you sure you want to delete this ${label}?`)) return;
    const current = useOTDStorage(storageKey, []);
    const updated = current.filter((item) => item.id !== id);
    setData(storageKey, updated);
    logAuditAction(`${label} Deleted`, 'Master System', id, {});
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase tracking-wider border border-emerald-200 dark:border-emerald-800/80">
            OTD Masters
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Master System Database</h1>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: 'sales_vendors', label: 'Sales Vendors (Customers)', icon: Users2, count: salesVendors.length },
          { id: 'purchase_vendors', label: 'Purchase Vendors', icon: ShoppingCart, count: purchaseVendors.length },
          { id: 'products', label: 'Products', icon: Package, count: products.length },
          { id: 'transporters', label: 'Transporters', icon: Truck, count: transporters.length },
          { id: 'departments', label: 'Departments', icon: Building, count: departments.length },
          { id: 'users', label: 'Users & Employees', icon: UserCheck, count: users.length },
          { id: 'tat', label: 'TAT Config', icon: Clock, count: tatConfigs.length },
          { id: 'systems_stages', label: 'Systems & Stages', icon: Server, count: stages.length },
          { id: 'holidays', label: 'Holidays', icon: Calendar, count: holidays.length }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={`ml-1.5 px-2 py-0.5 rounded-full text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Tab Content Display */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
        {/* 1. SALES VENDORS / CUSTOMERS TAB */}
        {activeTab === 'sales_vendors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sales Vendors (Customers) Master</h3>
              <button
                onClick={() => handleOpenModal('sales_vendor')}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Sales Vendor</span>
              </button>
            </div>
            {salesVendors.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No Sales Vendors added yet. Master dropdowns will populate from here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Code</th>
                      <th className="pb-3 px-3">Name</th>
                      <th className="pb-3 px-3">Contact Person</th>
                      <th className="pb-3 px-3">Mobile / Email</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {salesVendors.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-extrabold text-emerald-600">{c.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{c.name}</td>
                        <td className="py-3 px-3 text-slate-500">{c.contactPerson || '-'}</td>
                        <td className="py-3 px-3 text-slate-500">{c.mobile} {c.email ? `(${c.email})` : ''}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{c.status}</span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('sales_vendor', c)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.CUSTOMERS, c.id, 'Sales Vendor')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 2. PURCHASE VENDORS TAB */}
        {activeTab === 'purchase_vendors' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Purchase Vendors Master</h3>
              <button
                onClick={() => handleOpenModal('purchase_vendor')}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Purchase Vendor</span>
              </button>
            </div>
            {purchaseVendors.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No Purchase Vendors added yet. Master dropdowns will populate from here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Code</th>
                      <th className="pb-3 px-3">Vendor Name</th>
                      <th className="pb-3 px-3">GSTIN</th>
                      <th className="pb-3 px-3">Contact</th>
                      <th className="pb-3 px-3">Status</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {purchaseVendors.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-extrabold text-indigo-600">{v.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{v.name}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{v.gstin || '-'}</td>
                        <td className="py-3 px-3 text-slate-500">{v.mobile}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">{v.status}</span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('purchase_vendor', v)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.PURCHASE_VENDORS, v.id, 'Purchase Vendor')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 3. PRODUCTS TAB */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Product Master</h3>
              <button
                onClick={() => handleOpenModal('product')}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
            {products.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No Products added yet. Order creation dropdowns source from here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Code</th>
                      <th className="pb-3 px-3">Product Name</th>
                      <th className="pb-3 px-3">Unit</th>
                      <th className="pb-3 px-3">Tax %</th>
                      <th className="pb-3 px-3">Default Rate</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {products.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-extrabold text-emerald-600">{p.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{p.name}</td>
                        <td className="py-3 px-3 text-slate-500">{p.unit}</td>
                        <td className="py-3 px-3 text-slate-500">{p.taxRate}%</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">₹ {parseFloat(p.defaultRate || 0).toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('product', p)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.PRODUCTS, p.id, 'Product')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 4. TRANSPORTERS TAB */}
        {activeTab === 'transporters' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Transporters Master</h3>
              <button
                onClick={() => handleOpenModal('transporter')}
                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Transporter</span>
              </button>
            </div>
            {transporters.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No Transporters added. Dispatch stage courier dropdowns will source from here.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Code</th>
                      <th className="pb-3 px-3">Transporter / Courier Name</th>
                      <th className="pb-3 px-3">Contact Person</th>
                      <th className="pb-3 px-3">Mobile</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {transporters.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-extrabold text-purple-600">{t.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{t.name}</td>
                        <td className="py-3 px-3 text-slate-500">{t.contactPerson || '-'}</td>
                        <td className="py-3 px-3 text-slate-500">{t.mobile}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('transporter', t)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.TRANSPORTERS, t.id, 'Transporter')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 5. DEPARTMENTS TAB */}
        {activeTab === 'departments' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Department Master</h3>
              <button
                onClick={() => handleOpenModal('department')}
                className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Department</span>
              </button>
            </div>
            {departments.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No Departments added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Code</th>
                      <th className="pb-3 px-3">Department Name</th>
                      <th className="pb-3 px-3">Head of Dept</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {departments.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-extrabold text-indigo-600">{d.code}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{d.name}</td>
                        <td className="py-3 px-3 text-slate-500">{d.headName || '-'}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('department', d)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.DEPARTMENTS, d.id, 'Department')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 6. USERS & EMPLOYEES TAB */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">User / Employee Master & Active Testing Session</h3>
                <p className="text-xs text-slate-400">Current Session: <strong className="text-indigo-600 dark:text-indigo-400">{currentUser?.name || 'Default Admin'}</strong></p>
              </div>
              <button
                onClick={() => handleOpenModal('user')}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Create User / Employee</span>
              </button>
            </div>
            {users.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No User records created yet. Add users to assign stage tasks.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Code</th>
                      <th className="pb-3 px-3">User Name</th>
                      <th className="pb-3 px-3">Department</th>
                      <th className="pb-3 px-3">Designation / Role</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {users.map((u) => {
                      const isCurrent = currentUser?.id === u.id || currentUser?.code === u.code;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          <td className="py-3 px-3 font-extrabold text-indigo-600">{u.code}</td>
                          <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">
                            {u.name} {isCurrent && <span className="ml-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Active Session</span>}
                          </td>
                          <td className="py-3 px-3 text-slate-500">{u.department}</td>
                          <td className="py-3 px-3 text-slate-500">{u.designation} ({u.userGroup})</td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setCurrentUser(u);
                                logAuditAction('Local User Switched', 'User Session', u.id, { name: u.name });
                              }}
                              disabled={isCurrent}
                              className="px-2 py-1 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded text-[11px] font-bold disabled:opacity-40"
                            >
                              {isCurrent ? 'Active' : 'Set Active'}
                            </button>
                            <button onClick={() => handleOpenModal('user', u)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={() => handleDelete(STORAGE_KEYS.EMPLOYEES, u.id, 'User')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 7. TAT CONFIG TAB */}
        {activeTab === 'tat' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">TAT Config Master</h3>
              <button
                onClick={() => handleOpenModal('tat')}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add TAT Config</span>
              </button>
            </div>
            {tatConfigs.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No TAT configurations added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">System Name</th>
                      <th className="pb-3 px-3">Stage Name</th>
                      <th className="pb-3 px-3">TAT Value</th>
                      <th className="pb-3 px-3">TAT Unit</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tatConfigs.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-semibold">{t.systemName}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{t.stageName}</td>
                        <td className="py-3 px-3 font-extrabold text-emerald-600">{t.tatValue}</td>
                        <td className="py-3 px-3 text-slate-500">{t.tatUnit}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('tat', t)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.TAT, t.id, 'TAT')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 8. SYSTEMS & STAGES TAB */}
        {activeTab === 'systems_stages' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Systems & Workflow Stages Master</h3>
              <div className="flex space-x-2">
                <button onClick={() => handleOpenModal('system')} className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl">+ System</button>
                <button onClick={() => handleOpenModal('stage')} className="px-3 py-1.5 bg-purple-600 text-white font-bold text-xs rounded-xl">+ Stage</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 uppercase">Configured Systems</h4>
                {systems.length === 0 ? <p className="text-xs text-slate-400">No systems created.</p> : (
                  <div className="space-y-2">
                    {systems.map((s) => (
                      <div key={s.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-900 dark:text-white">{s.name}</span>
                        <div className="space-x-1">
                          <button onClick={() => handleOpenModal('system', s)} className="p-1 text-indigo-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.SYSTEMS, s.id, 'System')} className="p-1 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs mb-3 uppercase">Configured Stages</h4>
                {stages.length === 0 ? <p className="text-xs text-slate-400">No stages created.</p> : (
                  <div className="space-y-2">
                    {stages.map((stg) => (
                      <div key={stg.id} className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border flex justify-between items-center text-xs">
                        <div>
                          <span className="font-extrabold text-indigo-600 mr-2">#{stg.sequence}</span>
                          <span className="font-bold text-slate-900 dark:text-white">{stg.stageName}</span>
                          <span className="text-[10px] text-slate-400 block">{stg.systemName}</span>
                        </div>
                        <div className="space-x-1">
                          <button onClick={() => handleOpenModal('stage', stg)} className="p-1 text-purple-600"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.STAGES, stg.id, 'Stage')} className="p-1 text-rose-600"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 9. HOLIDAYS TAB */}
        {activeTab === 'holidays' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Holidays Master</h3>
              <button
                onClick={() => handleOpenModal('holiday')}
                className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl"
              >
                <Plus className="w-4 h-4" />
                <span>Add Holiday</span>
              </button>
            </div>
            {holidays.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">No Holidays added yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2">
                      <th className="pb-3 px-3">Date</th>
                      <th className="pb-3 px-3">Holiday Name</th>
                      <th className="pb-3 px-3">Type</th>
                      <th className="pb-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {holidays.map((h) => (
                      <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-extrabold text-indigo-600">{h.date}</td>
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-white">{h.name}</td>
                        <td className="py-3 px-3 text-slate-500">{h.type}</td>
                        <td className="py-3 px-3 text-right space-x-2">
                          <button onClick={() => handleOpenModal('holiday', h)} className="p-1 hover:bg-slate-100 rounded text-indigo-600"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleDelete(STORAGE_KEYS.HOLIDAYS, h.id, 'Holiday')} className="p-1 hover:bg-slate-100 rounded text-rose-600"><Trash2 className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DYNAMIC MASTER EDIT/CREATE MODAL */}
      {modalState.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-md shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg capitalize">
              {modalState.data ? `Edit ${modalState.type.replace('_', ' ')}` : `Add ${modalState.type.replace('_', ' ')}`}
            </h3>

            {errorMsg && (
              <div className="p-3 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              {/* Form fields based on master type */}
              {(modalState.type === 'sales_vendor' || modalState.type === 'purchase_vendor') && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Code</label>
                      <input type="text" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Name *</label>
                      <input type="text" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                    </div>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                    <input type="text" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Mobile</label>
                      <input type="text" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Email</label>
                      <input type="email" value={form.email || ''} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl" />
                    </div>
                  </div>
                </>
              )}

              {modalState.type === 'product' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Product Code</label>
                      <input type="text" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Product Name *</label>
                      <input type="text" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Unit</label>
                      <input type="text" value={form.unit || 'Pcs'} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Default Rate (₹)</label>
                      <input type="number" value={form.defaultRate || 0} onChange={(e) => setForm({ ...form, defaultRate: parseFloat(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Tax %</label>
                      <input type="number" value={form.taxRate || 18} onChange={(e) => setForm({ ...form, taxRate: parseFloat(e.target.value) })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                </>
              )}

              {modalState.type === 'transporter' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Transporter / Courier Name *</label>
                    <input type="text" required placeholder="e.g. VRL / BlueDart" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Contact Person</label>
                      <input type="text" value={form.contactPerson || ''} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Mobile</label>
                      <input type="text" value={form.mobile || ''} onChange={(e) => setForm({ ...form, mobile: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                </>
              )}

              {modalState.type === 'department' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Department Name *</label>
                    <input type="text" required placeholder="e.g. Quality Check" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Head of Department</label>
                    <input type="text" value={form.headName || ''} onChange={(e) => setForm({ ...form, headName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                </>
              )}

              {modalState.type === 'user' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Code</label>
                      <input type="text" value={form.code || ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">User Name *</label>
                      <input type="text" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Department</label>
                      <select value={form.department || ''} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                        {departments.map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                        {departments.length === 0 && <option value="Sales">Sales</option>}
                      </select>
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Designation</label>
                      <input type="text" value={form.designation || ''} onChange={(e) => setForm({ ...form, designation: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                </>
              )}

              {modalState.type === 'tat' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">System Name *</label>
                    <select value={form.systemName || ''} onChange={(e) => setForm({ ...form, systemName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                      {systems.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Stage Name *</label>
                    <select value={form.stageName || ''} onChange={(e) => setForm({ ...form, stageName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                      {stages.filter((s) => s.systemName === form.systemName).map((stg) => (
                        <option key={stg.id} value={stg.stageName}>{stg.stageName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">TAT Value *</label>
                      <input type="number" required value={form.tatValue || 2} onChange={(e) => setForm({ ...form, tatValue: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">TAT Unit *</label>
                      <select value={form.tatUnit || 'Hours'} onChange={(e) => setForm({ ...form, tatUnit: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                        <option value="Minutes">Minutes</option>
                        <option value="Hours">Hours</option>
                        <option value="Days">Days</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {modalState.type === 'system' && (
                <div>
                  <label className="block font-bold mb-1">System Name *</label>
                  <input type="text" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                </div>
              )}

              {modalState.type === 'stage' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">System Name *</label>
                    <select value={form.systemName || ''} onChange={(e) => setForm({ ...form, systemName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl">
                      {systems.map((s) => (
                        <option key={s.id} value={s.name}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold mb-1">Stage Name *</label>
                      <input type="text" required value={form.stageName || ''} onChange={(e) => setForm({ ...form, stageName: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Sequence # *</label>
                      <input type="number" required value={form.sequence || 1} onChange={(e) => setForm({ ...form, sequence: parseInt(e.target.value, 10) || 1 })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                    </div>
                  </div>
                </>
              )}

              {modalState.type === 'holiday' && (
                <>
                  <div>
                    <label className="block font-bold mb-1">Holiday Name *</label>
                    <input type="text" required value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Holiday Date *</label>
                    <input type="date" required value={form.date || ''} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 border rounded-xl" />
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setModalState({ isOpen: false, type: '', data: null })}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-md">
                  Save Master
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
