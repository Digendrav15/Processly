import React, { useState, useEffect } from 'react';
import {
  Building2,
  Save,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Globe,
  FileText,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CreditCard,
  Building
} from 'lucide-react';
import { useOTDStorage } from '../../hooks/useOTDStorage';
import {
  STORAGE_KEYS,
  DEFAULT_COMPANY_DETAILS,
  setData,
  logAuditAction
} from '../../services/otdStorageService';

export function MasterCompanyDetailsPage() {
  const storedCompany = useOTDStorage(STORAGE_KEYS.COMPANY_DETAILS, DEFAULT_COMPANY_DETAILS);
  const [form, setForm] = useState(DEFAULT_COMPANY_DETAILS);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state with stored company details
  useEffect(() => {
    if (storedCompany && typeof storedCompany === 'object' && Object.keys(storedCompany).length > 0) {
      setForm({
        ...DEFAULT_COMPANY_DETAILS,
        ...storedCompany
      });
    }
  }, [storedCompany]);

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }));
    setSavedSuccess(false);
  };

  const handleSave = (e) => {
    e.preventDefault();
    setData(STORAGE_KEYS.COMPANY_DETAILS, form);
    logAuditAction('Company Details Updated', 'Company Master', 'PROFILE', form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 4000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Reset company details to standard system defaults?')) {
      setForm(DEFAULT_COMPANY_DETAILS);
      setData(STORAGE_KEYS.COMPANY_DETAILS, DEFAULT_COMPANY_DETAILS);
      logAuditAction('Company Details Reset to Default', 'Company Master', 'PROFILE', DEFAULT_COMPANY_DETAILS);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-blue-950 via-slate-900 to-slate-900 p-6 rounded-3xl text-white shadow-xl border border-blue-500/20">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-400 font-extrabold text-xs uppercase tracking-wider border border-blue-500/30">
              Master System
            </span>
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs uppercase tracking-wider border border-emerald-500/30">
              PO Linked Master
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-2 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-blue-400" />
            Our Company Details
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Configure your official company profile. These details (Company Name, GST No., Address, Email ID, Contact Number) automatically populate onto all Purchase Orders (PO) and outgoing documents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all border border-slate-700 cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-slate-400" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center space-x-3 text-emerald-600 dark:text-emerald-400 text-sm font-bold animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>Our Company Details successfully saved! Purchase Orders (PO) will immediately reflect these updated details.</span>
        </div>
      )}

      {/* Main Grid: Form & Live PO Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              Company Master Registration Form
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Updates to these fields will dynamically populate on your Purchase Orders in real-time.
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-5">
            {/* 1. Basic Company Identification */}
            <div className="space-y-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-4 h-4 text-blue-500" />
                1. Legal Identity & Trade Name
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Company Legal Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.companyName || ''}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    placeholder="e.g. Acme Corporate Enterprise Ltd"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Brand / Display Name (Header Logo)
                  </label>
                  <input
                    type="text"
                    value={form.brandName || ''}
                    onChange={(e) => handleChange('brandName', e.target.value)}
                    placeholder="e.g. GimBooks / Multi Systems App"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    GST No. (GSTIN) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.gstin || ''}
                    onChange={(e) => handleChange('gstin', e.target.value.toUpperCase())}
                    placeholder="e.g. 06AAACG1234F1Z8"
                    className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    PAN Number
                  </label>
                  <input
                    type="text"
                    value={form.pan || ''}
                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                    placeholder="e.g. AAACG1234F"
                    className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Official Contact Information */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-500" />
                2. Contact & Communications
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Email ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={form.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="purchase@company.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Contact Number / Phone <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.contactNumber || ''}
                    onChange={(e) => handleChange('contactNumber', e.target.value)}
                    placeholder="+91 (0124) 450-8900"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={form.website || ''}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="www.gimbooks.com"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Fax (Optional)
                  </label>
                  <input
                    type="text"
                    value={form.fax || ''}
                    onChange={(e) => handleChange('fax', e.target.value)}
                    placeholder="(0124) 450-8999"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 3. Address Details */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-rose-500" />
                3. Registered Office & Plant Address
              </h3>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Street Address / Plot / Industrial Area <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.address || ''}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="e.g. Plot No. 42, Udyog Vihar Phase IV"
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    City <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                    placeholder="Gurugram"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    State <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.state || ''}
                    onChange={(e) => handleChange('state', e.target.value)}
                    placeholder="Haryana"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Pincode <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={form.pincode || ''}
                    onChange={(e) => handleChange('pincode', e.target.value)}
                    placeholder="122015"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* 4. Bank Account Details (Commercial) */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-amber-500" />
                4. Primary Bank Account (For Commercial Transactions)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Bank Name
                  </label>
                  <input
                    type="text"
                    value={form.bankName || ''}
                    onChange={(e) => handleChange('bankName', e.target.value)}
                    placeholder="HDFC Bank Ltd"
                    className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={form.accountNumber || ''}
                    onChange={(e) => handleChange('accountNumber', e.target.value)}
                    placeholder="50200012345678"
                    className="w-full p-2.5 font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    IFSC Code
                  </label>
                  <input
                    type="text"
                    value={form.ifsc || ''}
                    onChange={(e) => handleChange('ifsc', e.target.value.toUpperCase())}
                    placeholder="HDFC0000123"
                    className="w-full p-2.5 font-mono uppercase bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl flex items-center space-x-2 cursor-pointer shadow-lg shadow-blue-600/30 transition-all transform active:scale-95"
              >
                <Save className="w-4 h-4" />
                <span>Save Company Details</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live PO Header Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h2 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Live PO Header Preview
              </h2>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
                Synchronized
              </span>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              The card below demonstrates exactly how your company details will look at the top-left of the Purchase Order (PO) document:
            </p>

            {/* Miniature PO Header Replica */}
            <div className="p-5 border-2 border-emerald-600 rounded-xl bg-white text-slate-900 shadow-md space-y-2">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-amber-400 flex items-center justify-center text-white font-black text-lg border border-amber-500 shadow-xs">
                  📄
                </div>
                <div>
                  <span className="text-[11px] font-bold text-slate-400 block leading-none">
                    {form.brandName || form.companyName || 'Brand'}
                  </span>
                  <h3 className="text-xl font-black text-emerald-600 leading-tight">
                    {form.brandName || form.companyName || 'Company Name'}
                  </h3>
                </div>
              </div>

              <div className="text-[11px] text-slate-700 leading-relaxed pt-1 space-y-0.5 border-t border-slate-100">
                <p className="font-semibold text-slate-900">{form.companyName}</p>
                <p><span className="text-slate-500 font-medium">[Street Address]</span> {form.address || 'Plot Address'}</p>
                <p><span className="text-slate-500 font-medium">[City, ST ZIP]</span> {form.city || 'City'}, {form.state || 'State'} {form.pincode || 'Pincode'}</p>
                <p><span className="text-slate-500 font-medium">GSTIN:</span> <span className="font-mono font-bold text-emerald-700">{form.gstin || 'GST Number'}</span></p>
                <p><span className="text-slate-500 font-medium">Email:</span> {form.email || 'purchase@company.com'}</p>
                <p><span className="text-slate-500 font-medium">Phone:</span> {form.contactNumber || '+91 00000 00000'}</p>
                {form.website && <p><span className="text-slate-500 font-medium">Website:</span> {form.website}</p>}
                {form.fax && <p><span className="text-slate-500 font-medium">Fax:</span> {form.fax}</p>}
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Automatic System Propagation:
              </h4>
              <ul className="space-y-1 text-slate-500 dark:text-slate-400 text-[11px] list-disc list-inside">
                <li><span className="font-semibold text-slate-700 dark:text-slate-300">Purchase Orders (`/purchase/po`):</span> PO header branding, address, phone, GST No., email.</li>
                <li><span className="font-semibold text-slate-700 dark:text-slate-300">Print Output:</span> PDF invoices and printed PO copies match this exact corporate profile.</li>
                <li><span className="font-semibold text-slate-700 dark:text-slate-300">Audit Trail:</span> Changes to profile are timestamped and recorded in system audit logs.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
