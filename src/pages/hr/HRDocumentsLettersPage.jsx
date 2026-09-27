import React, { useState, useMemo, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Archive,
  Award,
  Search,
  Filter,
  Plus,
  Eye,
  Printer,
  Download,
  FileText,
  Calendar,
  Building,
  User,
  CheckCircle2,
  X,
  ArrowRight,
  ShieldCheck,
  Clock,
  Sparkles
} from 'lucide-react';
import { useHRStorage } from '../../hooks/useHRStorage';
import {
  HR_KEYS,
  generateLetterId,
  addActivityLog
} from '../../services/hrStorageService';

export function HRDocumentsLettersPage() {
  const location = useLocation();

  const getInitialTab = () => {
    if (location.pathname.includes('letters')) return 'letters';
    return 'documents';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    setActiveTab(getInitialTab());
  }, [location.pathname]);

  const { data: documents, setItem: setDocuments } = useHRStorage(HR_KEYS.DOCUMENTS, []);
  const { data: letters, setItem: setLetters } = useHRStorage(HR_KEYS.LETTERS, []);
  const { data: employees } = useHRStorage(HR_KEYS.EMPLOYEES, []);

  // Filter & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [docTypeFilter, setDocTypeFilter] = useState('All');
  const [letterTypeFilter, setLetterTypeFilter] = useState('All');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showIssueLetterModal, setShowIssueLetterModal] = useState(false);
  const [showLetterPreviewModal, setShowLetterPreviewModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);

  // Upload Form
  const [uploadData, setUploadData] = useState({
    employeeId: '',
    employeeName: '',
    documentName: 'Aadhaar Card Copy',
    documentType: 'KYC & ID Proof',
    fileSize: '1.2 MB'
  });

  // Issue Letter Form
  const [letterFormData, setLetterFormData] = useState({
    employeeId: '',
    recipientName: '',
    letterType: 'Appointment Letter',
    designation: '',
    department: 'Technology',
    effectiveDate: new Date().toISOString().split('T')[0],
    ctc: '₹ 12,00,000'
  });

  // Handle employee select for letter
  const handleSelectEmpForLetter = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setLetterFormData(prev => ({
        ...prev,
        employeeId: emp.employeeId,
        recipientName: emp.name,
        designation: emp.designation,
        department: emp.department,
        ctc: `₹ ${Number(emp.salary || 600000).toLocaleString('en-IN')}`
      }));
    }
  };

  // Handle employee select for upload
  const handleSelectEmpForUpload = (empId) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (emp) {
      setUploadData(prev => ({
        ...prev,
        employeeId: emp.employeeId,
        employeeName: emp.name
      }));
    }
  };

  // Submit Upload Document
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadData.employeeName.trim()) {
      alert('Please select an employee');
      return;
    }

    const newDoc = {
      id: `DOC-${Date.now()}`,
      employeeId: uploadData.employeeId,
      employeeName: uploadData.employeeName,
      documentName: uploadData.documentName,
      documentType: uploadData.documentType,
      uploadDate: new Date().toISOString().split('T')[0],
      fileSize: uploadData.fileSize || '1.5 MB',
      status: 'Verified'
    };

    setDocuments([newDoc, ...documents]);
    addActivityLog('HR Compliance', 'Document Stored', 'Compliance', uploadData.employeeId, null, 'Verified', `Uploaded ${newDoc.documentName}`);
    setShowUploadModal(false);
  };

  // Submit Issue Letter
  const handleIssueLetterSubmit = (e) => {
    e.preventDefault();
    if (!letterFormData.recipientName.trim()) {
      alert('Please select an employee');
      return;
    }

    const newLetterId = generateLetterId();
    const newLetter = {
      id: newLetterId,
      letterType: letterFormData.letterType,
      title: `${letterFormData.letterType} - ${letterFormData.recipientName}`,
      candidateOrEmployeeId: letterFormData.employeeId,
      recipientName: letterFormData.recipientName,
      designation: letterFormData.designation,
      department: letterFormData.department,
      effectiveDate: letterFormData.effectiveDate,
      ctc: letterFormData.ctc,
      issuedBy: 'HR Operations',
      createdAt: new Date().toISOString()
    };

    setLetters([newLetter, ...letters]);
    addActivityLog('HR Operations', 'Issued HR Letter', 'Documents', newLetterId, null, 'Issued', `${newLetter.letterType} for ${newLetter.recipientName}`);

    setShowIssueLetterModal(false);
    setSelectedLetter(newLetter);
    setShowLetterPreviewModal(true);
  };

  // Filtered Documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(d => {
      const matchesSearch =
        d.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.documentName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = docTypeFilter === 'All' || d.documentType === docTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [documents, searchTerm, docTypeFilter]);

  // Filtered Letters
  const filteredLetters = useMemo(() => {
    return letters.filter(l => {
      const matchesSearch =
        l.recipientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.candidateOrEmployeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.title?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesType = letterTypeFilter === 'All' || l.letterType === letterTypeFilter;
      return matchesSearch && matchesType;
    });
  }, [letters, searchTerm, letterTypeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
              {activeTab === 'documents' ? <Archive className="w-5 h-5" /> : <Award className="w-5 h-5" />}
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                {activeTab === 'documents' ? 'Employee Document Repository' : 'HR Letters & Template Generator'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Stage 15: Centralized employee digital vault, KYC compliance, official letters & certification
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'documents' ? (
            <button
              onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Upload Document</span>
            </button>
          ) : (
            <button
              onClick={() => setShowIssueLetterModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>+ Generate Official Letter</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <Link
          to="/hr/documents"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'documents'
              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Archive className="w-4 h-4" />
          <span>Employee Documents ({documents.length})</span>
        </Link>

        <Link
          to="/hr/letters"
          onClick={() => setActiveTab('letters')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
            activeTab === 'letters'
              ? 'bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>HR Letters Registry ({letters.length})</span>
        </Link>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={activeTab === 'documents' ? "Search document, employee name or ID..." : "Search letter title, recipient or ID..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-800 dark:text-white"
          />
        </div>

        {activeTab === 'documents' ? (
          <select
            value={docTypeFilter}
            onChange={(e) => setDocTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Document Categories</option>
            <option value="KYC & ID Proof">KYC & ID Proof</option>
            <option value="Educational Certificates">Educational Certificates</option>
            <option value="Relieving & Experience">Relieving & Experience</option>
            <option value="Offer & Contract">Offer & Contract</option>
            <option value="Bank Details">Bank Details</option>
          </select>
        ) : (
          <select
            value={letterTypeFilter}
            onChange={(e) => setLetterTypeFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="All">All Letter Types</option>
            <option value="Offer Letter">Offer Letter</option>
            <option value="Appointment Letter">Appointment Letter</option>
            <option value="Promotion Letter">Promotion Letter</option>
            <option value="Relieving Letter">Relieving Letter</option>
            <option value="Experience Letter">Experience Letter</option>
          </select>
        )}
      </div>

      {/* TAB 1: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Digital Document Vault
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              {filteredDocuments.length} files
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Document Name</th>
                  <th className="py-3 px-4">Employee</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Upload Date</th>
                  <th className="py-3 px-4">File Size</th>
                  <th className="py-3 px-4">Compliance Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredDocuments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Archive className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No documents found matching filters</p>
                    </td>
                  </tr>
                ) : (
                  filteredDocuments.map((doc) => (
                    <tr
                      key={doc.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4 text-cyan-500 shrink-0" />
                        <span>{doc.documentName}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {doc.employeeName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {doc.employeeId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {doc.documentType}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {doc.uploadDate}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500">
                        {doc.fileSize}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{doc.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => alert(`Opening ${doc.documentName} for ${doc.employeeName}`)}
                          className="p-1.5 text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: HR LETTERS */}
      {activeTab === 'letters' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-slate-900 dark:text-white">
              Official Corporate Letters Issued
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-400">
              {filteredLetters.length} letters
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3 px-4">Letter ID</th>
                  <th className="py-3 px-4">Letter Type / Title</th>
                  <th className="py-3 px-4">Recipient Details</th>
                  <th className="py-3 px-4">Designation & Dept</th>
                  <th className="py-3 px-4">Issued Date</th>
                  <th className="py-3 px-4">Issued By</th>
                  <th className="py-3 px-4 text-right">View / Print</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredLetters.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                      <p className="font-semibold">No letters found</p>
                    </td>
                  </tr>
                ) : (
                  filteredLetters.map((ltr) => (
                    <tr
                      key={ltr.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                        {ltr.id}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {ltr.letterType}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {ltr.recipientName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {ltr.candidateOrEmployeeId}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {ltr.designation} ({ltr.department})
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {ltr.createdAt?.split('T')[0] || ltr.effectiveDate}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {ltr.issuedBy || 'HR Operations'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedLetter(ltr);
                            setShowLetterPreviewModal(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 rounded-lg text-[11px] font-bold transition-colors cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print / View</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Archive className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Store Employee Document</h3>
                  <p className="text-xs text-slate-400">Add verified KYC / employment file to vault</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Employee *
                </label>
                <select
                  value={uploadData.employeeId}
                  onChange={(e) => handleSelectEmpForUpload(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.name} ({e.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Degree Certificate"
                  value={uploadData.documentName}
                  onChange={(e) => setUploadData({ ...uploadData, documentName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={uploadData.documentType}
                  onChange={(e) => setUploadData({ ...uploadData, documentType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="KYC & ID Proof">KYC & ID Proof</option>
                  <option value="Educational Certificates">Educational Certificates</option>
                  <option value="Relieving & Experience">Relieving & Experience</option>
                  <option value="Offer & Contract">Offer & Contract</option>
                  <option value="Bank Details">Bank Details</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Store Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Official Letter Modal */}
      {showIssueLetterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-white">Issue Official Letter</h3>
                  <p className="text-xs text-slate-400">Generate standardized HR correspondence</p>
                </div>
              </div>
              <button
                onClick={() => setShowIssueLetterModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleIssueLetterSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Recipient Employee *
                </label>
                <select
                  value={letterFormData.employeeId}
                  onChange={(e) => handleSelectEmpForLetter(e.target.value)}
                  required
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                >
                  <option value="">Select Employee</option>
                  {employees.map(e => (
                    <option key={e.employeeId} value={e.employeeId}>
                      {e.name} ({e.employeeId}) - {e.designation}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Letter Template *
                </label>
                <select
                  value={letterFormData.letterType}
                  onChange={(e) => setLetterFormData({ ...letterFormData, letterType: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                >
                  <option value="Appointment Letter">Appointment Letter</option>
                  <option value="Promotion Letter">Promotion & Increment Letter</option>
                  <option value="Relieving Letter">Relieving Letter</option>
                  <option value="Experience Letter">Experience Certificate</option>
                  <option value="Transfer Letter">Internal Department Transfer Letter</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={letterFormData.designation}
                    onChange={(e) => setLetterFormData({ ...letterFormData, designation: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Effective Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={letterFormData.effectiveDate}
                    onChange={(e) => setLetterFormData({ ...letterFormData, effectiveDate: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowIssueLetterModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-bold rounded-xl shadow-md shadow-cyan-500/20"
                >
                  Generate & Preview Letter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Corporate Letter Preview & Print Modal */}
      {showLetterPreviewModal && selectedLetter && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white text-slate-900 rounded-3xl max-w-2xl w-full p-8 shadow-2xl space-y-6 my-8 border border-slate-300">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-cyan-600" />
                <span className="font-black text-sm uppercase text-slate-600">{selectedLetter.letterType}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button onClick={() => setShowLetterPreviewModal(false)} className="text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Letterhead */}
            <div className="flex items-center justify-between pb-4 border-b-2 border-slate-900">
              <div>
                <h2 className="text-xl font-black text-slate-900">TASKFLOW ENTERPRISES PVT. LTD.</h2>
                <p className="text-xs text-slate-500">Corporate Tower, Tech Park Phase 2, Bangalore - 560100</p>
                <p className="text-xs text-slate-500">hr@taskflow.os • CIN: U72200KA2024PTC123456</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-slate-500">Ref: {selectedLetter.id}</p>
                <p className="text-xs text-slate-500 mt-1">Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
            </div>

            {/* Letter Content */}
            <div className="text-xs text-slate-700 space-y-4 leading-relaxed">
              <p>To,</p>
              <div>
                <p className="font-bold text-sm text-slate-900">{selectedLetter.recipientName}</p>
                <p className="text-slate-500">Employee ID: {selectedLetter.candidateOrEmployeeId}</p>
              </div>

              <p className="font-bold text-center text-sm uppercase underline tracking-wider text-slate-900">
                {selectedLetter.letterType.toUpperCase()}
              </p>

              <p>Dear {selectedLetter.recipientName},</p>

              <p>
                We are pleased to issue this official <strong>{selectedLetter.letterType}</strong> on behalf of TaskFlow Enterprises Pvt. Ltd. Effective from <strong>{selectedLetter.effectiveDate}</strong>, you are confirmed in the capacity of <strong>{selectedLetter.designation}</strong> within our <strong>{selectedLetter.department}</strong> division.
              </p>

              {selectedLetter.ctc && (
                <p>
                  Your updated annualized Total Cost to Company (CTC) is structured at <strong>{selectedLetter.ctc}</strong>, inclusive of all statutory components and performance metrics.
                </p>
              )}

              <p>
                We look forward to your continuing dedication and contributions toward organizational excellence. All other employment terms and service conditions remain governed by company policy.
              </p>
            </div>

            {/* Signature */}
            <div className="pt-8 border-t border-slate-200 flex justify-between text-xs">
              <div>
                <p className="font-bold text-slate-900">For TaskFlow Enterprises Pvt. Ltd.</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-700">Authorized Human Resources Officer</p>
                <p className="text-[10px] text-slate-400">Corporate People Operations</p>
              </div>

              <div className="text-right">
                <p className="font-bold text-slate-900">Acknowledged & Accepted By</p>
                <div className="h-10"></div>
                <p className="font-bold text-slate-700">{selectedLetter.recipientName}</p>
                <p className="text-[10px] text-slate-400">Employee Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
