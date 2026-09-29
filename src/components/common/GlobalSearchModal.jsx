import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  TrendingUp,
  ShoppingCart,
  Users,
  Target,
  FileText,
  Files,
  Wallet,
  CheckSquare,
  ArrowRight,
  ExternalLink,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Command
} from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { SYSTEMS_CONFIG } from '../../config/systemsConfig';
import { getData as getOTDData, STORAGE_KEYS as OTD_KEYS } from '../../services/otdStorageService';
import { getPurchaseData, PURCHASE_STORAGE_KEYS } from '../../services/purchaseStorageService';
import { getData as getLTOData, LTO_KEYS } from '../../services/leadToOrderStorageService';
import { getHRData, HR_KEYS } from '../../services/hrStorageService';
import { getDocSubData, DOC_SUB_KEYS } from '../../services/docSubStorageService';
import { getPettyData, PETTY_KEYS } from '../../services/pettyStorageService';

export function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { switchSystem } = useSystem();
  const inputRef = useRef(null);

  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Focus input whenever opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  // Aggregate searchable items from all systems
  const allSearchableItems = useMemo(() => {
    if (!isOpen) return [];

    const items = [];

    // 1. Navigation Pages
    SYSTEMS_CONFIG.forEach((sys) => {
      sys.navItems.forEach((nav) => {
        items.push({
          id: `nav-${sys.id}-${nav.path}`,
          category: 'PAGES',
          systemId: sys.id,
          title: `${nav.label} (${sys.shortName})`,
          subtitle: `Navigate to ${nav.label} page`,
          badge: sys.badge,
          icon: nav.icon || Layers,
          color: sys.color || 'indigo',
          path: nav.path,
          type: 'navigation'
        });
      });
    });

    // 2. OTD Orders
    try {
      const orders = getOTDData(OTD_KEYS.ORDERS, []);
      orders.forEach((o) => {
        items.push({
          id: `otd-${o.id || o.orderNumber}`,
          category: 'ORDERS',
          systemId: 'sales',
          title: `Order #${o.orderNumber || o.id}`,
          subtitle: `${o.customerName || 'Customer'} • Stage: ${o.currentStage || 'Order Created'}`,
          meta: o.grandTotal ? `₹ ${Number(o.grandTotal).toLocaleString('en-IN')}` : null,
          badge: o.currentStage || 'Active',
          icon: TrendingUp,
          color: 'emerald',
          path: `/sales/tracking?orderId=${encodeURIComponent(o.orderNumber || o.id)}`,
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load OTD orders', e);
    }

    // 3. Leads & Deals
    try {
      const leads = getLTOData(LTO_KEYS.LEADS, []);
      leads.forEach((l) => {
        items.push({
          id: `lto-${l.id || l.leadId}`,
          category: 'LEADS',
          systemId: 'lead-to-orders',
          title: `Lead ${l.leadId}: ${l.customerName || 'Customer'}`,
          subtitle: `${l.productService || 'Requirement'} • Source: ${l.leadSource || 'Direct'}`,
          meta: l.estimatedValue ? `₹ ${Number(l.estimatedValue).toLocaleString('en-IN')}` : null,
          badge: l.status || 'New',
          icon: Target,
          color: 'violet',
          path: `/lead-to-orders/leads?leadId=${encodeURIComponent(l.leadId)}`,
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load Leads', e);
    }

    // 4. Quotations
    try {
      const quotations = getLTOData(LTO_KEYS.QUOTATIONS, []);
      quotations.forEach((q) => {
        items.push({
          id: `quote-${q.id || q.quotationNo}`,
          category: 'LEADS',
          systemId: 'lead-to-orders',
          title: `Quotation ${q.quotationNo}`,
          subtitle: `Customer: ${q.customer || q.customerName} • Lead: ${q.leadId}`,
          meta: q.grandTotal ? `₹ ${Number(q.grandTotal).toLocaleString('en-IN')}` : null,
          badge: q.status || 'Draft',
          icon: FileText,
          color: 'purple',
          path: `/lead-to-orders/quotation?quoteNo=${encodeURIComponent(q.quotationNo)}`,
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load Quotations', e);
    }

    // 5. Purchase Indents & POs
    try {
      const indents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
      indents.forEach((ind) => {
        const poNo = ind.stageDetails?.PO?.payload?.poNumber || ind.poNumber;
        items.push({
          id: `purchase-${ind.id || ind.indentNumber}`,
          category: 'PURCHASE',
          systemId: 'purchase',
          title: `Indent #${ind.indentNumber}${poNo ? ` • PO #${poNo}` : ''}`,
          subtitle: `${ind.materialName || ind.itemDescription || 'Material'} • Vendor: ${ind.vendorName || 'Pending'}`,
          meta: ind.grandTotal ? `₹ ${Number(ind.grandTotal).toLocaleString('en-IN')}` : null,
          badge: ind.currentStage || 'Purchase Indent',
          icon: ShoppingCart,
          color: 'amber',
          path: `/purchase/po?indentId=${encodeURIComponent(ind.indentNumber)}`,
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load Purchase indents', e);
    }

    // 6. Employees (HR)
    try {
      const employees = getHRData(HR_KEYS.ACTIVE_EMPLOYEES, []);
      employees.forEach((emp) => {
        items.push({
          id: `hr-${emp.id || emp.employeeId}`,
          category: 'HR',
          systemId: 'hr',
          title: `${emp.name || emp.fullName} (${emp.employeeId || 'EMP'})`,
          subtitle: `${emp.designation || 'Staff'} • Dept: ${emp.department || 'General'}`,
          meta: emp.mobile || emp.phone || emp.email,
          badge: emp.department || 'Active',
          icon: Users,
          color: 'cyan',
          path: `/hr/active-employees?empId=${encodeURIComponent(emp.employeeId || emp.id)}`,
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load HR employees', e);
    }

    // 7. Documents & Subscriptions
    try {
      const docs = getDocSubData(DOC_SUB_KEYS.DOCUMENTS, []);
      docs.forEach((doc) => {
        items.push({
          id: `doc-${doc.id}`,
          category: 'DOCUMENTS',
          systemId: 'doc-subscription',
          title: doc.title,
          subtitle: `Reg: ${doc.docNumber || '—'} • Dept: ${doc.department}`,
          meta: doc.expiryDate ? `Exp: ${doc.expiryDate}` : 'Perpetual',
          badge: doc.category || 'Compliance',
          icon: Files,
          color: 'blue',
          path: `/doc-subscription/documents?tab=all&search=${encodeURIComponent(doc.title)}`,
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load Documents', e);
    }

    // 8. Petty Cash & Cheques
    try {
      const txns = getPettyData(PETTY_KEYS.TRANSACTIONS, []);
      txns.forEach((tx) => {
        items.push({
          id: `petty-${tx.id || tx.voucherNumber}`,
          category: 'PETTY',
          systemId: 'petty-expenses',
          title: `Voucher #${tx.voucherNumber || tx.id} (${tx.type === 'received' ? 'Cash IN' : 'Expense OUT'})`,
          subtitle: `${tx.payee || tx.source || 'Party'} • Cat: ${tx.category || 'General'}`,
          meta: `₹ ${Number(tx.amount || 0).toLocaleString('en-IN')}`,
          badge: tx.type === 'received' ? 'Inflow' : 'Outgoing',
          icon: Wallet,
          color: 'teal',
          path: tx.type === 'received' ? '/petty-expenses/received' : '/petty-expenses/outgoings',
          type: 'record'
        });
      });
    } catch (e) {
      console.warn('Search: failed to load Petty txns', e);
    }

    return items;
  }, [isOpen]);

  // Filtering based on Query & Category
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();

    return allSearchableItems.filter((item) => {
      // Category filter
      if (activeCategory !== 'ALL' && item.category !== activeCategory) {
        return false;
      }

      if (!q) {
        // When query is empty, show navigation shortcuts & recent top items
        return item.category === 'PAGES' || item.category === activeCategory;
      }

      const matchTitle = item.title?.toLowerCase().includes(q);
      const matchSubtitle = item.subtitle?.toLowerCase().includes(q);
      const matchBadge = item.badge?.toLowerCase().includes(q);
      const matchMeta = item.meta?.toLowerCase().includes(q);
      const matchCategory = item.category?.toLowerCase().includes(q);

      return matchTitle || matchSubtitle || matchBadge || matchMeta || matchCategory;
    }).slice(0, 30); // Cap at top 30
  }, [allSearchableItems, query, activeCategory]);

  // Reset selected index when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredResults]);

  // Keyboard navigation inside modal
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredResults.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelectItem(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const handleSelectItem = (item) => {
    if (item.systemId) {
      switchSystem(item.systemId, false);
    }
    navigate(item.path);
    onClose();
  };

  if (!isOpen) return null;

  const categories = [
    { id: 'ALL', label: 'All Results' },
    { id: 'ORDERS', label: 'Orders (OTD)' },
    { id: 'LEADS', label: 'Leads & Quotes' },
    { id: 'PURCHASE', label: 'Purchase & PO' },
    { id: 'HR', label: 'Employees & HR' },
    { id: 'DOCUMENTS', label: 'Docs & Subs' },
    { id: 'PETTY', label: 'Petty Cash' },
    { id: 'PAGES', label: 'Pages & Stages' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-start justify-center p-3 sm:p-6 md:p-12 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] mt-4 sm:mt-10"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Header Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/80 gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type anything to search... (Order #, Customer, Lead, PO, Employee, Voucher)"
            className="flex-1 bg-transparent text-sm md:text-base font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-500">
            <Command className="w-3 h-3" />
            <span>ESC to close</span>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 overflow-x-auto bg-slate-50/30 dark:bg-slate-950/30 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-3 divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[58vh]">
          {filteredResults.length === 0 ? (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 stroke-[1.5]" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                No matching results found for "{query}"
              </p>
              <p className="text-xs text-slate-400">
                Try searching with Order Number, Customer Name, Lead ID, Employee ID or Voucher No.
              </p>
            </div>
          ) : (
            filteredResults.map((item, index) => {
              const isSelected = index === selectedIndex;
              const IconComp = item.icon || Layers;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 shadow-xs'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white truncate">
                          {item.title}
                        </span>
                        {item.badge && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {item.meta && (
                      <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 hidden sm:inline-block">
                        {item.meta}
                      </span>
                    )}
                    <div
                      className={`p-1.5 rounded-lg transition-transform ${
                        isSelected
                          ? 'text-indigo-600 dark:text-indigo-400 translate-x-1'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    >
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>
              Use <strong className="text-slate-700 dark:text-slate-300">↑</strong> <strong className="text-slate-700 dark:text-slate-300">↓</strong> to navigate
            </span>
            <span>
              <strong className="text-slate-700 dark:text-slate-300">↵ Enter</strong> to select
            </span>
          </div>
          <div>
            Showing <strong className="text-slate-700 dark:text-slate-300">{filteredResults.length}</strong> results
          </div>
        </div>
      </div>
    </div>
  );
}
