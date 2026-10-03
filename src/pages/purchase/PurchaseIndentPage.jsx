import React, { useState, useMemo } from 'react';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  Trash2,
  Package,
  Building2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { usePurchaseStorage } from '../../hooks/usePurchaseStorage';
import {
  PURCHASE_STORAGE_KEYS,
  advancePurchaseStage,
  generateIndentNumber,
  setPurchaseData,
  getPurchaseData
} from '../../services/purchaseStorageService';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function PurchaseIndentPage() {
  const navigate = useNavigate();
  const indents = usePurchaseStorage(PURCHASE_STORAGE_KEYS.INDENTS, []);
  const departments = useOTDStorage(STORAGE_KEYS.DEPARTMENTS, []);
  const vendors = useOTDStorage(STORAGE_KEYS.PURCHASE_VENDORS, []);
  const products = useOTDStorage(STORAGE_KEYS.PRODUCTS, []);
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{"name":"Purchase Executive"}');

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // New Indent Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [indentDate, setIndentDate] = useState(new Date().toISOString().split('T')[0]);
  const [requiredByDate, setRequiredByDate] = useState('');
  const [selectedDept, setSelectedDept] = useState('Production');
  const [indentorName, setIndentorName] = useState(currentUser.name || 'Digendra Verma');
  const [priority, setPriority] = useState('Normal');
  const [preferredVendor, setPreferredVendor] = useState('');
  const [purpose, setPurpose] = useState('');
  const [indentItems, setIndentItems] = useState([
    { productCode: 'RAW-001', productName: 'Raw Material Item', quantity: 10, unit: 'Pcs', estimatedRate: 500, amount: 5000 }
  ]);

  // View Modal State
  const [viewIndent, setViewIndent] = useState(null);

  // 1. Pending Indents
  const pendingIndents = useMemo(() => {
    return indents.filter((item) => {
      const isPending = item.currentStage === 'Purchase Indent';
      if (!isPending) return false;

      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.indentNumber || '').toLowerCase().includes(q) ||
          (item.department || '').toLowerCase().includes(q) ||
          (item.indentorName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm, priorityFilter]);

  // 2. History Indents
  const historyIndents = useMemo(() => {
    return indents.filter((item) => {
      const isHistory =
        item.currentStage !== 'Purchase Indent' ||
        (item.stageDetails && item.stageDetails['Purchase Indent']);
      if (!isHistory) return false;

      if (priorityFilter !== 'ALL' && item.priority !== priorityFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (item.indentNumber || '').toLowerCase().includes(q) ||
          (item.department || '').toLowerCase().includes(q) ||
          (item.indentorName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [indents, searchTerm, priorityFilter]);

  const currentList = activeTab === 'pending' ? pendingIndents : historyIndents;

  const handleAddItem = () => {
    setIndentItems([
      ...indentItems,
      { productCode: '', productName: '', quantity: 1, unit: 'Pcs', estimatedRate: 0, amount: 0 }
    ]);
  };

  const handleRemoveItem = (index) => {
    if (indentItems.length === 1) return;
    setIndentItems(indentItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...indentItems];
    const row = { ...updated[index], [field]: value };

    if (field === 'productCode') {
      const matched = products.find((p) => p.code === value || p.name === value);
      if (matched) {
        row.productName = matched.name;
        row.unit = matched.unit || 'Pcs';
        row.estimatedRate = matched.purchasePrice || matched.price || 0;
      }
    }

    if (field === 'quantity' || field === 'estimatedRate') {
      const qty = parseFloat(field === 'quantity' ? value : row.quantity) || 0;
      const rate = parseFloat(field === 'estimatedRate' ? value : row.estimatedRate) || 0;
      row.amount = qty * rate;
    }

    updated[index] = row;
    setIndentItems(updated);
  };

  const totalEstimatedValue = indentItems.reduce((acc, i) => acc + (parseFloat(i.amount) || 0), 0);

  const handleCreateIndent = (e) => {
    e.preventDefault();
    const newIndentNumber = generateIndentNumber();

    const newRecord = {
      id: `IND-${Date.now()}`,
      indentNumber: newIndentNumber,
      indentDate,
      requiredByDate: requiredByDate || indentDate,
      department: selectedDept,
      indentorName,
      priority,
      preferredVendor: preferredVendor || 'Open Tender / Market',
      purpose,
      items: indentItems,
      totalEstimatedValue,
      currentStage: 'Indent Approval',
      status: 'Approval Pending',
      createdAt: new Date().toISOString(),
      stageDetails: {
        'Purchase Indent': {
          completedAt: new Date().toISOString(),
          completedBy: indentorName,
          remarks: 'Purchase indent created and sent for approval.'
        }
      }
    };

    const existing = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
    setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, [newRecord, ...existing]);

    alert(`Purchase Indent ${newIndentNumber} successfully created and submitted for Approval!`);
    setIsCreateModalOpen(false);
    navigate('/purchase/indent-approval');
  };

  const handleSubmitForApproval = (indent) => {
    advancePurchaseStage(
      indent.id,
      { nextStage: 'Indent Approval', status: 'Approval Pending' },
      'Submitted for management approval'
    );
    alert(`Indent ${indent.indentNumber} submitted for Indent Approval!`);
    navigate('/purchase/indent-approval');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Clean Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] uppercase tracking-wider border border-amber-200 dark:border-amber-800/80">
            Procurement • Step 1
          </span>
          <h1 className="text-sm font-extrabold tracking-tight text-slate-900 dark:text-white">Purchase Indent</h1>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {/* Tab Switcher */}
          <div className="bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700/80 flex space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingIndents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 rounded-md flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({historyIndents.length})</span>
            </button>
          </div>

          {/* New Indent Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-3 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg flex items-center space-x-1 transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>+ New Indent</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Indent #, Dept, Indentor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <span className="text-[11px] text-slate-500 font-bold">Priority:</span>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
          >
            <option value="ALL">All Priorities</option>
            <option value="Urgent">Urgent</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Pending Purchase Indents' : 'Purchase Indent History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <FileText className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No draft indents pending submission' : 'No indent history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Indent #</th>
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Department</th>
                  <th className="py-2 px-3">Indentor</th>
                  <th className="py-2 px-3 text-center">Items</th>
                  <th className="py-2 px-3 text-center">Priority</th>
                  <th className="py-2 px-3 text-right">Est. Value (₹)</th>
                  <th className="py-2 px-3 text-center">Status</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((item) => {
                  const estVal = parseFloat(item.totalEstimatedValue || 0);
                  const itemCount = item.items?.length || 1;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-amber-600 dark:text-amber-400">
                        {item.indentNumber}
                      </td>
                      <td className="py-1.5 px-3 text-slate-500 font-medium">{item.indentDate}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{item.department}</td>
                      <td className="py-1.5 px-3 text-slate-600 dark:text-slate-400 font-medium">{item.indentorName}</td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                          {itemCount} {itemCount > 1 ? 'Items' : 'Item'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            item.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
                              : item.priority === 'High'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {item.priority || 'Normal'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹ {estVal.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300">
                          {item.status || item.currentStage}
                        </span>
                      </td>
                      {activeTab === 'pending' ? (
                        <PlannedTd plannedDate={item.requiredByDate || item.indentDate} />
                      ) : (
                        <HistoryTatTd
                          plannedDate={item.requiredByDate || item.indentDate}
                          actualDate={item.stageDetails?.['Purchase Indent']?.completedAt || item.updatedAt || item.createdAt}
                        />
                      )}
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleSubmitForApproval(item)}
                            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <span>Send Approval</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => setViewIndent(item)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Indent Creation Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-extrabold text-[10px] uppercase">
                  Requisition Form
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">Create Purchase Indent</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIndent} className="p-6 space-y-5">
              {/* Header Info */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Indent Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={indentDate}
                    onChange={(e) => setIndentDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Required By Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={requiredByDate}
                    onChange={(e) => setRequiredByDate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Department *
                  </label>
                  <input
                    type="text"
                    list="dept-options"
                    required
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <datalist id="dept-options">
                    {departments.map((d, i) => (
                      <option key={i} value={d.name} />
                    ))}
                    <option value="Production" />
                    <option value="Maintenance" />
                    <option value="Electrical" />
                    <option value="Quality" />
                  </datalist>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Priority Level *
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Indentor Name
                  </label>
                  <input
                    type="text"
                    value={indentorName}
                    onChange={(e) => setIndentorName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Preferred Vendor (Optional)
                  </label>
                  <input
                    type="text"
                    list="vendor-options"
                    value={preferredVendor}
                    onChange={(e) => setPreferredVendor(e.target.value)}
                    placeholder="e.g. Tata Steel Ltd, SKF Bearings..."
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <datalist id="vendor-options">
                    {vendors.map((v, i) => (
                      <option key={i} value={v.name} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Package className="w-4 h-4 text-amber-500" />
                    Indent Material Items
                  </label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Item Name / Code</th>
                        <th className="p-2.5 text-center w-24">Qty</th>
                        <th className="p-2.5 text-center w-20">Unit</th>
                        <th className="p-2.5 text-right w-28">Est. Rate (₹)</th>
                        <th className="p-2.5 text-right w-28">Amount (₹)</th>
                        <th className="p-2.5 text-center w-12">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800 dark:text-slate-200">
                      {indentItems.map((row, idx) => (
                        <tr key={idx}>
                          <td className="p-2">
                            <input
                              type="text"
                              required
                              placeholder="Product Name or Code"
                              value={row.productName}
                              onChange={(e) => handleItemChange(idx, 'productName', e.target.value)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs font-semibold focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              min="1"
                              value={row.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-center font-bold focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-center">
                            <input
                              type="text"
                              value={row.unit}
                              onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-center font-bold focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={row.estimatedRate}
                              onChange={(e) => handleItemChange(idx, 'estimatedRate', e.target.value)}
                              className="w-full p-2 bg-slate-50 dark:bg-slate-800 border rounded-lg text-xs text-right font-bold focus:outline-none"
                            />
                          </td>
                          <td className="p-2 text-right font-extrabold text-slate-900 dark:text-white">
                            ₹ {(row.amount || 0).toLocaleString('en-IN')}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              disabled={indentItems.length === 1}
                              className="p-1 text-slate-400 hover:text-rose-600 disabled:opacity-30 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end p-2 font-black text-sm text-slate-900 dark:text-white">
                  Total Estimated Value: ₹ {totalEstimatedValue.toLocaleString('en-IN')}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Purpose / Requisition Justification *
                </label>
                <textarea
                  rows="2"
                  required
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="Explain requirement reason, machine line, or project name..."
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  <span>Submit Requisition</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {viewIndent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <div>
                <span className="text-[10px] font-bold text-amber-600 uppercase">Indent Details</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white">{viewIndent.indentNumber}</h3>
              </div>
              <button
                onClick={() => setViewIndent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-xs">
              <div>
                <span className="text-slate-400 block font-bold">Department</span>
                <span className="font-extrabold">{viewIndent.department}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Indentor</span>
                <span className="font-extrabold">{viewIndent.indentorName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Date</span>
                <span className="font-extrabold">{viewIndent.indentDate}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Priority</span>
                <span className="font-extrabold text-amber-600">{viewIndent.priority}</span>
              </div>
            </div>

            <div className="border rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b">
                  <tr>
                    <th className="p-2.5">Item</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Est. Rate</th>
                    <th className="p-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viewIndent.items?.map((it, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5 font-bold">{it.productName}</td>
                      <td className="p-2.5 text-center">{it.quantity} {it.unit}</td>
                      <td className="p-2.5 text-right">₹ {parseFloat(it.estimatedRate || 0).toLocaleString('en-IN')}</td>
                      <td className="p-2.5 text-right font-bold">₹ {parseFloat(it.amount || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-3 border-t">
              <span className="text-xs text-slate-500 font-medium">Preferred Vendor: {viewIndent.preferredVendor || 'N/A'}</span>
              <span className="text-sm font-black text-amber-600">Total: ₹ {parseFloat(viewIndent.totalEstimatedValue || 0).toLocaleString('en-IN')}</span>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewIndent(null)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 font-bold text-xs rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
