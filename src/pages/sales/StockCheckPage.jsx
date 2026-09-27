import React, { useState, useMemo } from 'react';
import {
  PackageCheck,
  Search,
  Filter,
  Clock,
  History,
  Eye,
  X,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Warehouse,
  Boxes
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import { STORAGE_KEYS, advanceOrderStage } from '../../services/otdStorageService';
import { useNavigate } from 'react-router-dom';

export function StockCheckPage() {
  const navigate = useNavigate();
  const orders = useOTDStorage(STORAGE_KEYS.ORDERS, []);
  const products = useOTDStorage(STORAGE_KEYS.PRODUCTS, []);

  const [activeTab, setActiveTab] = useState('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modal states
  const [modalOrder, setModalOrder] = useState(null);
  const [isViewOnly, setIsViewOnly] = useState(false);

  // Form states for active modal
  const [stockItems, setStockItems] = useState([]);
  const [overallStatus, setOverallStatus] = useState('Available');
  const [warehouseLocation, setWarehouseLocation] = useState('Central Warehouse (Rack A-1)');
  const [verificationDate, setVerificationDate] = useState(new Date().toISOString().split('T')[0]);
  const [remarks, setRemarks] = useState('');

  // 1. Pending Orders (Awaiting Stock Check)
  const pendingOrders = useMemo(() => {
    return orders.filter((o) => {
      const isStageMatch = o.currentStage === 'Stock Check' || o.status === 'Stock Check Pending';
      const hasCompletedStock = !!o.overallStockStatus && o.currentStage !== 'Stock Check';
      if (!isStageMatch || hasCompletedStock) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm]);

  // 2. History Orders (Already checked stock)
  const historyOrders = useMemo(() => {
    return orders.filter((o) => {
      const hasHistory =
        !!o.overallStockStatus ||
        !!o.stockCheckDate ||
        (o.stageDetails && !!o.stageDetails['Stock Check']);

      if (!hasHistory) return false;

      if (statusFilter !== 'ALL' && o.overallStockStatus !== statusFilter) return false;

      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        return (
          (o.orderNumber || '').toLowerCase().includes(q) ||
          (o.customerName || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [orders, searchTerm, statusFilter]);

  const currentList = activeTab === 'pending' ? pendingOrders : historyOrders;

  const handleOpenAction = (order, viewOnly = false) => {
    setModalOrder(order);
    setIsViewOnly(viewOnly);

    const items = order.items && order.items.length > 0 ? order.items : [
      {
        productCode: order.productCode || 'PROD-001',
        productName: order.productName || 'Standard Item',
        quantity: order.quantity || 1,
        unit: order.unit || 'Pcs',
      }
    ];

    if (viewOnly && order.stockItems && order.stockItems.length > 0) {
      setStockItems(order.stockItems);
      setOverallStatus(order.overallStockStatus || 'Available');
      setWarehouseLocation(order.warehouseLocation || 'Central Warehouse');
      setVerificationDate(order.stockCheckDate || new Date().toISOString().split('T')[0]);
      setRemarks(order.stockRemarks || '');
    } else {
      const mapped = items.map((item) => {
        const matchedProd = products.find((p) => p.code === item.productCode || p.name === item.productName);
        const avail = matchedProd ? parseFloat(matchedProd.stock || matchedProd.quantity || 100) : 100;
        const req = parseFloat(item.quantity || 1);
        const short = Math.max(0, req - avail);
        let st = 'Available';
        if (avail === 0) st = 'Out of Stock';
        else if (avail < req) st = 'Partial';

        return {
          ...item,
          requiredQuantity: req,
          availableQuantity: avail,
          shortQuantity: short,
          stockStatus: st,
          location: matchedProd?.warehouseLocation || 'Central Warehouse (Rack A-1)',
        };
      });

      setStockItems(mapped);
      const anyOut = mapped.some((i) => i.stockStatus === 'Out of Stock');
      const anyPartial = mapped.some((i) => i.stockStatus === 'Partial');
      const autoOverall = anyOut ? 'Out of Stock' : (anyPartial ? 'Partial' : 'Available');

      setOverallStatus(order.overallStockStatus || autoOverall);
      setWarehouseLocation(order.warehouseLocation || 'Central Warehouse (Rack A-1)');
      setVerificationDate(new Date().toISOString().split('T')[0]);
      setRemarks(order.stockRemarks || (autoOverall === 'Available' ? 'All items in stock and allocated.' : 'Stock shortage identified.'));
    }
  };

  const handleAvailableQtyChange = (index, val) => {
    const updated = [...stockItems];
    const avail = Math.max(0, parseFloat(val || 0));
    const req = updated[index].requiredQuantity;
    const short = Math.max(0, req - avail);
    let st = 'Available';
    if (avail === 0) st = 'Out of Stock';
    else if (avail < req) st = 'Partial';

    updated[index] = {
      ...updated[index],
      availableQuantity: avail,
      shortQuantity: short,
      stockStatus: st,
    };
    setStockItems(updated);

    const anyOut = updated.some((i) => i.stockStatus === 'Out of Stock');
    const anyPartial = updated.some((i) => i.stockStatus === 'Partial');
    setOverallStatus(anyOut ? 'Out of Stock' : (anyPartial ? 'Partial' : 'Available'));
  };

  const handleCloseModal = () => {
    setModalOrder(null);
    setIsViewOnly(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!modalOrder) return;

    const payload = {
      stockItems,
      overallStockStatus: overallStatus,
      warehouseLocation,
      stockCheckDate: verificationDate,
      stockRemarks: remarks,
      nextStage: 'Order Processing',
      status: overallStatus === 'Available' ? 'Processing In Progress' : 'Stock Shortage',
    };

    advanceOrderStage(modalOrder.id, payload, `Stock check: ${overallStatus} (${stockItems.length} items verified)`);
    alert(`Stock check submitted for Order ${modalOrder.orderNumber} (${overallStatus})! Moved to History & Order Processing.`);

    handleCloseModal();
    navigate('/sales/processing');
  };

  return (
    <div className="space-y-2.5 pb-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gradient-to-r from-slate-900 to-slate-800 px-3.5 py-2.5 rounded-xl text-white shadow-sm border border-slate-700/60">
        <div>
          <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 font-extrabold text-[10px] uppercase tracking-wider border border-blue-500/30">
            Order To Delivery
          </span>
          <h1 className="text-base font-extrabold tracking-tight mt-0.5">Stock Check</h1>
          <p className="text-[11px] text-slate-400">Verify real-time inventory availability, allocate batches, and identify shortages.</p>
        </div>

        {/* Tab Switcher */}
        <div className="bg-slate-800/80 p-1 rounded-xl border border-slate-700 flex space-x-1.5 text-xs font-bold">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'pending'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending ({pendingOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all cursor-pointer ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>History ({historyOrders.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-2.5 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2 w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search Order # or Customer..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border rounded-lg font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {activeTab === 'history' && (
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-[11px] text-slate-500 font-bold">Stock Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-800 border rounded-lg px-2.5 py-1 text-xs font-bold focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="Available">Available</option>
              <option value="Partial">Partial</option>
              <option value="Out of Stock">Out of Stock</option>
            </select>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
        <div className="px-3 py-2 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
          <h3 className="font-extrabold text-xs text-slate-900 dark:text-white">
            {activeTab === 'pending' ? 'Orders Pending Stock Check' : 'Stock Check History'} ({currentList.length})
          </h3>
        </div>

        {currentList.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-1.5">
            <PackageCheck className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-600 dark:text-slate-300">
              {activeTab === 'pending' ? 'No orders currently pending stock check' : 'No stock check history records found'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto max-h-[calc(100vh-210px)] overflow-y-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 font-bold text-slate-700 dark:text-slate-300 border-b sticky top-0 z-10">
                <tr>
                  <th className="py-2 px-3">Order Number</th>
                  <th className="py-2 px-3">Customer Name</th>
                  <th className="py-2 px-3">Order Date</th>
                  <th className="py-2 px-3 text-center">Items Count</th>
                  <th className="py-2 px-3 text-right">Order Total (₹)</th>
                  <th className="py-2 px-3 text-center">Stock Status</th>
                  <th className="py-2 px-3 text-center">Verification Date</th>
                  <th className="py-2 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentList.map((o) => {
                  const grand = parseFloat(o.grandTotal || 0);
                  const itemsCount = (o.items && o.items.length) || 1;
                  const stockSt = o.overallStockStatus || (activeTab === 'pending' ? 'Pending Check' : 'Checked');

                  return (
                    <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-1.5 px-3 font-bold font-mono text-blue-600 dark:text-blue-400">
                        {o.orderNumber}
                      </td>
                      <td className="py-1.5 px-3 font-bold text-slate-900 dark:text-white">{o.customerName}</td>
                      <td className="py-1.5 px-3 text-slate-500 font-medium">{o.orderDate}</td>
                      <td className="py-1.5 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 font-semibold">
                          {itemsCount} {itemsCount > 1 ? 'Items' : 'Item'}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-right font-extrabold text-slate-900 dark:text-white">
                        ₹ {grand.toLocaleString('en-IN')}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                            stockSt === 'Available'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : stockSt === 'Partial'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                              : stockSt === 'Out of Stock'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                          }`}
                        >
                          {stockSt}
                        </span>
                      </td>
                      <td className="py-1.5 px-3 text-center text-slate-500 font-medium">
                        {o.stockCheckDate || '-'}
                      </td>
                      <td className="py-1.5 px-3 text-center">
                        {activeTab === 'pending' ? (
                          <button
                            onClick={() => handleOpenAction(o, false)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer shadow-xs"
                          >
                            <PackageCheck className="w-3 h-3" />
                            <span>Check Stock</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAction(o, true)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-[11px] flex items-center justify-center space-x-1 mx-auto transition-all cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
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

      {/* Stock Check Action / View Modal */}
      {modalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col">
            {/* Modal Header */}
            <div className="p-5 border-b flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40 sticky top-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md z-10">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-extrabold text-[10px] uppercase">
                  {isViewOnly ? 'Stock Check Record (Read-Only)' : 'Perform Stock Verification'}
                </span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">
                  Order: {modalOrder.orderNumber} - {modalOrder.customerName}
                </h3>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full bg-slate-100 dark:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Order Info Summary */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border text-xs">
                <div>
                  <span className="text-slate-400 block font-bold">Order Date</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{modalOrder.orderDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Expected Delivery</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{modalOrder.expectedDeliveryDate || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Total Amount</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    ₹ {parseFloat(modalOrder.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-bold">Salesperson</span>
                  <span className="font-extrabold text-slate-800 dark:text-slate-200">{modalOrder.salesPerson || 'Digendra'}</span>
                </div>
              </div>

              {/* Items Inventory Check Table */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Boxes className="w-4 h-4 text-blue-600" />
                  Order Items Availability Check
                </label>
                <div className="border rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-bold border-b text-slate-700 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Product</th>
                        <th className="p-2.5 text-center">Required</th>
                        <th className="p-2.5 text-center">Available</th>
                        <th className="p-2.5 text-center">Shortage</th>
                        <th className="p-2.5 text-center">Item Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y text-slate-800 dark:text-slate-200">
                      {stockItems.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5">
                            <p className="font-bold text-slate-900 dark:text-white">{item.productName}</p>
                            <span className="text-[10px] text-slate-400 font-mono">{item.productCode}</span>
                          </td>
                          <td className="p-2.5 text-center font-bold">
                            {item.requiredQuantity} {item.unit || 'Pcs'}
                          </td>
                          <td className="p-2.5 text-center">
                            {isViewOnly ? (
                              <span className="font-extrabold">{item.availableQuantity}</span>
                            ) : (
                              <input
                                type="number"
                                min="0"
                                value={item.availableQuantity}
                                onChange={(e) => handleAvailableQtyChange(idx, e.target.value)}
                                className="w-20 px-2 py-1 text-center font-bold border rounded-lg bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            )}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className={`font-bold ${item.shortQuantity > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                              {item.shortQuantity}
                            </span>
                          </td>
                          <td className="p-2.5 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                item.stockStatus === 'Available'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : item.stockStatus === 'Partial'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {item.stockStatus}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Form Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Overall Stock Status *
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {overallStatus}
                    </div>
                  ) : (
                    <select
                      value={overallStatus}
                      onChange={(e) => setOverallStatus(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="Available">Available (All items ready)</option>
                      <option value="Partial">Partial (Partial stock available)</option>
                      <option value="Out of Stock">Out of Stock (Need Reorder/Manufacturing)</option>
                    </select>
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Warehouse / Storage Location
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {warehouseLocation}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={warehouseLocation}
                      onChange={(e) => setWarehouseLocation(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Verification Date
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold">
                      {verificationDate}
                    </div>
                  ) : (
                    <input
                      type="date"
                      value={verificationDate}
                      onChange={(e) => setVerificationDate(e.target.value)}
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Stock Verification Remarks
                  </label>
                  {isViewOnly ? (
                    <div className="p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300">
                      {remarks || 'None'}
                    </div>
                  ) : (
                    <textarea
                      rows="2"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Enter inventory notes or batch allocations..."
                      className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Close
                </button>

                {!isViewOnly && (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer shadow-lg shadow-blue-500/20"
                  >
                    <span>Confirm Stock & Proceed</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
