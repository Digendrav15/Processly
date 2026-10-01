/**
 * TAT (Turnaround Time) & Delay Calculation Service
 * Standardizes Planned Date, Actual Date, and Time Delay scoring across all 5 systems.
 */

export function parseDateSafe(dateVal) {
  if (!dateVal) return null;
  const d = new Date(dateVal);
  return isNaN(d.getTime()) ? null : d;
}

export function formatShortDate(dateVal) {
  if (!dateVal) return '-';
  const d = parseDateSafe(dateVal);
  if (!d) return String(dateVal).slice(0, 10);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Calculates time delay between planned date and actual date (or now if pending).
 * Returns delay in days, hours, status string, badge styles, and individual scoring (0-100).
 */
export function calculateDelayInfo(plannedDate, actualDate, isPending = false) {
  const planned = parseDateSafe(plannedDate);
  const actual = actualDate ? parseDateSafe(actualDate) : new Date();

  // If no planned date is set
  if (!planned) {
    return {
      plannedText: '-',
      actualText: actualDate ? formatShortDate(actualDate) : '-',
      days: 0,
      hours: 0,
      isDelayed: false,
      text: 'On Schedule',
      badgeClass: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
      score: 100,
      status: 'On Time'
    };
  }

  const plannedDay = new Date(planned.getFullYear(), planned.getMonth(), planned.getDate()).getTime();
  const actualDay = new Date(actual.getFullYear(), actual.getMonth(), actual.getDate()).getTime();

  const diffMs = actualDay - plannedDay;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    const earlyDays = Math.abs(diffDays);
    const label = earlyDays > 0 ? `${earlyDays}d Ahead` : 'On Time (0d)';
    return {
      plannedText: formatShortDate(planned),
      actualText: actualDate ? formatShortDate(actual) : '-',
      days: 0,
      hours: 0,
      isDelayed: false,
      text: label,
      badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      score: 100,
      status: 'On Time'
    };
  }

  // Delayed case
  let score = Math.max(0, 100 - (diffDays * 15));
  let badgeClass = 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800';
  if (diffDays === 1) {
    badgeClass = 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800';
    score = 85;
  }

  return {
    plannedText: formatShortDate(planned),
    actualText: actualDate ? formatShortDate(actual) : '-',
    days: diffDays,
    hours: diffDays * 24,
    isDelayed: true,
    text: `+${diffDays} Day${diffDays > 1 ? 's' : ''} Late`,
    badgeClass,
    score,
    status: isPending ? 'Overdue' : 'Delayed'
  };
}
