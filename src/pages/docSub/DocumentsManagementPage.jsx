import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Download,
  Building2,
  Calendar,
  Layers,
  ArrowUpDown,
  XCircle,
  FileSpreadsheet
} from 'lucide-react';
import {
  getDocuments,
  deleteDocument,
  getDaysDiff,
  formatDate,
  DOCUMENT_CATEGORIES
} from '../../services/docSubStorageService';
import AddDocumentModal from '../../components/docSub/AddDocumentModal';
import VerifyDocModal from '../../components/docSub/VerifyDocModal';
import RenewModal from '../../components/docSub/RenewModal';
import DocumentViewModal from '../../components/docSub/DocumentViewModal';

export default function DocumentsManagementPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'all';

  const [documents, setDocuments] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [selectedCriticality, setSelectedCriticality] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'grid'

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [verifyingDoc, setVerifyingDoc] = useState(null);
  const [renewingDoc, setRenewingDoc] = useState(null);
  const [viewingDoc, setViewingDoc] = useState(null);

  const loadDocs = () => {
    setDocuments(getDocuments());
  };

  useEffect(() => {
    loadDocs();
    const handleUpdate = () => loadDocs();
    window.addEventListener('docsub_storage_update', handleUpdate);
    return () => window.removeEventListener('docsub_storage_update', handleUpdate);
  }, []);

  // Handle ?tab=add from navigation
  useEffect(() => {
    if (activeTab === 'add') {
      setShowAddModal(true);
    }
  }, [activeTab]);

  // Compute counts for tabs
  const tabCounts = useMemo(() => {
    let pending = 0;
    let expiring = 0;
    let expired = 0;

    documents.forEach((d) => {
      if (d.verificationStatus === 'Pending Verification') pending++;
      if (!d.isPerpetual && d.expiryDate) {
        const days = getDaysDiff(d.expiryDate);
        if (days !== null && days < 0) expired++;
        else if (days !== null && days >= 0 && days <= 30) expiring++;
      }
    });

    return {
      all: documents.length,
      pending,
      expiring,
      expired
    };
  }, [documents]);

  // Filtered documents
  const filteredDocs = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Tab filter
      if (activeTab === 'pending' && doc.verificationStatus !== 'Pending Verification') {
        return false;
      }
      if (activeTab === 'expiring') {
        if (doc.isPerpetual || !doc.expiryDate) return false;
        const days = getDaysDiff(doc.expiryDate);
        if (days === null || days < 0 || days > 30) return false;
      }
      if (activeTab === 'expired') {
        if (doc.isPerpetual || !doc.expiryDate) return false;
        const days = getDaysDiff(doc.expiryDate);
        if (days === null || days >= 0) return false;
      }

      // 2. Category filter
      if (selectedCategory !== 'All' && doc.category !== selectedCategory) {
        return false;
      }

      // 3. Dept filter
      if (selectedDept !== 'All' && doc.department !== selectedDept) {
        return false;
      }

      // 4. Criticality
      if (selectedCriticality !== 'All' && doc.criticality !== selectedCriticality) {
        return false;
      }

      // 5. Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = doc.title?.toLowerCase().includes(q);
        const matchCat = doc.category?.toLowerCase().includes(q);
        const matchCust = doc.custodian?.toLowerCase().includes(q);
        const matchNum = doc.docNumber?.toLowerCase().includes(q);
        const matchIssuer = doc.issuer?.toLowerCase().includes(q);
        return matchTitle || matchCat || matchCust || matchNum || matchIssuer;
      }

      return true;
    });
  }, [documents, activeTab, selectedCategory, selectedDept, selectedCriticality, searchQuery]);

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to permanently delete this document record?')) {
      deleteDocument(id);
      loadDocs();
    }
  };

  const handleExportCSV = () => {
    const headers = [
      'Document ID',
      'Title',
      'Category',
      'Doc Number',
      'Issuer',
      'Issue Date',
      'Expiry Date',
      'Perpetual',
      'Verification Status',
      'Department',
      'Custodian',
      'Criticality'
    ];

    const rows = filteredDocs.map((d) => [
      d.id,
      `"${d.title.replace(/"/g, '""')}"`,
      `"${d.category}"`,
      `"${d.docNumber || ''}"`,
      `"${d.issuer || ''}"`,
      d.issueDate,
      d.expiryDate || 'N/A',
      d.isPerpetual ? 'Yes' : 'No',
      d.verificationStatus,
      d.department,
      d.custodian,
      d.criticality
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `documents_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Distinct departments for filter
  const departments = useMemo(() => {
    const set = new Set(documents.map((d) => d.department).filter(Boolean));
    return ['All', ...Array.from(set)];
  }, [documents]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5 flex-wrap">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-md shadow-blue-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <span>Corporate Documents & Contracts</span>
            {activeTab === 'pending' && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 rounded-full border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Pending Verification ({tabCounts.pending})
              </span>
            )}
            {activeTab === 'expiring' && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 rounded-full border border-orange-300 dark:border-orange-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Expiring Soon (&le;30d) ({tabCounts.expiring})
              </span>
            )}
            {activeTab === 'expired' && (
              <span className="px-2.5 py-0.5 text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 rounded-full border border-rose-300 dark:border-rose-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Expired ({tabCounts.expired})
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Statutory licenses, company registrations, agreements, SLAs, and compliance certificates
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            Export CSV
          </button>
          <button
            onClick={() => {
              setEditingDoc(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Add Document
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, doc #, category, custodian, issuer..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Categories</option>
              {DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d === 'All' ? 'All Departments' : d}
                </option>
              ))}
            </select>
          </div>

          {/* Criticality Filter */}
          <div>
            <select
              value={selectedCriticality}
              onChange={(e) => setSelectedCriticality(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="All">All Criticality</option>
              <option value="High">High Criticality</option>
              <option value="Medium">Medium Criticality</option>
              <option value="Low">Low Criticality</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
          <span>
            Showing <strong>{filteredDocs.length}</strong> of {documents.length} documents
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                  : 'hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Cards Grid
            </button>
          </div>
        </div>
      </div>

      {/* Main Listing View */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center space-y-3">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full w-12 h-12 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">No documents found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Try adjusting your search criteria or register a new document using the Add Document button.
          </p>
          <button
            onClick={() => {
              setEditingDoc(null);
              setShowAddModal(true);
            }}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
          >
            Add New Document
          </button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-4 py-3.5">Doc ID & Title</th>
                  <th className="px-4 py-3.5">Category & Dept</th>
                  <th className="px-4 py-3.5">Doc # / Issuer</th>
                  <th className="px-4 py-3.5">Validity / Expiry</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-4 py-3.5">Custodian</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => {
                  const days = doc.isPerpetual ? null : getDaysDiff(doc.expiryDate);
                  const isExp = days !== null && days < 0;
                  const isExpSoon = days !== null && days >= 0 && days <= 30;

                  return (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="px-4 py-3.5">
                        <div className="flex items-start gap-2.5">
                          <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 mt-0.5">
                            {doc.id}
                          </span>
                          <div>
                            <span
                              onClick={() => setViewingDoc(doc)}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer block"
                            >
                              {doc.title}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {doc.fileName || 'No file attached'}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[180px]">
                          {doc.category}
                        </p>
                        <p className="text-[11px] text-slate-400">{doc.department}</p>
                      </td>

                      <td className="px-4 py-3.5">
                        <p className="font-mono text-slate-700 dark:text-slate-300">
                          {doc.docNumber || '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          {doc.issuer || '—'}
                        </p>
                      </td>

                      <td className="px-4 py-3.5">
                        {doc.isPerpetual ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Perpetual (No Expiry)
                          </span>
                        ) : (
                          <div>
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {formatDate(doc.expiryDate)}
                            </p>
                            <span
                              className={`text-[10px] font-bold ${
                                isExp
                                  ? 'text-rose-600'
                                  : isExpSoon
                                  ? 'text-amber-600'
                                  : 'text-slate-400'
                              }`}
                            >
                              {isExp
                                ? `Expired ${Math.abs(days)}d ago`
                                : isExpSoon
                                ? `Due in ${days}d`
                                : `${days} days left`}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            doc.verificationStatus === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                              : doc.verificationStatus === 'Rejected'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          }`}
                        >
                          {doc.verificationStatus === 'Verified' && (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          {doc.verificationStatus}
                        </span>
                      </td>

                      <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300 font-medium">
                        {doc.custodian || 'Administrator'}
                      </td>

                      <td className="px-4 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setViewingDoc(doc)}
                            title="View Details"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {doc.verificationStatus !== 'Verified' && (
                            <button
                              onClick={() => setVerifyingDoc(doc)}
                              title="Verify Compliance"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {!doc.isPerpetual && (
                            <button
                              onClick={() => setRenewingDoc(doc)}
                              title="Renew Document"
                              className="p-1.5 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg transition-colors"
                            >
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingDoc(doc);
                              setShowAddModal(true);
                            }}
                            title="Edit"
                            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(doc.id)}
                            title="Delete"
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Cards Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => {
            const days = doc.isPerpetual ? null : getDaysDiff(doc.expiryDate);
            const isExp = days !== null && days < 0;
            const isExpSoon = days !== null && days >= 0 && days <= 30;

            return (
              <div
                key={doc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                      {doc.id}
                    </span>
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        doc.verificationStatus === 'Verified'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : doc.verificationStatus === 'Rejected'
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {doc.verificationStatus}
                    </span>
                  </div>

                  <h3
                    onClick={() => setViewingDoc(doc)}
                    className="font-bold text-slate-900 dark:text-white text-sm hover:text-blue-600 cursor-pointer line-clamp-1"
                  >
                    {doc.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">{doc.category}</p>

                  <div className="mt-3.5 space-y-2 text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Authority:</span>
                      <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[140px]">
                        {doc.issuer || 'N/A'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Doc #:</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">
                        {doc.docNumber || '—'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                      <span>Expires:</span>
                      {doc.isPerpetual ? (
                        <span className="text-emerald-600 font-semibold">Perpetual</span>
                      ) : (
                        <span
                          className={`font-semibold ${
                            isExp ? 'text-rose-600' : isExpSoon ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'
                          }`}
                        >
                          {formatDate(doc.expiryDate)} ({isExp ? `Expired ${Math.abs(days)}d ago` : `${days}d left`})
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Custodian: <strong>{doc.custodian}</strong>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    {!doc.isPerpetual && (
                      <button
                        onClick={() => setRenewingDoc(doc)}
                        className="px-2 py-1 text-[11px] font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg"
                      >
                        Renew
                      </button>
                    )}
                    {doc.verificationStatus !== 'Verified' && (
                      <button
                        onClick={() => setVerifyingDoc(doc)}
                        className="px-2 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg"
                      >
                        Verify
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <AddDocumentModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setEditingDoc(null);
        }}
        initialDoc={editingDoc}
        onSuccess={loadDocs}
      />
      {verifyingDoc && (
        <VerifyDocModal
          isOpen={true}
          onClose={() => setVerifyingDoc(null)}
          doc={verifyingDoc}
          onSuccess={loadDocs}
        />
      )}
      {renewingDoc && (
        <RenewModal
          isOpen={true}
          onClose={() => setRenewingDoc(null)}
          type="Document"
          item={renewingDoc}
          onSuccess={loadDocs}
        />
      )}
      {viewingDoc && (
        <DocumentViewModal
          isOpen={true}
          onClose={() => setViewingDoc(null)}
          doc={viewingDoc}
          onVerify={(d) => setVerifyingDoc(d)}
          onRenew={(d) => setRenewingDoc(d)}
          onEdit={(d) => {
            setEditingDoc(d);
            setShowAddModal(true);
          }}
          onDelete={(id) => handleDelete(id)}
        />
      )}
    </div>
  );
}
