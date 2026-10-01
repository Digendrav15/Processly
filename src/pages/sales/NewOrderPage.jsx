import React, { useState } from 'react';
import {
  PlusCircle,
  Plus,
  Trash2,
  Search,
  Filter,
  Eye,
  X,
  FileText,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  User,
  ArrowRight,
  Clock,
  History
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  STORAGE_KEYS,
  setData,
  generateId,
  generateOrderNumber,
  getTATConfigForStage,
  calculatePlannedDate,
  logAuditAction,
  getCurrentUser
} from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';
import { PlannedTh, PlannedTd, HistoryTatTh, HistoryTatTd } from '../../components/common/TatColumns';

export function NewOrderPage() {
  const navigate = useNavigate();

  const customers = useOTDStorage(STORAGE_KEYS.CUSTOMERS, []);
  const products = useOTDStorage(STORAGE_KEYS.PRODUCTS, []);
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const currentUser = getCurrentUser();

  const [isModalOpen, setIsModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    code: '',
    name: '',
    type: 'Corporate',
    contactPerson: '',
    mobile: '',
    email: '',
    billingAddress: '',
    shippingAddress: '',
    city: '',
    state: '',
    pincode: ''
  });

  const [orderDetails, setOrderDetails] = useState({
    orderNumber: generateOrderNumber(),
    orderDate: new Date().toISOString().split('T')[0],
    expectedDeliveryDate: '',
    priority: 'Normal',
    salesPerson: currentUser?.name || 'Sales Officer',
    paymentTerms: '50% Advance, 50% on Delivery',
    remarks: '',
    attachmentName: ''
  });

  const [orderItems, setOrderItems] = useState([
    {
      id: generateId('ITEM'),
      productId: products[0]?.id || '',
      productCode: products[0]?.code || 'PROD-001',
      productName: products[0]?.name || 'Sample Product',
      quantity: 1,
      unit: products[0]?.unit || 'Pcs',
      rate: products[0]?.defaultRate || 500,
      discount: 0,
      gstPercent: products[0]?.taxRate || 18,
      amount: 0
    }
  ]);

  const handleOpenModal = () => {
    setOrderDetails({
      ...orderDetails,
      orderNumber: generateOrderNumber()
    });
    setIsModalOpen(true);
  };

  const handleSelectCustomer = (custObj) => {
    if (!custObj) return;
    setSelectedCustomerId(custObj.id);
    setCustomerDetails({
      code: custObj.code || '',
      name: custObj.name || '',
      type: custObj.type || 'Corporate',
      contactPerson: custObj.contactPerson || '',
      mobile: custObj.mobile || '',
      email: custObj.email || '',
      billingAddress: custObj.billingAddress || '',
      shippingAddress: custObj.shippingAddress || '',
      city: custObj.city || '',
      state: custObj.state || '',
      pincode: custObj.pincode || ''
    });
  };

  const handleAddItem = () => {
    const p = products[0];
    setOrderItems([
      ...orderItems,
      {
        id: generateId('ITEM'),
        productId: p ? p.id : '',
        productCode: p ? p.code : 'PROD-NEW',
        productName: p ? p.name : 'New Item',
        quantity: 1,
        unit: p ? p.unit : 'Pcs',
        rate: p ? p.defaultRate : 100,
        discount: 0,
        gstPercent: p ? p.taxRate : 18,
        amount: 0
      }
    ]);
  };

  const handleRemoveItem = (idx) => {
    if (orderItems.length === 1) {
      alert('Order must have at least 1 product item.');
      return;
    }
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  const handleProductSelect = (idx, productId) => {
    const p = products.find((prod) => prod.id === productId);
    if (!p) return;
    const updated = [...orderItems];
    updated[idx] = {
      ...updated[idx],
      productId: p.id,
      productCode: p.code,
      productName: p.name,
      unit: p.unit || 'Pcs',
      rate: p.defaultRate || 0,
      gstPercent: p.taxRate || 18
    };
    setOrderItems(updated);
  };

  // Calculations
  const calculateSummary = () => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    const itemsWithCalc = orderItems.map((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      const lineSub = qty * rate;
      const discVal = parseFloat(item.discount) || 0;
      const discAmt = lineSub * (discVal / 100);
      const taxable = lineSub - discAmt;
      const gstVal = parseFloat(item.gstPercent) || 0;
      const gstAmt = taxable * (gstVal / 100);
      const lineTotal = taxable + gstAmt;

      subTotal += lineSub;
      totalDiscount += discAmt;
      totalGst += gstAmt;

      return { ...item, amount: lineTotal };
    });

    const grandTotal = subTotal - totalDiscount + totalGst;
    return { subTotal, totalDiscount, totalGst, grandTotal, itemsWithCalc };
  };

  const { subTotal, totalDiscount, totalGst, grandTotal, itemsWithCalc } = calculateSummary();

  const handleSubmitOrder = (e) => {
    e.preventDefault();
    if (!customerDetails.name.trim()) return alert('Customer Name is required');
    if (orderItems.length === 0) return alert('At least one product item is required');

    const nowStr = new Date().toISOString();
    const systemName = 'Order To Delivery';
    const initialStage = 'Order Verification';

    const tat = getTATConfigForStage(systemName, initialStage);
    const plannedDate = tat ? calculatePlannedDate(nowStr, tat.tatValue, tat.tatUnit) : null;

    const newOrder = {
      id: generateId('ORD'),
      orderNumber: orderDetails.orderNumber,
      systemName,
      customerDetails,
      customerName: customerDetails.name,
      customerCode: customerDetails.code,
      orderDetails,
      orderDate: orderDetails.orderDate,
      expectedDeliveryDate: orderDetails.expectedDeliveryDate,
      priority: orderDetails.priority,
      salesPerson: orderDetails.salesPerson,
      paymentTerms: orderDetails.paymentTerms,
      remarks: orderDetails.remarks,
      attachmentName: orderDetails.attachmentName,
      items: itemsWithCalc,
      subTotal,
      totalDiscount,
      totalGst,
      grandTotal,
      currentStage: initialStage,
      stageStartDate: nowStr,
      plannedCompletionDate: plannedDate,
      currentTatValue: tat ? tat.tatValue : null,
      currentTatUnit: tat ? tat.tatUnit : null,
      status: 'Verification Pending',
      createdAt: nowStr,
      updatedAt: nowStr
    };

    const updatedOrders = [newOrder, ...orders];
    setData(STORAGE_KEYS.ORDERS, updatedOrders);

    logAuditAction('New Order Created', 'Orders', newOrder.orderNumber, {
      customer: newOrder.customerName,
      grandTotal: newOrder.grandTotal,
      initialStage
    });

    setIsModalOpen(false);
    alert(`Order ${newOrder.orderNumber} created successfully and added to New Orders list!`);
  };

  // Pending & History splits
  const pendingOrders = orders.filter((o) => o.currentStage !== 'Order Closed' && o.status !== 'Closed');
  const historyOrders = orders.filter((o) => o.currentStage === 'Order Closed' || o.status === 'Closed');
  const baseOrders = activeTab === 'pending' ? pendingOrders : historyOrders;

  // Filtered Orders for Table
  const filteredOrders = baseOrders.filter((o) => {
    const matchesSearch =
      (o.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.salesPerson || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPriority = priorityFilter === 'ALL' || o.priority === priorityFilter;
    const matchesStatus = statusFilter === 'ALL' || (o.currentStage || o.status) === statusFilter;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-10">
      {/* Header with Top Right Button and Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
            Order To Delivery
          </span>
          <h1 className="text-2xl font-extrabold tracking-tight mt-2">New Orders</h1>
          <p className="text-xs text-slate-400 mt-1">Manage, search, and log new customer sales orders.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700 flex space-x-1 text-xs font-bold">
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'pending'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending ({pendingOrders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>History ({historyOrders.length})</span>
            </button>
          </div>

          <button
            onClick={handleOpenModal}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ New Order</span>
          </button>
        </div>
      </div>

      {/* Filters & Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Order #, Customer Name, Salesperson..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto text-xs">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="font-bold text-slate-500">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
            >
              <option value="ALL">All Priorities</option>
              <option value="Normal">Normal</option>
              <option value="High">High</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-500">Stage/Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-semibold"
            >
              <option value="ALL">All Stages</option>
              <option value="Order Verification">Order Verification</option>
              <option value="Order Approval">Order Approval</option>
              <option value="Advance Payment">Advance Payment</option>
              <option value="Stock Check">Stock Check</option>
              <option value="Order Processing">Order Processing</option>
              <option value="Quality Check (QC)">Quality Check (QC)</option>
              <option value="Ready for Dispatch">Ready for Dispatch</option>
              <option value="Dispatch">Dispatch</option>
              <option value="Delivered">Delivered</option>
              <option value="Payment Collection">Payment Collection</option>
              <option value="Order Closed">Order Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Orders Table Format */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Pending Active Orders' : 'Closed Orders History'} ({filteredOrders.length})
          </h3>
          <span className="text-xs text-slate-400 font-semibold">Total Orders: {orders.length}</span>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 space-y-2">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">No orders found</p>
            <p>Click "+ New Order" at top right to create your first order entry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b">
                <tr>
                  <th className="p-3.5">Order Number</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Order Date</th>
                  <th className="p-3.5">Priority</th>
                  <th className="p-3.5 text-center">Items</th>
                  <th className="p-3.5 text-right">Grand Total (₹)</th>
                  <th className="p-3.5">Current Stage</th>
                  <th className="p-3.5">Salesperson</th>
                  {activeTab === 'pending' ? <PlannedTh /> : <HistoryTatTh />}
                  <th className="p-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-3.5 font-bold font-mono text-indigo-600 dark:text-indigo-400">
                      {o.orderNumber}
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{o.customerName}</div>
                      <div className="text-[10px] text-slate-400">{o.customerCode || 'No Code'}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 dark:text-slate-300 font-medium">
                      {o.orderDate}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${
                          o.priority === 'Urgent'
                            ? 'bg-rose-100 text-rose-800'
                            : o.priority === 'High'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {o.priority || 'Normal'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center font-bold">
                      {o.items?.length || 1}
                    </td>
                    <td className="p-3.5 text-right font-extrabold text-emerald-600">
                      ₹ {parseFloat(o.grandTotal || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-bold border border-indigo-200 dark:border-indigo-800 text-[10px]">
                        {o.currentStage || 'Order Verification'}
                      </span>
                    </td>
                    <td className="p-3.5 text-slate-500 font-medium">
                      {o.salesPerson || 'N/A'}
                    </td>
                    {activeTab === 'pending' ? (
                      <PlannedTd plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate} />
                    ) : (
                      <HistoryTatTd
                        plannedDate={o.plannedCompletionDate || o.expectedDeliveryDate || o.orderDate}
                        actualDate={o.closingDateTime || o.stageDetails?.['Order Closed']?.completedAt || o.updatedAt}
                      />
                    )}
                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => navigate('/sales/verification')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded-xl font-bold transition-all flex items-center justify-center gap-1 mx-auto"
                      >
                        <Eye size={13} />
                        <span>Track Stage</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* NEW ORDER FORM MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-5xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-900 text-white rounded-t-3xl">
              <div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px] uppercase tracking-wider border border-emerald-500/30">
                  New Order Creation Form
                </span>
                <h2 className="text-xl font-extrabold mt-1">Create Sales Order</h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form Scrollable Content */}
            <form onSubmit={handleSubmitOrder} className="p-6 overflow-y-auto space-y-6">
              {/* 1. CUSTOMER DETAILS */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">1. Customer Details</h3>
                  {customers.length > 0 && (
                    <div className="flex items-center space-x-2 text-xs">
                      <span className="text-slate-400 font-semibold">Select Customer:</span>
                      <select
                        value={selectedCustomerId}
                        onChange={(e) => {
                          const c = customers.find((x) => x.id === e.target.value);
                          handleSelectCustomer(c);
                        }}
                        className="px-3 py-1 bg-white dark:bg-slate-800 border rounded-xl font-bold text-indigo-600"
                      >
                        <option value="">-- Choose Sales Vendor / Customer --</option>
                        {customers.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Customer Code</label>
                    <input
                      type="text"
                      value={customerDetails.code}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, code: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Customer Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. ABC Leather Pvt Ltd"
                      value={customerDetails.name}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Customer Type</label>
                    <select
                      value={customerDetails.type}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, type: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    >
                      <option value="Corporate">Corporate</option>
                      <option value="Retail">Retail</option>
                      <option value="Distributor">Distributor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Contact Person</label>
                    <input
                      type="text"
                      value={customerDetails.contactPerson}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, contactPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Mobile Number</label>
                    <input
                      type="tel"
                      value={customerDetails.mobile}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, mobile: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Email</label>
                    <input
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, email: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Billing Address</label>
                    <textarea
                      rows={2}
                      value={customerDetails.billingAddress}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, billingAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Shipping Address</label>
                    <textarea
                      rows={2}
                      value={customerDetails.shippingAddress}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, shippingAddress: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block font-bold mb-1">City</label>
                      <input
                        type="text"
                        value={customerDetails.city}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, city: e.target.value })}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">State</label>
                      <input
                        type="text"
                        value={customerDetails.state}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, state: e.target.value })}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-bold mb-1">Pincode</label>
                      <input
                        type="text"
                        value={customerDetails.pincode}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, pincode: e.target.value })}
                        className="w-full px-2 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. ORDER DETAILS */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border p-5 space-y-4">
                <h3 className="font-extrabold text-slate-900 dark:text-white text-sm pb-3 border-b">
                  2. Order Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-bold mb-1">Order Number (Auto)</label>
                    <input
                      type="text"
                      disabled
                      value={orderDetails.orderNumber}
                      className="w-full px-3 py-2 bg-slate-200 dark:bg-slate-800 border rounded-xl font-extrabold text-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Order Date *</label>
                    <input
                      type="date"
                      required
                      value={orderDetails.orderDate}
                      onChange={(e) => setOrderDetails({ ...orderDetails, orderDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Expected Delivery Date</label>
                    <input
                      type="date"
                      value={orderDetails.expectedDeliveryDate}
                      onChange={(e) => setOrderDetails({ ...orderDetails, expectedDeliveryDate: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Priority</label>
                    <select
                      value={orderDetails.priority}
                      onChange={(e) => setOrderDetails({ ...orderDetails, priority: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    >
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Sales Person</label>
                    <input
                      type="text"
                      value={orderDetails.salesPerson}
                      onChange={(e) => setOrderDetails({ ...orderDetails, salesPerson: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold mb-1">Payment Terms</label>
                    <input
                      type="text"
                      value={orderDetails.paymentTerms}
                      onChange={(e) => setOrderDetails({ ...orderDetails, paymentTerms: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-bold mb-1">Order Remarks</label>
                    <input
                      type="text"
                      placeholder="Remarks..."
                      value={orderDetails.remarks}
                      onChange={(e) => setOrderDetails({ ...orderDetails, remarks: e.target.value })}
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border rounded-xl"
                    />
                  </div>
                </div>
              </div>

              {/* 3. ORDER ITEMS (MULTIPLE PRODUCTS) */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b">
                  <h3 className="font-extrabold text-slate-900 dark:text-white text-sm">
                    3. Order Items (Multiple Products)
                  </h3>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-600 text-white font-bold text-xs rounded-xl"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Product Item</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {orderItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white dark:bg-slate-900 rounded-2xl border grid grid-cols-12 gap-3 items-center text-xs"
                    >
                      <div className="col-span-3">
                        <label className="block font-bold mb-1">Product</label>
                        <select
                          value={item.productId}
                          onChange={(e) => handleProductSelect(idx, e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border rounded-xl"
                        >
                          <option value="">-- Select Product --</option>
                          {products.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-span-2">
                        <label className="block font-bold mb-1">Product Name</label>
                        <input
                          type="text"
                          value={item.productName}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].productName = e.target.value;
                            setOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block font-bold mb-1">Qty</label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].quantity = parseFloat(e.target.value) || 0;
                            setOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border rounded-xl font-bold"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block font-bold mb-1">Unit</label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].unit = e.target.value;
                            setOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block font-bold mb-1">Rate (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={item.rate}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].rate = parseFloat(e.target.value) || 0;
                            setOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block font-bold mb-1">GST %</label>
                        <input
                          type="number"
                          min="0"
                          value={item.gstPercent}
                          onChange={(e) => {
                            const updated = [...orderItems];
                            updated[idx].gstPercent = parseFloat(e.target.value) || 0;
                            setOrderItems(updated);
                          }}
                          className="w-full px-2 py-1.5 bg-slate-50 border rounded-xl"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <span className="block text-[10px] text-slate-400 font-bold">Line Amount</span>
                        <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                          ₹ {item.amount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="col-span-1 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* SUMMARY CALCULATIONS */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
                  <div className="space-y-1">
                    <p>Sub Total: <strong>₹ {subTotal.toLocaleString('en-IN')}</strong></p>
                    <p>Discount: <strong>₹ {totalDiscount.toLocaleString('en-IN')}</strong></p>
                    <p>GST Total: <strong>₹ {totalGst.toLocaleString('en-IN')}</strong></p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-xs block">Grand Total (Auto)</span>
                    <span className="text-2xl font-black text-emerald-400">
                      ₹ {grandTotal.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {/* MODAL FOOTER ACTIONS */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 bg-slate-200 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Submit Order & Add to Table</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
