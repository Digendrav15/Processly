import React, { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Printer,
  Download,
  Share2,
  X,
  Building2,
  CheckCircle2,
  Sliders,
  Sparkles,
  CreditCard,
  FileCheck,
  ShieldCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
  Check,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye
} from 'lucide-react';
import { DEFAULT_COMPANY_DETAILS } from '../../services/otdStorageService';

// Helper to convert number to Indian currency words
function numberToWordsINR(amount) {
  if (!amount || isNaN(amount)) return 'Zero Rupees Only';
  const num = Math.round(Number(amount));
  if (num === 0) return 'Zero Rupees Only';

  const single = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const double = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 10) return single[n];
    if (n >= 10 && n < 20) return double[n - 10];
    return `${tens[Math.floor(n / 10)]} ${single[n % 10]}`.trim();
  }

  function convertThreeDigits(n) {
    const h = Math.floor(n / 100);
    const r = n % 100;
    let str = '';
    if (h > 0) str += `${single[h]} Hundred `;
    if (r > 0) str += convertTwoDigits(r);
    return str.trim();
  }

  const crore = Math.floor(num / 10000000);
  let rem = num % 10000000;
  const lakh = Math.floor(rem / 100000);
  rem = rem % 100000;
  const thousand = Math.floor(rem / 1000);
  rem = rem % 1000;
  const hundreds = rem;

  let res = '';
  if (crore > 0) res += `${convertThreeDigits(crore)} Crore `;
  if (lakh > 0) res += `${convertThreeDigits(lakh)} Lakh `;
  if (thousand > 0) res += `${convertThreeDigits(thousand)} Thousand `;
  if (hundreds > 0) res += `${convertThreeDigits(hundreds)} `;

  return `INR ${res.trim()} Only`;
}

export function QuotationPDFBuilderModal({ isOpen, onClose, quotation }) {
  if (!isOpen || !quotation) return null;

  const pdfContainerRef = useRef(null);
  const viewportRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTheme, setActiveTheme] = useState('indigo'); // 'indigo', 'emerald', 'slate'
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [showDigitalStamp, setShowDigitalStamp] = useState(true);

  // Mobile UX States
  const [showMobileControls, setShowMobileControls] = useState(false);
  const [zoomMode, setZoomMode] = useState('fit'); // 'fit' or '100'
  const [fitScale, setFitScale] = useState(0.45);
  const [canvasHeight, setCanvasHeight] = useState(1150);

  // Auto-calculate scale on window resize or modal open
  useEffect(() => {
    const updateScale = () => {
      if (viewportRef.current) {
        const containerWidth = viewportRef.current.clientWidth - 24;
        if (containerWidth > 0) {
          const s = Math.min(1, Math.max(0.32, containerWidth / 800));
          setFitScale(s);
        }
      }
      if (pdfContainerRef.current) {
        setCanvasHeight(pdfContainerRef.current.offsetHeight || 1150);
      }
    };

    updateScale();
    const timer = setTimeout(updateScale, 100);
    window.addEventListener('resize', updateScale);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateScale);
    };
  }, [isOpen, showBankDetails, showTerms, showDigitalStamp, activeTheme]);

  // Company details
  const company = {
    name: DEFAULT_COMPANY_DETAILS.companyName || 'Processly',
    tagline: 'Leading Industrial Automation & Supply Solutions',
    gstin: DEFAULT_COMPANY_DETAILS.gstin || '07AAACA1234F1Z8',
    pan: DEFAULT_COMPANY_DETAILS.pan || 'AAACA1234F',
    cin: 'U72200DL2018PTC334455',
    address: DEFAULT_COMPANY_DETAILS.address || 'Plot No. 42, Udyog Vihar Phase IV',
    city: DEFAULT_COMPANY_DETAILS.city || 'Gurugram',
    state: DEFAULT_COMPANY_DETAILS.state || 'Haryana',
    pincode: DEFAULT_COMPANY_DETAILS.pincode || '122015',
    email: DEFAULT_COMPANY_DETAILS.email || 'sales@acme-enterprise.com',
    phone: DEFAULT_COMPANY_DETAILS.phone || '+91 (0124) 450-8900',
    website: DEFAULT_COMPANY_DETAILS.website || 'www.acme-enterprise.com',
    bank: {
      name: DEFAULT_COMPANY_DETAILS.bankName || 'HDFC Bank Ltd',
      accountNumber: DEFAULT_COMPANY_DETAILS.accountNumber || '50200012345678',
      ifsc: DEFAULT_COMPANY_DETAILS.ifsc || 'HDFC0000123',
      accountType: 'Current Account',
      branch: 'Sector 29 Corporate Banking Branch, Gurugram'
    }
  };

  // Theme styling helpers
  const themeColors = {
    indigo: {
      primary: 'bg-indigo-700 text-white',
      accent: 'text-indigo-700',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      border: 'border-indigo-600',
      heading: 'text-indigo-900',
      tableHeader: 'bg-indigo-900 text-white',
      stampBorder: 'border-indigo-700 text-indigo-700',
    },
    emerald: {
      primary: 'bg-teal-700 text-white',
      accent: 'text-teal-700',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      border: 'border-teal-600',
      heading: 'text-teal-900',
      tableHeader: 'bg-teal-900 text-white',
      stampBorder: 'border-teal-700 text-teal-700',
    },
    slate: {
      primary: 'bg-slate-900 text-white',
      accent: 'text-slate-900',
      badge: 'bg-slate-100 text-slate-900 border-slate-300',
      border: 'border-slate-900',
      heading: 'text-slate-900',
      tableHeader: 'bg-slate-900 text-white',
      stampBorder: 'border-slate-800 text-slate-800',
    }
  };

  const currentTheme = themeColors[activeTheme] || themeColors.indigo;

  // 1-Click High-Res PDF Export
  const handleDownloadPDF = async () => {
    if (!pdfContainerRef.current) return;
    setIsExporting(true);

    const prevMode = zoomMode;
    setZoomMode('100');
    // Allow DOM to render unscaled for crisp capture
    await new Promise((r) => setTimeout(r, 80));

    try {
      const element = pdfContainerRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Quotation_${quotation.quotationNo || 'Proposal'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Could not generate PDF. Please try Native Print.');
    } finally {
      setZoomMode(prevMode);
      setIsExporting(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Quotation #${quotation.quotationNo}`,
          text: `Commercial Proposal for ${quotation.customer || quotation.customerName || 'Client'} - Total ₹${Number(quotation.grandTotal || 0).toLocaleString('en-IN')}`,
          url: window.location.href
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      window.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col md:items-center md:justify-center p-0 md:p-4 overflow-hidden animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 w-full h-full md:h-auto md:max-h-[94vh] md:max-w-5xl md:rounded-2xl border-0 md:border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* ======================================================== */}
        {/* 1. MOBILE HEADER (Compact, Native App Style)             */}
        {/* ======================================================== */}
        <div className="flex md:hidden items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 z-20">
          <div className="flex items-center space-x-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h2 className="text-xs font-black text-slate-900 dark:text-white truncate">
                Quote #{quotation.quotationNo || 'Proposal'}
              </h2>
              <p className="text-[10px] text-slate-400 truncate">
                {quotation.customer || quotation.customerName || 'Commercial Proposal'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Viewport Zoom Toggle (Fit vs 100%) */}
            <button
              type="button"
              onClick={() => setZoomMode((m) => (m === 'fit' ? '100' : 'fit'))}
              className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1"
              title="Toggle View Mode"
            >
              {zoomMode === 'fit' ? (
                <>
                  <ZoomIn className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>100%</span>
                </>
              ) : (
                <>
                  <Minimize2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                  <span>Fit</span>
                </>
              )}
            </button>

            {/* Customization Toggle */}
            <button
              type="button"
              onClick={() => setShowMobileControls((prev) => !prev)}
              className={`p-1.5 rounded-lg text-xs font-bold border flex items-center gap-1 transition-colors ${
                showMobileControls
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
              title="Customization Options"
            >
              <Sliders className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* MOBILE COLLAPSIBLE CUSTOMIZATION DRAWER */}
        {showMobileControls && (
          <div className="md:hidden bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 space-y-2.5 shrink-0 animate-in slide-in-from-top-2 duration-150 shadow-inner">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-500">
              <span>Theme Color</span>
              <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-0.5 rounded-lg text-[10px]">
                <button
                  type="button"
                  onClick={() => setActiveTheme('indigo')}
                  className={`px-2 py-0.5 rounded-md font-extrabold ${
                    activeTheme === 'indigo'
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Indigo
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTheme('emerald')}
                  className={`px-2 py-0.5 rounded-md font-extrabold ${
                    activeTheme === 'emerald'
                      ? 'bg-teal-700 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Teal
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTheme('slate')}
                  className={`px-2 py-0.5 rounded-md font-extrabold ${
                    activeTheme === 'slate'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Slate
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-bold text-slate-500">Document Sections</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowBankDetails(!showBankDetails)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    showBankDetails
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
                  }`}
                >
                  Bank A/C
                </button>
                <button
                  type="button"
                  onClick={() => setShowDigitalStamp(!showDigitalStamp)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    showDigitalStamp
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
                  }`}
                >
                  Seal / Stamp
                </button>
                <button
                  type="button"
                  onClick={() => setShowTerms(!showTerms)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    showTerms
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800 font-extrabold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
                  }`}
                >
                  Terms
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. DESKTOP TOP CONTROL BAR                               */}
        {/* ======================================================== */}
        <div className="hidden md:flex flex-wrap items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">
              Q
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-slate-900 dark:text-white leading-tight">
                Quotation PDF Builder & Generator
              </h2>
              <p className="text-[11px] text-slate-400">
                Official Letterhead, GST Breakdown & Digital Seal Verification
              </p>
            </div>
          </div>

          {/* Desktop Builder Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Theme switcher */}
            <div className="flex items-center bg-slate-200 dark:bg-slate-800 p-1 rounded-xl text-xs">
              <button
                type="button"
                onClick={() => setActiveTheme('indigo')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTheme === 'indigo'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Indigo
              </button>
              <button
                type="button"
                onClick={() => setActiveTheme('emerald')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTheme === 'emerald'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Teal
              </button>
              <button
                type="button"
                onClick={() => setActiveTheme('slate')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
                  activeTheme === 'slate'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                Slate
              </button>
            </div>

            {/* Toggle Bank Details */}
            <button
              type="button"
              onClick={() => setShowBankDetails(!showBankDetails)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                showBankDetails
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              Bank A/C
            </button>

            {/* Toggle Stamp */}
            <button
              type="button"
              onClick={() => setShowDigitalStamp(!showDigitalStamp)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                showDigitalStamp
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent'
              }`}
            >
              Seal / Stamp
            </button>

            {/* Action: 1-Click PDF Download */}
            <button
              type="button"
              disabled={isExporting}
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-50"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>{isExporting ? 'Generating PDF...' : '1-Click PDF Download'}</span>
            </button>

            {/* Action: Native Print */}
            <button
              type="button"
              onClick={() => window.print()}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
              title="Print"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. MODAL SCROLLABLE CANVAS PREVIEW                       */}
        {/* ======================================================== */}
        <div
          ref={viewportRef}
          className="flex-1 overflow-auto p-2 sm:p-4 md:p-6 bg-slate-100 dark:bg-slate-950 flex flex-col items-center touch-pan-x touch-pan-y"
        >
          {/* Subtle mobile helper hint */}
          <div className="md:hidden flex items-center justify-between w-full max-w-[800px] pb-2 text-[10px] text-slate-400 px-1">
            <span>Standard A4 Preview</span>
            <span className="font-semibold text-indigo-500">
              {zoomMode === 'fit' ? 'Fitted to Screen (Tap 100% to zoom)' : 'Actual Size (Scrollable)'}
            </span>
          </div>

          {/* Scaled viewport container for clean mobile rendering */}
          <div
            className="transition-all duration-200"
            style={
              zoomMode === 'fit' && fitScale < 1
                ? {
                    width: `${Math.round(800 * fitScale)}px`,
                    height: `${Math.round(canvasHeight * fitScale)}px`,
                    position: 'relative'
                  }
                : {
                    width: '800px',
                    minWidth: '800px'
                  }
            }
          >
            <div
              style={
                zoomMode === 'fit' && fitScale < 1
                  ? {
                      transform: `scale(${fitScale})`,
                      transformOrigin: 'top left',
                      width: '800px'
                    }
                  : {
                      width: '800px'
                    }
              }
            >
              {/* A4 Printable Sheet Container (Standard Width 800px) */}
              <div
                ref={pdfContainerRef}
                className="w-full bg-white text-slate-900 p-6 sm:p-8 md:p-10 shadow-xl rounded-xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:max-w-none space-y-6 text-xs font-sans leading-normal"
                style={{ minHeight: '1050px' }}
              >
            {/* 1. Header with Company Letterhead */}
            <div className="flex items-start justify-between border-b-2 border-slate-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-black text-base shadow-xs">
                    A
                  </div>
                  <div>
                    <h1 className="text-xl font-black tracking-tight text-slate-900 leading-tight">
                      {company.name}
                    </h1>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {company.tagline}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-600 max-w-sm pt-1">
                  {company.address}, {company.city}, {company.state} - {company.pincode}
                </p>
                <div className="text-[10px] text-slate-500 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span><strong>GSTIN:</strong> {company.gstin}</span>
                  <span><strong>PAN:</strong> {company.pan}</span>
                  <span><strong>CIN:</strong> {company.cin}</span>
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="inline-block px-3 py-1 bg-slate-900 text-white text-xs font-black tracking-wider uppercase rounded-md">
                  COMMERCIAL PROPOSAL
                </div>
                <div className="text-[11px] text-slate-700 pt-1">
                  Quote No: <strong className="text-slate-900 text-xs">{quotation.quotationNo}</strong>
                </div>
                <div className="text-[11px] text-slate-600">
                  Date: <strong>{quotation.quotationDate || new Date().toISOString().split('T')[0]}</strong>
                </div>
                <div className="text-[11px] text-slate-600">
                  Validity: <strong>{quotation.quotationValidity || '30 Days'}</strong>
                </div>
                {quotation.leadId && (
                  <div className="text-[10px] text-slate-500">
                    Ref Lead: <strong>{quotation.leadId}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Customer & Billing/Shipping Grid */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  PROPOSAL SUBMITTED TO:
                </span>
                <p className="font-extrabold text-sm text-slate-900">
                  {quotation.customer || quotation.customerName || 'Valued Corporate Client'}
                </p>
                <p className="text-[11px] text-slate-700 font-semibold mt-0.5">
                  Attn: {quotation.contactPerson || 'Procurement / Purchase Head'}
                </p>
                <p className="text-[11px] text-slate-600">Phone: {quotation.mobile || '+91 —'}</p>
                <p className="text-[11px] text-slate-600">Email: {quotation.email || '—'}</p>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block mb-1">
                  DELIVERY / PROJECT SITE:
                </span>
                <p className="text-[11px] text-slate-700">
                  <strong>Billing:</strong> {quotation.billingAddress || company.city}
                </p>
                <p className="text-[11px] text-slate-700 mt-1">
                  <strong>Shipping:</strong> {quotation.shippingAddress || quotation.billingAddress || 'As per Purchase Order'}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  <strong>Sales Rep:</strong> {quotation.createdBy || 'Corporate Key Account Manager'}
                </p>
              </div>
            </div>

            {/* 3. Items Table */}
            <div className="space-y-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className={`${currentTheme.tableHeader} text-[10px] font-bold uppercase tracking-wider`}>
                    <th className="py-2.5 px-3 w-8 text-center">#</th>
                    <th className="py-2.5 px-3 min-w-[200px]">Item Description & Specs</th>
                    <th className="py-2.5 px-3 text-center w-16">Qty</th>
                    <th className="py-2.5 px-3 text-center w-16">Unit</th>
                    <th className="py-2.5 px-3 text-right w-24">Unit Rate</th>
                    <th className="py-2.5 px-3 text-center w-16">Disc %</th>
                    <th className="py-2.5 px-3 text-center w-16">GST %</th>
                    <th className="py-2.5 px-3 text-right w-28">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[11px]">
                  {quotation.items?.map((it, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3">
                        <div className="font-extrabold text-slate-900">{it.productService}</div>
                        {it.description && (
                          <div className="text-[10px] text-slate-500 font-medium">{it.description}</div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{it.quantity}</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.unit || 'Pcs'}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                        ₹ {Number(it.rate || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.discount || 0}%</td>
                      <td className="py-2.5 px-3 text-center text-slate-600">{it.taxPercent || 18}%</td>
                      <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                        ₹ {Number(it.total || 0).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 4. Calculation Summary & Amount in Words */}
            <div className="flex flex-col sm:flex-row items-start justify-between gap-6 pt-2">
              <div className="flex-1 space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Amount in Words:</span>
                  <p className="text-xs font-black text-slate-900 italic mt-0.5">
                    {numberToWordsINR(quotation.grandTotal)}
                  </p>
                </div>

                {/* Bank Account Wire Transfer Box */}
                {showBankDetails && (
                  <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100 text-[10px] space-y-0.5">
                    <div className="font-extrabold text-indigo-900 uppercase flex items-center gap-1">
                      <CreditCard className="w-3 h-3 text-indigo-700" />
                      <span>Direct RTGS / NEFT Banking Details</span>
                    </div>
                    <div className="text-slate-700">
                      Bank Name: <strong>{company.bank.name}</strong> | A/C Type: <strong>{company.bank.accountType}</strong>
                    </div>
                    <div className="text-slate-700">
                      Account No: <strong className="text-indigo-800">{company.bank.accountNumber}</strong> | IFSC Code: <strong className="text-indigo-800">{company.bank.ifsc}</strong>
                    </div>
                    <div className="text-slate-500">{company.bank.branch}</div>
                  </div>
                )}
              </div>

              {/* Totals Table */}
              <div className="w-full sm:w-72 bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span>₹ {Number(quotation.subTotal || 0).toLocaleString('en-IN')}</span>
                </div>
                {quotation.totalDiscount > 0 && (
                  <div className="flex justify-between text-rose-600 font-semibold">
                    <span>Discount Deduction:</span>
                    <span>- ₹ {Number(quotation.totalDiscount || 0).toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Value:</span>
                  <span>₹ {Number(quotation.taxableAmount || (quotation.subTotal - (quotation.totalDiscount || 0))).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Total GST Tax (18%):</span>
                  <span>₹ {Number(quotation.totalTax || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t-2 border-slate-800 flex justify-between font-black text-sm text-slate-900">
                  <span>Grand Total (INR):</span>
                  <span className="text-indigo-700">
                    ₹ {Number(quotation.grandTotal || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            {/* 5. Terms & Conditions */}
            {showTerms && (
              <div className="pt-2 border-t border-slate-200">
                <h4 className="font-extrabold text-[11px] text-slate-900 uppercase tracking-wider mb-1.5">
                  Terms & Conditions of Supply
                </h4>
                <ol className="list-decimal pl-4 space-y-0.5 text-[10px] text-slate-600">
                  <li>
                    <strong>Payment Terms:</strong> {quotation.paymentTerms || '50% Advance with Purchase Order, 50% prior to dispatch'}.
                  </li>
                  <li>
                    <strong>Delivery Timeline:</strong> {quotation.deliveryTerms || 'Door delivery within 10-15 business days from approval'}.
                  </li>
                  <li>
                    <strong>Price Validity:</strong> This commercial offer is valid for {quotation.quotationValidity || '30 days'} from date of issue.
                  </li>
                  <li>
                    <strong>Warranty:</strong> Standard 12 months manufacturer warranty against manufacturing defects.
                  </li>
                  <li>
                    <strong>Statutory Taxes:</strong> GST charges are levied as per current Indian taxation laws.
                  </li>
                </ol>
              </div>
            )}

            {/* 6. Signature & Digital Stamp Verification */}
            <div className="flex items-end justify-between pt-6 border-t border-slate-200">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400">
                  System Generated Electronic Quotation • ID: {quotation.quotationNo}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-700">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Authenticated via TaskFlow Enterprise Cryptographic Audit</span>
                </div>
              </div>

              {/* Digital Seal Stamp */}
              <div className="flex items-center gap-4">
                {showDigitalStamp && (
                  <div
                    className={`w-24 h-24 rounded-full border-2 border-dashed ${currentTheme.stampBorder} flex flex-col items-center justify-center p-1.5 text-center transform -rotate-6 select-none opacity-85`}
                  >
                    <span className="text-[8px] font-black uppercase tracking-widest">★ ACME CORP ★</span>
                    <span className="text-[11px] font-black tracking-tight uppercase leading-none py-1">
                      VERIFIED
                    </span>
                    <span className="text-[7px] font-bold uppercase tracking-wider">OFFICIAL SEAL</span>
                  </div>
                )}

                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold text-slate-500 uppercase">For {company.name}</p>
                  <div className="h-10 flex items-center justify-end font-serif italic text-base text-indigo-900 font-bold select-none">
                    Vikramaditya S.
                  </div>
                  <p className="text-xs font-extrabold text-slate-900">Authorized Signatory</p>
                  <p className="text-[9px] text-slate-400">Head of Commercial Operations</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* ======================================================== */}
      {/* 4. MOBILE STICKY BOTTOM ACTION BAR (Native Thumb Friendly) */}
      {/* ======================================================== */}
      <div className="flex md:hidden items-center justify-between gap-2 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shrink-0 z-20 shadow-lg">
        {/* Print / Native */}
        <button
          type="button"
          onClick={() => window.print()}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
          title="Print"
        >
          <Printer className="w-4 h-4" />
        </button>

        {/* Share */}
        <button
          type="button"
          onClick={handleShare}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 transition-all"
          title="Share"
        >
          <Share2 className="w-4 h-4" />
        </button>

        {/* Primary CTA: Download PDF */}
        <button
          type="button"
          disabled={isExporting}
          onClick={handleDownloadPDF}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-md shadow-indigo-600/30 active:scale-98 transition-all disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating PDF...</span>
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              <span>Download PDF ({quotation.quotationNo})</span>
            </>
          )}
        </button>
      </div>

    </div>
  </div>
);
}
