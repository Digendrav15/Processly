import React, { useState } from 'react';
import {
  X,
  Award,
  Star,
  Clock,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  PackageCheck,
  CheckCircle2,
  Building2,
  Calendar,
  Save,
  Sparkles
} from 'lucide-react';
import { STORAGE_KEYS, setData, logAuditAction } from '../../services/otdStorageService';

export function VendorScorecardModal({ isOpen, onClose, vendor, allVendors = [], onUpdateVendor }) {
  if (!isOpen || !vendor) return null;

  // Initial defaults if not already present on vendor
  const [rating, setRating] = useState(vendor.rating || 4.7);
  const [deliveryScore, setDeliveryScore] = useState(vendor.deliveryScore || 95);
  const [qualityRejectionRate, setQualityRejectionRate] = useState(vendor.qualityRejectionRate || 1.2);
  const [priceCompetitiveness, setPriceCompetitiveness] = useState(vendor.priceCompetitiveness || 4.5);
  const [vendorGrade, setVendorGrade] = useState(vendor.vendorGrade || 'Grade A+');
  const [notes, setNotes] = useState(vendor.scorecardNotes || 'Consistent supplier with excellent metallurgical test certificates and on-time dispatch.');

  // Simulated cycle audit history
  const cycleHistory = vendor.cycleHistory || [
    {
      cycle: 'Cycle #14 (Sep 2026)',
      poNumber: 'PO-2026-0201',
      material: 'IS 2062 Grade E250 Steel',
      deliveryDays: '8 Days (On-Time)',
      qcStatus: '99.2% Accepted (0.8% Scrap)',
      rating: 4.8,
      status: 'Passed'
    },
    {
      cycle: 'Cycle #13 (Aug 2026)',
      poNumber: 'PO-2026-0188',
      material: 'Galvanized Angle Sections',
      deliveryDays: '10 Days (On-Time)',
      qcStatus: '100% Accepted',
      rating: 5.0,
      status: 'Passed'
    },
    {
      cycle: 'Cycle #12 (Jul 2026)',
      poNumber: 'PO-2026-0154',
      material: 'Structural Flanges',
      deliveryDays: '14 Days (2d Delay)',
      qcStatus: '96.5% Accepted (3.5% Minor Burr)',
      rating: 4.2,
      status: 'Minor Deviation'
    }
  ];

  const handleSaveScorecard = (e) => {
    e.preventDefault();

    const updatedVendor = {
      ...vendor,
      rating: Number(rating),
      deliveryScore: Number(deliveryScore),
      qualityRejectionRate: Number(qualityRejectionRate),
      priceCompetitiveness: Number(priceCompetitiveness),
      vendorGrade,
      scorecardNotes: notes,
      lastEvaluatedAt: new Date().toISOString()
    };

    const updatedList = allVendors.map((v) => (v.id === vendor.id ? updatedVendor : v));
    setData(STORAGE_KEYS.PURCHASE_VENDORS, updatedList);
    logAuditAction('Vendor Scorecard Evaluated', 'Vendor Master', vendor.id, updatedVendor);

    onUpdateVendor?.(updatedVendor);
    alert(`Scorecard for ${vendor.name} successfully updated! Grade: ${vendorGrade}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-3xl overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 font-black">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Vendor Rating & Performance Scorecard
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-extrabold text-[10px]">
                  {vendorGrade}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {vendor.name} ({vendor.code || 'VND'}) • GSTIN: {vendor.gstin || '—'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveScorecard} className="p-6 space-y-6 text-xs max-h-[80vh] overflow-y-auto">
          {/* Top 3 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Delivery Score */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>On-Time Delivery</span>
                </span>
                <span>Target &gt; 90%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={deliveryScore}
                  onChange={(e) => setDeliveryScore(e.target.value)}
                  className="w-16 font-black text-xl text-slate-900 dark:text-white bg-transparent border-b border-indigo-400 focus:outline-none"
                />
                <span className="font-bold text-slate-500">%</span>
              </div>
              <p className="text-[10px] text-emerald-600 font-semibold">Consistently adheres to PO dispatch TAT</p>
            </div>

            {/* Quality Rejection Rate */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>QC Rejection Rate</span>
                </span>
                <span>Target &lt; 2%</span>
              </div>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={qualityRejectionRate}
                  onChange={(e) => setQualityRejectionRate(e.target.value)}
                  className="w-16 font-black text-xl text-slate-900 dark:text-white bg-transparent border-b border-emerald-400 focus:outline-none"
                />
                <span className="font-bold text-slate-500">%</span>
              </div>
              <p className="text-[10px] text-slate-500">Passed QC on inward receiving dock</p>
            </div>

            {/* Price Competitiveness */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-400 font-bold text-[10px] uppercase">
                <span className="flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-amber-500" />
                  <span>Price Competitiveness</span>
                </span>
                <span>Max 5.0</span>
              </div>
              <div className="flex items-baseline gap-2">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={priceCompetitiveness}
                  onChange={(e) => setPriceCompetitiveness(e.target.value)}
                  className="w-16 font-black text-xl text-slate-900 dark:text-white bg-transparent border-b border-amber-400 focus:outline-none"
                />
                <span className="font-bold text-slate-500">/ 5.0</span>
              </div>
              <p className="text-[10px] text-amber-600 font-semibold">Frequently emerges as L1/L2 in quotes</p>
            </div>
          </div>

          {/* Rating & Grade Customizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/20 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Composite Star Rating (1.0 to 5.0)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="0.1"
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="font-black text-base text-amber-600 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                  {rating}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
                Vendor Audit Grade
              </label>
              <select
                value={vendorGrade}
                onChange={(e) => setVendorGrade(e.target.value)}
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
              >
                <option value="Grade A+">Grade A+ (Strategic Preferred Partner)</option>
                <option value="Grade A">Grade A (Approved High Quality Supplier)</option>
                <option value="Grade B">Grade B (Satisfactory / Standard Vendor)</option>
                <option value="Grade C">Grade C (Under Watch / Probation)</option>
                <option value="Blacklisted">Blacklisted / Suspended</option>
              </select>
            </div>
          </div>

          {/* Past Purchase Cycles Table */}
          <div className="space-y-2">
            <h4 className="font-extrabold text-xs text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>Historical Procurement Cycles Performance</span>
            </h4>

            <div className="overflow-x-auto border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-2">Cycle</th>
                    <th className="p-2">PO #</th>
                    <th className="p-2">Material / Supplies</th>
                    <th className="p-2">Delivery Timeliness</th>
                    <th className="p-2">Quality & QC Result</th>
                    <th className="p-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {cycleHistory.map((c, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2 font-bold text-slate-900 dark:text-white">{c.cycle}</td>
                      <td className="p-2 font-mono text-indigo-600 dark:text-indigo-400 font-bold">{c.poNumber}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-300">{c.material}</td>
                      <td className="p-2 font-medium text-emerald-600">{c.deliveryDays}</td>
                      <td className="p-2 text-slate-600 dark:text-slate-400">{c.qcStatus}</td>
                      <td className="p-2 text-right font-black text-amber-600">★ {c.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Evaluation Remarks */}
          <div>
            <label className="block text-[11px] font-bold uppercase text-slate-600 dark:text-slate-300 mb-1">
              Procurement Audit Feedback & Special Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/30 transition-all cursor-pointer transform active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Vendor Scorecard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
