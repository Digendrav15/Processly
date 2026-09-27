import React from 'react';
import { Modal } from '../common/Modal';
import { Landmark, Printer, CheckCircle2, AlertTriangle, ArrowDownLeft, ArrowUpRight } from 'lucide-react';

// Number to Words in Indian Rupees
function numberToWords(num) {
  if (!num || isNaN(num)) return 'Zero';
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
  str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
  str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
  str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
  str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
  return str.trim() + ' Only';
}

export function ChequeLeafModal({ isOpen, onClose, cheque }) {
  if (!cheque) return null;

  const isReceived = cheque.type === 'received';
  const words = numberToWords(cheque.amount);

  // Format date to D D M M Y Y Y Y boxes
  const dateFormatted = cheque.chequeDate ? cheque.chequeDate.split('-') : ['2026', '01', '01'];
  const yyyy = dateFormatted[0];
  const mm = dateFormatted[1];
  const dd = dateFormatted[2];
  const dateDigits = `${dd || '01'}${mm || '01'}${yyyy || '2026'}`.split('');

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cheque Leaf Digital Specimen" maxWidth="max-w-3xl">
      <div className="space-y-4">
        {/* Authentic Indian Bank Cheque Specimen Container */}
        <div className="relative bg-gradient-to-br from-amber-50/70 via-emerald-50/30 to-teal-50/80 dark:from-slate-800 dark:via-slate-850 dark:to-slate-800 border-2 border-teal-800/20 dark:border-teal-400/20 rounded-2xl p-6 shadow-xl font-sans text-slate-800 dark:text-slate-200 overflow-hidden">
          {/* Watermark Pattern */}
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none flex items-center justify-center font-black text-6xl tracking-widest text-slate-900 select-none rotate-12">
            CTS-2010 SECURE CHEQUE SPECIMEN
          </div>

          {/* Account Payee Only crossing stamp */}
          <div className="absolute top-2 left-6 border-y-2 border-slate-700 dark:border-slate-300 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider transform -rotate-15 select-none">
            A/C PAYEE ONLY
          </div>

          {/* Cheque Header: Bank Logo + Date Boxes */}
          <div className="flex items-start justify-between">
            <div className="pl-16">
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-teal-700 dark:text-teal-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-slate-900 dark:text-white uppercase tracking-wider">
                  {cheque.bankName || 'HDFC BANK LTD'}
                </h3>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 pl-7">
                {cheque.branchName || 'CORPORATE BANKING BRANCH'} • RTGS / NEFT / CTS-2010
              </p>
            </div>

            {/* Date Box Display */}
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block text-right mb-1">
                D D M M Y Y Y Y
              </span>
              <div className="flex space-x-1">
                {dateDigits.map((char, idx) => (
                  <div
                    key={idx}
                    className="w-5 h-6 border border-slate-400 dark:border-slate-600 bg-white/90 dark:bg-slate-900 flex items-center justify-center text-xs font-mono font-bold text-slate-900 dark:text-white rounded-xs shadow-2xs"
                  >
                    {char}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payee Line */}
          <div className="mt-6 flex items-baseline">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-12 shrink-0">
              PAY
            </span>
            <div className="flex-1 border-b-2 border-slate-400 dark:border-slate-600 pb-0.5 px-2 font-bold text-sm text-slate-900 dark:text-white tracking-wide">
              {cheque.partyName}
            </div>
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-2">
              OR BEARER
            </span>
          </div>

          {/* Rupees In Words Line & Amount Box */}
          <div className="mt-4 flex items-start gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-baseline">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 w-16 shrink-0">
                  RUPEES
                </span>
                <div className="flex-1 border-b-2 border-slate-400 dark:border-slate-600 pb-0.5 px-2 text-xs font-bold italic text-slate-900 dark:text-white leading-relaxed">
                  {words}
                </div>
              </div>
            </div>

            {/* Amount Rupee Box */}
            <div className="w-44 border-2 border-slate-700 dark:border-slate-300 bg-white/90 dark:bg-slate-900 rounded-lg p-2 text-right shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 block text-left">₹ RUPEES</span>
              <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white font-mono tracking-tight">
                ₹ {Number(cheque.amount).toLocaleString('en-IN')}/-
              </div>
            </div>
          </div>

          {/* Account Number & Signatures */}
          <div className="mt-6 flex items-end justify-between pt-2">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                A/C NO.
              </div>
              <div className="px-3 py-1 bg-white/90 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md font-mono text-xs font-bold tracking-widest">
                9842 1002 9901 22
              </div>
              <p className="text-[9px] text-slate-500 dark:text-slate-400">
                Payable at par at all branches of bank in India
              </p>
            </div>

            {/* Signatory Box */}
            <div className="text-center min-w-[150px]">
              <div className="h-10 border-b border-dashed border-slate-400 dark:border-slate-600 flex items-center justify-center italic text-xs text-slate-400 select-none">
                Authorized Signatory
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mt-1 block">
                FOR {isReceived ? cheque.partyName : 'OUR ENTERPRISE CORP'}
              </span>
            </div>
          </div>

          {/* Bottom MICR Band */}
          <div className="mt-6 -mx-6 -mb-6 bg-slate-100 dark:bg-slate-900/90 border-t border-slate-300 dark:border-slate-700/80 px-6 py-2.5 flex items-center justify-center space-x-6 text-slate-800 dark:text-slate-200 font-mono text-xs sm:text-sm tracking-widest font-black select-none">
            <span>⑈ {cheque.chequeNo} ⑈</span>
            <span>400240012 ⑈</span>
            <span>000241 ⑈</span>
            <span>31</span>
          </div>
        </div>

        {/* Cheque Lifecycle Metadata & Status Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Direction</span>
            <span className={`font-bold mt-0.5 inline-flex items-center gap-1 ${isReceived ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {isReceived ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
              {isReceived ? 'Cheque Received (Inflow)' : 'Cheque Issued (Outflow)'}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Deposit Status</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200 mt-0.5 block">
              {cheque.depositStatus} {cheque.depositDate ? `(${cheque.depositDate})` : ''}
            </span>
          </div>

          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase">Clearance Status</span>
            <span
              className={`font-bold mt-0.5 inline-flex items-center gap-1 ${
                cheque.clearanceStatus === 'Cleared'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : cheque.clearanceStatus === 'Bounced'
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}
            >
              {cheque.clearanceStatus}
              {cheque.clearanceDate ? ` on ${cheque.clearanceDate}` : ''}
            </span>
          </div>
        </div>

        {cheque.linkedTransactionId && (
          <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Tracked in Ledger as Txn #{cheque.linkedTransactionId}</span>
            </span>
            <span className="text-[11px] font-bold bg-teal-100 dark:bg-teal-900/60 px-2 py-0.5 rounded text-teal-800 dark:text-teal-200">
              {isReceived ? 'Amount Received' : 'Expense Outflow'}
            </span>
          </div>
        )}

        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Specimen</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
