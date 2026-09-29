import React, { useState, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Award,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  Clock,
  ShieldCheck,
  Building2,
  Save,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { DEFAULT_PURCHASE_VENDORS } from '../../services/otdStorageService';
import { getPurchaseData, setPurchaseData, PURCHASE_STORAGE_KEYS } from '../../services/purchaseStorageService';

export function ComparativeMatrixModal({
  isOpen,
  onClose,
  indent,
  masterVendors = DEFAULT_PURCHASE_VENDORS,
  onApplyWinningQuote
}) {
  if (!isOpen || !indent) return null;

  const itemQty = Number(indent.quantity || indent.requiredQuantity || 100);
  const materialName = indent.materialName || indent.itemDescription || indent.productService || 'Raw Material / Supplies';

  // Existing saved comparative matrix or initial 3-vendor template
  const initialVendors = useMemo(() => {
    if (indent.stageDetails?.['Comparative Matrix']?.payload?.vendors) {
      return indent.stageDetails['Comparative Matrix'].payload.vendors;
    }

    const v1 = masterVendors[0]?.name || 'Tata Steel Ltd';
    const v2 = masterVendors[1]?.name || 'Havells Industrial Cables';
    const v3 = masterVendors[2]?.name || 'SKF Bearings India';

    const baseEstRate = Number(indent.estimatedRate || 1200);

    return [
      {
        id: 'v1',
        vendorName: v1,
        quoteRef: `QT-${v1.substring(0, 3).toUpperCase()}-881`,
        quotedRate: Math.round(baseEstRate * 0.95), // L1 candidate
        discountPercent: 5,
        taxPercent: 18,
        freightCharges: 2500,
        deliveryDays: 10,
        paymentTerms: '30 Days Net Credit',
        complianceStatus: 'Fully Compliant',
        remarks: 'Original manufacturer with test certificates'
      },
      {
        id: 'v2',
        vendorName: v2,
        quoteRef: `QT-${v2.substring(0, 3).toUpperCase()}-902`,
        quotedRate: Math.round(baseEstRate * 1.02),
        discountPercent: 2,
        taxPercent: 18,
        freightCharges: 1500,
        deliveryDays: 5,
        paymentTerms: '50% Advance, 50% Delivery',
        complianceStatus: 'Fully Compliant',
        remarks: 'Faster delivery from regional Bhiwadi godown'
      },
      {
        id: 'v3',
        vendorName: v3,
        quoteRef: `QT-${v3.substring(0, 3).toUpperCase()}-419`,
        quotedRate: Math.round(baseEstRate * 1.08),
        discountPercent: 0,
        taxPercent: 18,
        freightCharges: 4000,
        deliveryDays: 14,
        paymentTerms: '100% Advance with PO',
        complianceStatus: 'Minor Deviation',
        remarks: 'Higher freight from Pune manufacturing unit'
      }
    ];
  }, [indent, masterVendors]);

  const [vendorList, setVendorList] = useState(initialVendors);
  const [selectedWinnerId, setSelectedWinnerId] = useState(null);
  const [deviationReason, setDeviationReason] = useState('');

  // Calculate landed costs for each vendor
  const computedQuotes = useMemo(() => {
    const list = vendorList.map((v) => {
      const basicAmount = v.quotedRate * itemQty;
      const discountAmount = (basicAmount * (Number(v.discountPercent) || 0)) / 100;
      const netTaxable = basicAmount - discountAmount;
      const taxAmount = (netTaxable * (Number(v.taxPercent) || 18)) / 100;
      const freight = Number(v.freightCharges) || 0;
      const totalLandedCost = Math.round(netTaxable + taxAmount + freight);
      const landedRatePerUnit = Number((totalLandedCost / itemQty).toFixed(2));

      return {
        ...v,
        basicAmount,
        discountAmount,
        netTaxable,
        taxAmount,
        freight,
        totalLandedCost,
        landedRatePerUnit
      };
    });

    // Rank by Total Landed Cost (Lowest is L1)
    const sorted = [...list].sort((a, b) => a.totalLandedCost - b.totalLandedCost);
    const ranks = {};
    sorted.forEach((item, index) => {
      ranks[item.id] = `L${index + 1}`;
    });

    return list.map((item) => ({
      ...item,
      rank: ranks[item.id],
      isL1: ranks[item.id] === 'L1',
      costDiffFromL1: item.totalLandedCost - sorted[0].totalLandedCost
    }));
  }, [vendorList, itemQty]);

  // Set default winner to L1 if not chosen
  const l1Quote = computedQuotes.find((q) => q.isL1);
  const activeWinner = computedQuotes.find((q) => q.id === (selectedWinnerId || l1Quote?.id)) || l1Quote;

  const handleUpdateField = (index, field, value) => {
    const next = [...vendorList];
    next[index] = { ...next[index], [field]: value };
    setVendorList(next);
  };

  const handleApply = () => {
    if (!activeWinner) return;

    if (!activeWinner.isL1 && !deviationReason.trim()) {
      alert('You have selected a non-L1 bidder. Please provide a mandatory deviation justification reason for audit compliance.');
      return;
    }

    // Save Comparative Matrix into Indent record
    const allIndents = getPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, []);
    const idx = allIndents.findIndex((i) => i.id === indent.id || i.indentNumber === indent.indentNumber);
    if (idx >= 0) {
      const stageDetails = allIndents[idx].stageDetails || {};
      stageDetails['Comparative Matrix'] = {
        completedAt: new Date().toISOString(),
        completedBy: 'Procurement Officer',
        winningVendor: activeWinner.vendorName,
        winningRank: activeWinner.rank,
        winningLandedCost: activeWinner.totalLandedCost,
        justification: activeWinner.isL1 ? 'Lowest evaluated commercial bidder (L1)' : deviationReason,
        payload: {
          vendors: vendorList,
          quotes: computedQuotes,
          winningQuote: activeWinner
        }
      };

      allIndents[idx].stageDetails = stageDetails;
      setPurchaseData(PURCHASE_STORAGE_KEYS.INDENTS, allIndents);
    }

    // Callback to parent with winning quotation details
    onApplyWinningQuote?.(activeWinner, activeWinner.isL1 ? '' : deviationReason);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-5xl max-h-[94vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-600/20 font-black">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                  Comparative Quotation Matrix (L1 / L2 / L3)
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-extrabold text-[10px]">
                  Purchase Indent: {indent.indentNumber}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Side-by-side commercial evaluation of 3 vendor quotes for <strong>{materialName}</strong> ({itemQty} {indent.unit || 'Units'})
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs">
          {/* L1 Highlight Banner */}
          {l1Quote && (
            <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/20 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-sm shrink-0">
                  L1
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-emerald-900 dark:text-emerald-200 text-sm">
                      Recommended Bidder: {l1Quote.vendorName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-600 text-white font-black text-[10px]">
                      LOWEST BIDDER
                    </span>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5">
                    Total Landed Cost: <strong>₹ {l1Quote.totalLandedCost.toLocaleString('en-IN')}</strong> (₹ {l1Quote.landedRatePerUnit}/unit) • Delivery: {l1Quote.deliveryDays} Days
                  </p>
                </div>
              </div>

              {computedQuotes[1] && (
                <div className="text-right shrink-0">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block">Cost Advantage vs L2:</span>
                  <span className="text-sm font-black text-emerald-700 dark:text-emerald-400">
                    - ₹ {(computedQuotes[1].totalLandedCost - l1Quote.totalLandedCost).toLocaleString('en-IN')} Saved
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 3-Column Side-by-Side Comparison Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {computedQuotes.map((q, idx) => {
              const isSelected = activeWinner?.id === q.id;

              return (
                <div
                  key={q.id}
                  onClick={() => setSelectedWinnerId(q.id)}
                  className={`rounded-2xl border transition-all p-4 space-y-4 cursor-pointer relative ${
                    isSelected
                      ? 'bg-white dark:bg-slate-900 border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                      : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/80 hover:border-slate-300'
                  }`}
                >
                  {/* Top Rank Badge */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs ${
                          q.rank === 'L1'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : q.rank === 'L2'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-500 text-white'
                        }`}
                      >
                        {q.rank}
                      </span>
                      <span className="font-extrabold text-slate-800 dark:text-slate-200 text-xs">
                        Vendor {idx + 1}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <input
                        type="radio"
                        name="winner-selection"
                        checked={isSelected}
                        onChange={() => setSelectedWinnerId(q.id)}
                        className="w-4 h-4 text-indigo-600 cursor-pointer"
                      />
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Select for PO
                      </span>
                    </div>
                  </div>

                  {/* Vendor Name & Quote Reference */}
                  <div className="space-y-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Vendor Name
                      </label>
                      <select
                        value={q.vendorName}
                        onChange={(e) => handleUpdateField(idx, 'vendorName', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none"
                      >
                        {masterVendors.map((mv) => (
                          <option key={mv.name} value={mv.name}>
                            {mv.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                        Quotation Ref #
                      </label>
                      <input
                        type="text"
                        value={q.quoteRef}
                        onChange={(e) => handleUpdateField(idx, 'quoteRef', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Commercial Breakdown */}
                  <div className="bg-white dark:bg-slate-900/80 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Basic Quoted Rate:</span>
                      <div className="flex items-center gap-1">
                        <span className="text-slate-400">₹</span>
                        <input
                          type="number"
                          value={q.quotedRate}
                          onChange={(e) => handleUpdateField(idx, 'quotedRate', Number(e.target.value))}
                          className="w-20 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-right font-bold text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Discount %:</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={q.discountPercent}
                          onChange={(e) => handleUpdateField(idx, 'discountPercent', Number(e.target.value))}
                          className="w-14 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center text-xs"
                        />
                        <span className="text-slate-400">%</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Freight / P&F (₹):</span>
                      <input
                        type="number"
                        value={q.freightCharges}
                        onChange={(e) => handleUpdateField(idx, 'freightCharges', Number(e.target.value))}
                        className="w-20 px-1.5 py-0.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-right text-xs"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">GST (Taxes 18%):</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        ₹ {Math.round(q.taxAmount).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between font-black text-xs text-slate-900 dark:text-white">
                      <span>Total Landed Cost:</span>
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm">
                        ₹ {q.totalLandedCost.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>Landed Rate / Unit:</span>
                      <span>₹ {q.landedRatePerUnit}</span>
                    </div>
                  </div>

                  {/* Delivery & Terms */}
                  <div className="space-y-2 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>Lead Time:</span>
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          value={q.deliveryDays}
                          onChange={(e) => handleUpdateField(idx, 'deliveryDays', Number(e.target.value))}
                          className="w-12 px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded text-center text-xs font-bold"
                        />
                        <span className="text-slate-500">Days</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold uppercase text-slate-400 mb-0.5">
                        Payment Terms
                      </label>
                      <input
                        type="text"
                        value={q.paymentTerms}
                        onChange={(e) => handleUpdateField(idx, 'paymentTerms', e.target.value)}
                        className="w-full px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] text-slate-700 dark:text-slate-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Variance vs L1 */}
                  <div className="pt-2 text-center text-[10px]">
                    {q.isL1 ? (
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Cheapest Landed Offer</span>
                      </span>
                    ) : (
                      <span className="text-rose-500 font-bold">
                        + ₹ {q.costDiffFromL1.toLocaleString('en-IN')} (+{((q.costDiffFromL1 / l1Quote.totalLandedCost) * 100).toFixed(1)}% vs L1)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Deviation Justification (Visible only if non-L1 selected) */}
          {activeWinner && !activeWinner.isL1 && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-2xl space-y-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                  Non-L1 Selection Audit Justification Required
                </h4>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300">
                You are recommending <strong>{activeWinner.vendorName} ({activeWinner.rank})</strong> over the lowest evaluated bidder <strong>{l1Quote?.vendorName} (L1)</strong>. Please state the technical / delivery justification for management audit:
              </p>
              <textarea
                rows={2}
                required
                placeholder="e.g. Critical project deadline requires 5-day delivery from Vendor 2, whereas L1 requires 21 days lead time which would stall plant assembly..."
                value={deviationReason}
                onChange={(e) => setDeviationReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 shrink-0">
          <div className="text-xs text-slate-500">
            Selected for PO: <strong className="text-slate-900 dark:text-white">{activeWinner?.vendorName}</strong> ({activeWinner?.rank}) • ₹ {activeWinner?.totalLandedCost.toLocaleString('en-IN')}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-bold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-amber-600/30 transition-all cursor-pointer transform active:scale-95"
            >
              <Award className="w-4 h-4" />
              <span>Apply Winning Quote to PO</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
