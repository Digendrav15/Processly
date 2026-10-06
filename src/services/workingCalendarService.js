/**
 * Working Day Calendar Service
 * Manages enterprise working date ranges, weekly off rules (e.g. Sunday Off),
 * rollover of planned dates to the next working day (Sunday -> Monday),
 * and validates planned dates against calendar end dates.
 */

const STORAGE_KEY = 'corporate_working_day_calendar';

export const DEFAULT_CALENDAR_CONFIG = {
  startDate: '2026-01-01',
  endDate: '2028-12-31',
  // 0 = Sunday, 1 = Monday, 2 = Tuesday, 3 = Wednesday, 4 = Thursday, 5 = Friday, 6 = Saturday
  weeklyOffDays: [0], // Default Sunday is Week Off
  customOffDates: [
    '2026-08-15', // Independence Day
    '2026-10-02', // Gandhi Jayanti
    '2026-12-25', // Christmas
    '2027-01-26', // Republic Day
    '2027-08-15', // Independence Day
    '2027-10-02', // Gandhi Jayanti
    '2027-12-25', // Christmas
    '2028-01-26', // Republic Day
    '2028-08-15', // Independence Day
    '2028-10-02', // Gandhi Jayanti
    '2028-12-25', // Christmas
  ],
};

const DAY_NAMES_DDD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Calculates standard ISO week number for a given date
 */
export function getWeekNumber(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'W1';
  // Copy date so don't modify original
  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  // Set to nearest Thursday: current date + 4 - current day number
  // Make Sunday's day number 7
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  // 4th January is always in week 1
  const firstThursday = target.getTime();
  target.setUTCMonth(0, 4);
  const targetDayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - targetDayNr + 3);
  const weekNum = 1 + Math.round((firstThursday - target.getTime()) / 604800000);
  return `Week ${weekNum}`;
}

export function getDayDDD(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return 'N/A';
  return DAY_NAMES_DDD[d.getDay()];
}

export function formatDateYYYYMMDD(dateInput) {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const workingCalendarService = {
  /**
   * Get the current Working Day Calendar Configuration
   */
  getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CALENDAR_CONFIG));
        return DEFAULT_CALENDAR_CONFIG;
      }
      return { ...DEFAULT_CALENDAR_CONFIG, ...JSON.parse(stored) };
    } catch (e) {
      return DEFAULT_CALENDAR_CONFIG;
    }
  },

  /**
   * Save / Update Working Day Calendar Configuration
   */
  saveConfig(newConfig) {
    const updated = {
      ...this.getConfig(),
      ...newConfig,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('working_calendar_updated', { detail: updated }));
    return updated;
  },

  /**
   * Checks whether a specific date string is a Week Off or Custom Holiday
   */
  isWeekOffDate(dateInput) {
    if (!dateInput) return false;
    const config = this.getConfig();
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return false;

    // Check Day of week (0-6)
    const dayOfWeek = d.getDay();
    if (config.weeklyOffDays.includes(dayOfWeek)) {
      return true;
    }

    // Check custom holiday / off date (YYYY-MM-DD)
    const ymd = formatDateYYYYMMDD(d);
    if (config.customOffDates.includes(ymd)) {
      return true;
    }

    return false;
  },

  /**
   * Checks whether a date is within the configured calendar range [startDate, endDate]
   */
  isDateWithinRange(dateInput) {
    if (!dateInput) return false;
    const config = this.getConfig();
    const ymd = formatDateYYYYMMDD(dateInput);
    return ymd >= config.startDate && ymd <= config.endDate;
  },

  /**
   * Checks if date is beyond the calendar end date (> endDate)
   */
  isDateBeyondRange(dateInput) {
    if (!dateInput) return false;
    const config = this.getConfig();
    const ymd = formatDateYYYYMMDD(dateInput);
    return ymd > config.endDate;
  },

  /**
   * Next Working Day Rollover Logic:
   * "Like sunday Off Karne Par Sunday Ka Planned Monday Ho Jayega"
   * If a date falls on Sunday or an off-day, automatically roll forward to the next working day!
   */
  getNextWorkingDate(dateInput) {
    if (!dateInput) return dateInput;
    let d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;

    const maxLookaheadDays = 30; // Safety limit
    let count = 0;

    while (this.isWeekOffDate(d) && count < maxLookaheadDays) {
      d.setDate(d.getDate() + 1);
      count++;
    }

    return d;
  },

  /**
   * Validate Planned Date:
   * Returns:
   * - isValid: boolean
   * - isMissing: boolean (if > endDate -> "Working Date Missing")
   * - wasAdjusted: boolean (if shifted from Sunday/Week Off to Monday)
   * - adjustedDate: Date/string rolled over to next working day
   * - info: { date, dayDDD, weekNo }
   */
  validatePlannedDate(dateInput) {
    if (!dateInput) {
      return {
        isValid: false,
        isMissing: true,
        wasAdjusted: false,
        adjustedDate: null,
        info: { date: 'N/A', dayDDD: 'N/A', weekNo: 'N/A' },
      };
    }

    const config = this.getConfig();
    const d = new Date(dateInput);
    const ymd = formatDateYYYYMMDD(d);
    const dayDDD = getDayDDD(d);
    const weekNo = getWeekNumber(d);

    const info = {
      date: ymd,
      dayDDD,
      weekNo,
      endDate: config.endDate,
      startDate: config.startDate,
    };

    // If planned date is strictly greater than endDate -> Working Date Missing!
    if (ymd > config.endDate) {
      return {
        isValid: false,
        isMissing: true,
        wasAdjusted: false,
        adjustedDate: ymd,
        info,
      };
    }

    // Check if on a Week Off (e.g. Sunday) -> Rollover to next working day (e.g. Monday)
    const isOff = this.isWeekOffDate(d);
    if (isOff) {
      const nextWorking = this.getNextWorkingDate(d);
      const nextYmd = formatDateYYYYMMDD(nextWorking);
      return {
        isValid: true,
        isMissing: false,
        wasAdjusted: true,
        originalDate: ymd,
        adjustedDate: nextYmd,
        adjustedDayDDD: getDayDDD(nextWorking),
        adjustedWeekNo: getWeekNumber(nextWorking),
        info,
      };
    }

    return {
      isValid: true,
      isMissing: false,
      wasAdjusted: false,
      adjustedDate: ymd,
      info,
    };
  },

  /**
   * Dispatches the global "Working Date Missing" popup event
   */
  triggerWorkingDateMissingPopup(missingDateInfo) {
    window.dispatchEvent(
      new CustomEvent('working_date_missing_popup', {
        detail: missingDateInfo,
      })
    );
  },

  /**
   * Generate calendar day items for a specific month or year range
   */
  getCalendarDaysForMonth(year, month) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const ymd = formatDateYYYYMMDD(date);
      const isOff = this.isWeekOffDate(date);
      const dayDDD = getDayDDD(date);
      const weekNo = getWeekNumber(date);
      const withinRange = this.isDateWithinRange(date);

      result.push({
        date: ymd,
        dayNumber: day,
        dayDDD,
        dayName: DAY_NAMES_FULL[date.getDay()],
        weekNo,
        isWorkingDay: !isOff,
        withinRange,
        status: isOff ? 'Week Off' : 'Working Day',
      });
    }

    return result;
  },
};
