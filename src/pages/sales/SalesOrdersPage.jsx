import React, { useState } from 'react';
import { ShoppingBag, Plus, Search, Eye, Filter, ArrowRight, AlertCircle, Clock, Trash2, Edit, Layers, FileText } from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, setData, generateId, generateOrderNumber, getTATConfigForStage, calculatePlannedDate, calculateRemainingTime, logAuditAction, getCurrentUser } from '../../services/otdStorageService';
import { OrderStageModal } from './OrderStageModal';

export function SalesOrdersPage() {
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const customers = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);
  const products = useOTDStorage(STORAGE_KEYS.PRODUCTS, []);
  const systems = useOTDStorage(STORAGE_KEYS.SYSTEMS, []);
  const stages = useOTDStorage(STORAGE_KEYS.STAGES, []);
  const tatConfigs = useOTDStorage(STORAGE_KEYS.TAT, []);
  const employees = useOTDStorage(STORAGE_KEYS.EMPLOYEES, []);

  // UI Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');

  // Order Stage Execution Modal State
  const [selectedOrderForStage, setSelectedOrderForStage] = useState(null);

  // Create Order Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [orderForm, setOrderForm] = useState({
    systemName: '',
    customerId: '',
    customerName: '',
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    priority: 'Normal',
    salesPerson: getCurrentUser()?.name || '',
    paymentTerms: '50% Advance, 50% on Delivery',
    remarks: '',
    attachmentName: ''
  });

  // Multiple Order Items
  const [orderItems, setOrderItems] = useState([
    { id: generateId('ITEM'), productId: '', productName: '', qty: 10, unit: 'Pcs', rate: 500, discountPercent: 0, taxPercent: 18 }
  ]);

  const handleOpenCreateModal = () => {
    const defaultSys = systems[0]?.name || 'Order To Delivery';
    setOrderForm({
      systemName: defaultSys,
      customerId: customers[0]?.id || '',
      customerName: customers[0]?.name || '',
      orderDate: new Date().toISOString().split('T')[0],
      expectedDeliveryDate: '',
      priority: 'Normal',
      salesPerson: getCurrentUser()?.name || '',
      paymentTerms: '50% Advance, 50% on Delivery',
      remarks: '',
      attachmentName: ''
    });

    if (products.length > 0) {
      setOrderItems([
        {
          id: generateId('ITEM'),
          productId: products[0].id,
          productName: products[0].name,
          qty: 10,
          unit: products[0].unit || 'Pcs',
          rate: products[0].defaultRate || 500,
          discountPercent: 0,
          taxPercent: products[0].taxRate || 18
        }
      ]);
    } else {
      setOrderItems([]);
    }

    setShowCreateModal(true);
  };

  const handleAddItem = () => {
    const p = products[0];
    setOrderItems([
      ...orderItems,
      {
        id: generateId('ITEM'),
        productId: p ? p.id : '',
        productName: p ? p.name : '',
        qty: 1,
        unit: p ? p.unit : 'Pcs',
        rate: p ? p.defaultRate : 100,
        discountPercent: 0,
        taxPercent: p ? p.taxRate : 18
      }
    ]);
  };

  const handleRemoveItem = (idx) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx, productId) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    const updated = [...orderItems];
    updated[idx] = {
      ...updated[idx],
      productId: p.id,
      productName: p.name,
      unit: p.unit || 'Pcs',
      rate: p.defaultRate || 0,
      taxPercent: p.taxRate || 18
    };
    setOrderItems(updated);
  };

  // Calculations
  const calculateTotals = () => {
    let subtotal = 0;
    let totalTax = 0;

    orderItems.forEach((item) => {
      const lineSub = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      const discount = lineSub * ((parseFloat(item.discountPercent) || 0) / 100);
      const taxable = lineSub - discount;
      const tax = taxable * ((parseFloat(item.taxPercent) || 0) / 100);

      subtotal += taxable;
      totalTax += tax;
    });

    const grandTotal = subtotal + totalTax;
    return { subtotal, totalTax, grandTotal };
  };

  const { subtotal, totalTax, grandTotal } = calculateTotals();

  const handleSaveOrder = (e) => {
    e.preventDefault();
    if (!orderForm.customerId) return alert('Please select a Customer');
    if (orderItems.length === 0) return alert('Please add at least one product item to the order');

    const selectedCustomer = customers.find((c) => c.id === orderForm.customerId);

    // Initial Stage Determination
    const systemName = orderForm.systemName || 'Order To Delivery';
    const systemStages = stages
      .filter((s) => s.status === 'Active' && s.systemName === systemName)
      .sort((a, b) => (parseInt(a.sequence, 10) || 0) - (parseInt(b.sequence, 10) || 0));

    const initialStage = systemStages[0]?.stageName || 'New Order';
    const nowStr = new Date().toISOString();

    // Look up TAT for initial stage
    const tat = getTATConfigForStage(systemName, initialStage);
    const plannedDate = tat ? calculatePlannedDate(nowStr, tat.tatValue, tat.tatUnit) : null;

    const orderNum = generateOrderNumber();

    const newOrder = {
      id: generateId('ORD'),
      orderNumber: orderNum,
      systemName,
      customerId: orderForm.customerId,
      customerName: selectedCustomer ? selectedCustomer.name : orderForm.customerName,
      customerCode: selectedCustomer ? selectedCustomer.code : '',
      customerEmail: selectedCustomer ? selectedCustomer.email : '',
      orderDate: orderForm.orderDate,
      expectedDeliveryDate: orderForm.expectedDeliveryDate,
      priority: orderForm.priority,
      salesPerson: orderForm.salesPerson,
      paymentTerms: orderForm.paymentTerms,
      remarks: orderForm.remarks,
      attachmentName: orderForm.attachmentName,
      items: orderItems,
      subtotal,
      totalTax,
      grandTotal,
      currentStage: initialStage,
      stageStartDate: nowStr,
      plannedCompletionDate: plannedDate,
      currentTatValue: tat ? tat.tatValue : null,
      currentTatUnit: tat ? tat.tatUnit : null,
      status: 'New Order',
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const updatedOrders = [newOrder, ...orders];
    setData(STORAGE_KEYS.ORDERS, updatedOrders);

    logAuditAction('Order Created', 'Orders', newOrder.orderNumber, {
      customer: newOrder.customerName,
      grandTotal: newOrder.grandTotal,
      initialStage
    });

    setShowCreateModal(false);
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter ? o.currentStage === stageFilter : true;
    return matchesSearch && matchesStage;
  });

  return (
    <div className="space-y-2.5">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3.5 py-2.5 rounded-xl shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-tight">Orders Management</h1>
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">Create sales orders and advance workflow stage executions</span>
          </div>
        </div>
        <button
          onClick={() => handleOpenCreateModal()}
          className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create New Order</span>
        </button>
      </div>

      {/* Filter Toolbar */}
      {orders.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-slate-900 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Order # or Customer..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none dark:text-white"
            />
          </div>
          <div className="w-48 sm:w-56 text-xs">
            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
            >
              <option value="">All Workflow Stages</option>
              {stages.map((stg) => (
                <option key={stg.id} value={stg.stageName}>
                  {stg.stageName}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Orders Table / Empty State */}
      {orders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center shadow-xs">
          <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-700 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">No Orders Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            No order records created yet. Click below to create your first order.
          </p>
          <button
            onClick={() => handleOpenCreateModal()}
            className="mt-3 inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Order</span>
          </button>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 text-center text-xs text-slate-400">
          No orders matching search filter "{searchTerm}".
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 z-10">
                <tr className="bg-slate-100/90 dark:bg-slate-800/90 backdrop-blur-xs text-[10px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer</th>
                  <th className="py-2 px-3">Order Date</th>
                  <th className="py-2 px-3">Grand Total</th>
                  <th className="py-2 px-3">Current Stage</th>
                  <th className="py-2 px-3">TAT / Remaining</th>
                  <th className="py-2 px-3">Priority</th>
                  <th className="py-2 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs">
                {filteredOrders.map((o) => {
                  const remaining = calculateRemainingTime(o.plannedCompletionDate, o.status === 'Closed');
                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-400 text-[11px]">{o.orderNumber}</td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white text-[11.5px]">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-slate-500 dark:text-slate-400 text-[11px]">{o.orderDate}</td>
                      <td className="py-1.5 px-3 font-black text-emerald-600 dark:text-emerald-400 text-[11.5px]">
                        ₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 font-semibold text-slate-700 dark:text-slate-200">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-[10.5px] border border-indigo-200 dark:border-indigo-800">
                          {o.currentStage}
                        </span>
                      </td>
                      <td className="py-1.5 px-3">
                        {o.plannedCompletionDate ? (
                          <span
                            className={`inline-flex items-center gap-1 font-bold text-[10.5px] ${
                              remaining.isOverdue ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'
                            }`}
                          >
                            <Clock className="w-3 h-3" />
                            <span>{remaining.text}</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400">No TAT set</span>
                        )}
                      </td>
                      <td className="py-1.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                            o.priority === 'Urgent'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : o.priority === 'High'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {o.priority}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right">
                        <button
                          onClick={() => setSelectedOrderForStage(o)}
                          className="inline-flex items-center space-x-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px] rounded-lg shadow-xs transition-all cursor-pointer"
                        >
                          <span>Update Stage</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* STAGE EXECUTION MODAL */}
      {selectedOrderForStage && (
        <OrderStageModal
          order={selectedOrderForStage}
          isOpen={!!selectedOrderForStage}
          onClose={() => setSelectedOrderForStage(null)}
          onSuccess={() => setSelectedOrderForStage(null)}
        />
      )}

      {/* CREATE ORDER MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-lg">Create New Order</h3>

            {customers.length === 0 && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span><strong>No Customer Found – Add Customer:</strong> You must create a Customer in Customer Master first.</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSaveOrder} className="space-y-4 text-xs">
              {/* Customer & System Selector */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">System *</label>
                  <select
                    required
                    value={orderForm.systemName}
                    onChange={(e) => setOrderForm({ ...orderForm, systemName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    {systems.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Customer *</label>
                  <select
                    required
                    value={orderForm.customerId}
                    onChange={(e) => {
                      const cust = customers.find((c) => c.id === e.target.value);
                      setOrderForm({ ...orderForm, customerId: e.target.value, customerName: cust ? cust.name : '' });
                    }}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="">-- Select Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.code})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Order Meta */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Order Date *</label>
                  <input
                    type="date"
                    required
                    value={orderForm.orderDate}
                    onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Expected Delivery</label>
                  <input
                    type="date"
                    value={orderForm.expectedDeliveryDate}
                    onChange={(e) => setOrderForm({ ...orderForm, expectedDeliveryDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                  <select
                    value={orderForm.priority}
                    onChange={(e) => setOrderForm({ ...orderForm, priority: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              {/* Products Item Table */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white">Order Items & Products *</label>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={products.length === 0}
                    className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 text-[11px]"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Product Item
                  </button>
                </div>

                {products.length === 0 ? (
                  <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl">
                    No products found in Product Master. Please add products in Product Master first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {orderItems.map((item, idx) => (
                      <div key={item.id} className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-12 gap-2 items-center">
                        <div className="col-span-4">
                          <select
                            value={item.productId}
                            onChange={(e) => handleProductSelect(idx, e.target.value)}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          >
                            <option value="">-- Product --</option>
                            {products.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({p.code})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="1"
                            placeholder="Qty"
                            value={item.qty}
                            onChange={(e) => {
                              const updated = [...orderItems];
                              updated[idx].qty = parseFloat(e.target.value) || 1;
                              setOrderItems(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-2">
                          <input
                            type="number"
                            min="0"
                            placeholder="Rate"
                            value={item.rate}
                            onChange={(e) => {
                              const updated = [...orderItems];
                              updated[idx].rate = parseFloat(e.target.value) || 0;
                              setOrderItems(updated);
                            }}
                            className="w-full px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </div>
                        <div className="col-span-3 font-bold text-slate-800 dark:text-slate-200 text-right">
                          ₹ {((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0)).toLocaleString('en-IN')}
                        </div>
                        <div className="col-span-1 text-right">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Order Calculations Summary */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Subtotal:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹ {subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tax / GST (18% Avg):</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">₹ {totalTax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 dark:border-slate-700 pt-1 text-sm">
                  <span className="font-extrabold text-slate-900 dark:text-white">Grand Total:</span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400">₹ {grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">Order Remarks</label>
                <textarea
                  rows={2}
                  placeholder="Special instructions..."
                  value={orderForm.remarks}
                  onChange={(e) => setOrderForm({ ...orderForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={customers.length === 0 || orderItems.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Submit Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
