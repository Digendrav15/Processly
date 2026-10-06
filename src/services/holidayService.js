const OTD_HOLIDAYS_KEY = 'otd_holidays';
const LOCAL_HOLIDAYS_KEY = 'corporate_system_holidays';

const INITIAL_HOLIDAYS = [
  {
    id: 'hol-1',
    name: 'Independence Day',
    date: '2026-08-15',
    type: 'Public Holiday',
    status: 'Active',
    description: 'National Gazetted Holiday',
  },
  {
    id: 'hol-2',
    name: 'Gandhi Jayanti',
    date: '2026-10-02',
    type: 'Public Holiday',
    status: 'Active',
    description: 'National Gazetted Holiday',
  },
  {
    id: 'hol-3',
    name: 'Diwali Festival',
    date: '2026-11-08',
    type: 'Company Holiday',
    status: 'Active',
    description: 'Corporate Festival Celebration Holiday',
  },
  {
    id: 'hol-4',
    name: 'Christmas Day',
    date: '2026-12-25',
    type: 'Public Holiday',
    status: 'Active',
    description: 'Public Winter Holiday',
  },
];

function getStoredHolidays() {
  try {
    const otdStored = localStorage.getItem(OTD_HOLIDAYS_KEY);
    if (otdStored) {
      const parsed = JSON.parse(otdStored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }

    const legacyStored = localStorage.getItem(LOCAL_HOLIDAYS_KEY);
    if (legacyStored) {
      const parsedLegacy = JSON.parse(legacyStored);
      if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
        localStorage.setItem(OTD_HOLIDAYS_KEY, JSON.stringify(parsedLegacy));
        return parsedLegacy;
      }
    }

    // Default Seed
    localStorage.setItem(OTD_HOLIDAYS_KEY, JSON.stringify(INITIAL_HOLIDAYS));
    localStorage.setItem(LOCAL_HOLIDAYS_KEY, JSON.stringify(INITIAL_HOLIDAYS));
    return INITIAL_HOLIDAYS;
  } catch (e) {
    return INITIAL_HOLIDAYS;
  }
}

function saveHolidays(holidays) {
  try {
    localStorage.setItem(OTD_HOLIDAYS_KEY, JSON.stringify(holidays));
    localStorage.setItem(LOCAL_HOLIDAYS_KEY, JSON.stringify(holidays));
    window.dispatchEvent(new CustomEvent('otd_storage_update', { detail: { key: 'otd_holidays' } }));
    window.dispatchEvent(new CustomEvent('storage', { detail: { key: 'otd_holidays' } }));
  } catch (e) {
    console.error('Error saving holidays:', e);
  }
}

export const holidayService = {
  async getHolidays() {
    return getStoredHolidays();
  },

  getHolidaysSync() {
    return getStoredHolidays();
  },

  async addHoliday(holidayData) {
    const list = getStoredHolidays();
    const newHol = {
      id: holidayData.id || `HOL-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: holidayData.name,
      date: holidayData.date,
      type: holidayData.type || 'Public Holiday',
      status: holidayData.status || 'Active',
      description: holidayData.description || '',
      createdAt: new Date().toISOString(),
    };
    list.unshift(newHol);
    saveHolidays(list);
    return newHol;
  },

  async deleteHoliday(id) {
    const list = getStoredHolidays();
    const filtered = list.filter((h) => h.id !== id);
    saveHolidays(filtered);
  },

  isHolidayDate(dateStr) {
    if (!dateStr) return false;
    const list = getStoredHolidays();
    let formatted = dateStr;
    if (typeof dateStr === 'string' && dateStr.includes('T')) {
      formatted = dateStr.split('T')[0];
    } else if (dateStr instanceof Date) {
      formatted = dateStr.toISOString().split('T')[0];
    }
    return list.some((h) => {
      const hDate = (h.date || '').split('T')[0];
      return hDate === formatted && h.status !== 'Inactive';
    });
  },
};
