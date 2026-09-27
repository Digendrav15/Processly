import React from 'react';
import { Modal } from '../common/Modal';
import { Printer, FileText, ArrowDownLeft, ArrowUpRight, Building2, CheckCircle2 } from 'lucide-react';

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

export function VoucherReceiptModal({ isOpen, onClose, transaction }) {
  if (!transaction) return null;

  const isIncoming = transaction.type === 'incoming';
  const words = numberToWords(transaction.amount);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isIncoming ? "Receipt Voucher Slip" : "Payment Voucher Slip"} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Printable Voucher Paper */}
        <div className="p-6 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-700 rounded-2xl shadow-sm text-slate-800 dark:text-slate-100 font-sans space-y-5">
          {/* Header */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-white pb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  ACME ENTERPRISE CORP
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">
                  Petty Cash & Expense Management Division
                </p>
              </div>
            </div>

            <div className="text-right">
              <div
                className={`inline-block px-3 py-1 rounded-md text-xs font-black uppercase tracking-wider ${
                  isIncoming ? 'bg-teal-100 text-teal-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {isIncoming ? 'PETTY RECEIPT VOUCHER' : 'PETTY PAYMENT VOUCHER'}
              </div>
              <div className="mt-1 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                #{transaction.voucherNo}
              </div>
            </div>
          </div>

          {/* Key Meta Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Voucher Date</span>
              <span className="font-bold text-slate-900 dark:text-white">{transaction.date}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Mode</span>
              <span className="font-bold text-slate-900 dark:text-white">{transaction.paymentMode}</span>
            </div>
          </div>

          {/* Party and Description */}
          <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-3 text-xs border border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500 font-medium">
                {isIncoming ? 'Received From:' : 'Paid To (Beneficiary):'}
              </span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                {transaction.partyName}
              </span>
            </div>

            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-slate-500 font-medium">Expense Category:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {transaction.category}
              </span>
            </div>

            {transaction.billRef && (
              <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-medium">Bill / Reference No:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  {transaction.billRef}
                </span>
              </div>
            )}

            <div>
              <span className="text-slate-500 font-medium block mb-1">Particulars / Narration:</span>
              <p className="font-medium text-slate-700 dark:text-slate-300 italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-700">
                {transaction.description || 'No additional remarks.'}
              </p>
            </div>
          </div>

          {/* Amount Box */}
          <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Amount in Words</span>
              <span className="text-xs font-bold italic text-slate-800 dark:text-slate-200">
                {words}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Amount</span>
              <span className="text-xl font-black text-slate-900 dark:text-white font-mono">
                ₹{Number(transaction.amount).toLocaleString('en-IN')}/-
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 pt-8 text-center text-xs">
            <div>
              <div className="border-b border-slate-400 dark:border-slate-600 pb-1 font-semibold text-slate-700 dark:text-slate-300">
                {transaction.paidBy || transaction.receivedBy || 'Staff'}
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold mt-1 block">Prepared By</span>
            </div>
            <div>
              <div className="border-b border-slate-400 dark:border-slate-600 pb-1 font-semibold text-slate-700 dark:text-slate-300">
                {transaction.partyName}
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold mt-1 block">
                {isIncoming ? 'Payer Signature' : 'Receiver Signature'}
              </span>
            </div>
            <div>
              <div className="border-b border-slate-400 dark:border-slate-600 pb-1 font-semibold text-slate-700 dark:text-slate-300">
                Finance Manager
              </div>
              <span className="text-[10px] text-slate-400 uppercase font-bold mt-1 block">Authorized Signatory</span>
            </div>
          </div>
        </div>

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
            <span>Print Voucher</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
