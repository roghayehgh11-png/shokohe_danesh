/**
 * Utility functions for Jalali / Persian date formatting and time calculations
 */

export function normalizeDigits(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/[۰-۹]/g, d => '0123456789'['۰۱۲۳۴۵۶۷۸۹'.indexOf(d)])
    .replace(/[٠-٩]/g, d => '0123456789'['٠١٢٣٤٥٦٧٨٩'.indexOf(d)]);
}

/**
 * Exact Gregorian to Jalali (Persian) date conversion algorithm
 */
export function gregorianToJalali(gy: number, gm: number, gd: number): { jy: number; jm: number; jd: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const jm = (days < 186) ? 1 + Math.floor(days / 31) : 7 + Math.floor((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return { jy, jm, jd };
}

export function getTodayPersianDate(): string {
  const now = new Date();
  const { jy, jm, jd } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
}

export function getCurrentPersianYear(): string {
  const now = new Date();
  const { jy } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return String(jy);
}

export function getCurrentPersianMonth(): string {
  const now = new Date();
  const { jm } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return String(jm).padStart(2, '0');
}

export function getCurrentPersianDay(): number {
  const now = new Date();
  const { jd } = gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  return jd;
}

export interface PersianFullDateInfo {
  fullFormatted: string; // e.g. "چهارشنبه، ۲۹ مرداد ۱۴۰۵"
  shortFormatted: string; // e.g. "۱۴۰۵/۰۵/۲۹"
  latinDateStr: string; // e.g. "1405/05/29"
  weekday: string; // e.g. "چهارشنبه"
  day: number;
  dayPersian: string;
  monthName: string; // e.g. "مرداد"
  month: string; // "05"
  year: number;
  yearPersian: string;
  timeStr: string; // "11:23:14"
  timePersian: string; // "۱۱:۲۳:۱۴"
  timeShort: string; // "11:23"
  timeShortPersian: string; // "۱۱:۲۳"
}

export function getPersianFullDateInfo(dateInput?: Date): PersianFullDateInfo {
  const date = dateInput || new Date();
  const { jy, jm, jd } = gregorianToJalali(date.getFullYear(), date.getMonth() + 1, date.getDate());
  
  const weekdays = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  const weekday = weekdays[date.getDay()] || '';
  const monthName = PERSIAN_MONTH_NAMES[jm - 1] || '';
  
  const latinDateStr = `${jy}/${String(jm).padStart(2, '0')}/${String(jd).padStart(2, '0')}`;
  const dayPersian = Number(jd).toLocaleString('fa-IR');
  const yearPersian = Number(jy).toLocaleString('fa-IR').replace(/٬/g, '');
  const monthPersian = Number(jm).toLocaleString('fa-IR').padStart(2, '۰');
  const shortFormatted = `${yearPersian}/${monthPersian}/${dayPersian}`;
  const fullFormatted = `${weekday}، ${dayPersian} ${monthName} ${yearPersian}`;

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}:${seconds}`;
  const timeShort = `${hours}:${minutes}`;

  const timePersian = `${Number(hours).toLocaleString('fa-IR').padStart(2, '۰')}:${Number(minutes).toLocaleString('fa-IR').padStart(2, '۰')}:${Number(seconds).toLocaleString('fa-IR').padStart(2, '۰')}`;
  const timeShortPersian = `${Number(hours).toLocaleString('fa-IR').padStart(2, '۰')}:${Number(minutes).toLocaleString('fa-IR').padStart(2, '۰')}`;

  return {
    fullFormatted,
    shortFormatted,
    latinDateStr,
    weekday,
    day: jd,
    dayPersian,
    monthName,
    month: String(jm).padStart(2, '0'),
    year: jy,
    yearPersian,
    timeStr,
    timePersian,
    timeShort,
    timeShortPersian
  };
}

/**
 * Converts a Jalali date (year, month, day) to JavaScript Gregorian Date object.
 */
export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  let gy = (jy <= 979) ? 621 : 1600;
  let jYear = jy - ((jy <= 979) ? 0 : 979);
  let days = (365 * jYear) + (Math.floor(jYear / 33) * 8) + (Math.floor(((jYear % 33) + 3) / 4))
    + 78 + jd + ((jm < 7) ? (jm - 1) * 31 : (((jm - 7) * 30) + 186));
  
  gy += 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  const gd = days + 1;
  const salA = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  let gm = 0;
  for (gm = 0; gm < 13; gm++) {
    const v = salA[gm];
    if (gd <= v) break;
  }
  return new Date(gy, gm - 1, gd);
}

/**
 * Accurately determines if a Persian year is a leap year (kabiseh)
 */
export function isPersianLeapYear(jy: number): boolean {
  const nextFarvardin = jalaliToGregorian(jy + 1, 1, 1);
  const thisEsfandFirst = jalaliToGregorian(jy, 12, 1);
  const diffDays = Math.round((nextFarvardin.getTime() - thisEsfandFirst.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays === 30;
}

/**
 * Returns number of days in any Persian year and month (handles leap years)
 */
export function getDaysInPersianMonth(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isPersianLeapYear(jy) ? 30 : 29;
}

/**
 * Get date range for an entire Persian year or from today to end of year
 */
export function getPersianYearEndRange(targetYear: number = 1405): { startDate: string; endDate: string } {
  const today = getTodayPersianDate();
  const [todayY] = today.split('/').map(Number);
  const year = targetYear || todayY || 1405;
  const isLeap = isPersianLeapYear(year);
  const lastDay = isLeap ? '30' : '29';
  return {
    startDate: todayY === year ? today : `${year}/01/01`,
    endDate: `${year}/12/${lastDay}`
  };
}

/**
 * Returns true if the given Jalali date is Friday (official weekend)
 */
export function isPersianFriday(jy: number, jm: number, jd: number): boolean {
  const gDate = jalaliToGregorian(jy, jm, jd);
  return gDate.getDay() === 5; // In JS Date: 0 = Sun, 1 = Mon, ..., 5 = Fri, 6 = Sat
}

/**
 * Returns the Persian weekday name
 */
export function getPersianWeekdayName(jy: number, jm: number, jd: number): string {
  const gDate = jalaliToGregorian(jy, jm, jd);
  const dayIndex = gDate.getDay();
  const names = ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه'];
  return names[dayIndex] || '';
}

export function formatPersianNumber(val: number | string): string {
  return Number(val).toLocaleString('fa-IR');
}

/**
 * Calculates duration between two times in HH:MM format
 * e.g. clockIn: "08:30", clockOut: "17:15" -> 8 hours and 45 minutes (8.75 hours)
 */
export function calculateWorkDuration(clockIn: string, clockOut: string): {
  hours: number;
  minutes: number;
  totalHoursDecimal: number;
  formattedText: string;
  isValid: boolean;
} {
  if (!clockIn || !clockOut) {
    return {
      hours: 0,
      minutes: 0,
      totalHoursDecimal: 0,
      formattedText: 'ساعت نامعتبر',
      isValid: false
    };
  }

  const normIn = normalizeDigits(clockIn).trim();
  const normOut = normalizeDigits(clockOut).trim();
  const [inH, inM] = normIn.split(':').map(Number);
  const [outH, outM] = normOut.split(':').map(Number);

  if (isNaN(inH) || isNaN(inM) || isNaN(outH) || isNaN(outM)) {
    return {
      hours: 0,
      minutes: 0,
      totalHoursDecimal: 0,
      formattedText: 'فرمت نامعتبر',
      isValid: false
    };
  }

  const inTotalMinutes = inH * 60 + inM;
  let outTotalMinutes = outH * 60 + outM;

  // Handle overnight shift if out is earlier than in
  if (outTotalMinutes < inTotalMinutes) {
    outTotalMinutes += 24 * 60;
  }

  const diffMinutes = outTotalMinutes - inTotalMinutes;
  const hours = Math.floor(diffMinutes / 60);
  const minutes = diffMinutes % 60;
  const totalHoursDecimal = Number((diffMinutes / 60).toFixed(2));

  let formattedText = '';
  if (hours > 0 && minutes > 0) {
    formattedText = `${hours} ساعت و ${minutes} دقیقه`;
  } else if (hours > 0) {
    formattedText = `${hours} ساعت کامل`;
  } else {
    formattedText = `${minutes} دقیقه`;
  }

  return {
    hours,
    minutes,
    totalHoursDecimal,
    formattedText,
    isValid: true
  };
}

/**
 * Persian Month Names
 */
export const PERSIAN_MONTH_NAMES = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

/**
 * Key recurring official Iranian holidays (month-day in Jalali)
 */
export const OFFICIAL_PERSIAN_HOLIDAYS: Record<string, string> = {
  // Universal Solar Holidays
  '01/01': 'عید نوروز',
  '01/02': 'عید نوروز',
  '01/03': 'عید نوروز',
  '01/04': 'عید نوروز',
  '01/12': 'روز جمهوری اسلامی',
  '01/13': 'روز طبیعت (سیزده‌بدر)',
  '03/14': 'رحلت حضرت امام خمینی',
  '03/15': 'قیام خونین ۱۵ خرداد',
  '11/22': 'پیروزی انقلاب اسلامی',
  '12/29': 'روز ملی شدن صنعت نفت',

  // Official Lunar / Historical Holidays recognized in Iran
  // Month 05 (Mordad):
  '05/04': 'اربعین حسینی',
  '05/12': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
  '05/14': 'شهادت حضرت امام رضا (ع)',
  '05/22': 'شهادت امام حسن عسکری (ع)',
  '05/25': 'تاسوعای حسینی',
  '05/26': 'عاشورای حسینی',
  '05/28': 'شهادت امام حسن مجتبی (ع) / ۲۸ صفر',
  '05/30': 'شهادت امام رضا (ع)'
};

/**
 * Detailed official holidays per Jalali year for Iran
 */
export const YEARLY_PERSIAN_HOLIDAYS: Record<number, Record<string, string>> = {
  1403: {
    '01/01': 'عید نوروز',
    '01/02': 'عید نوروز',
    '01/03': 'عید نوروز',
    '01/04': 'عید نوروز',
    '01/12': 'روز جمهوری اسلامی و شهادت حضرت علی (ع)',
    '01/13': 'روز طبیعت',
    '01/22': 'عید سعید فطر',
    '01/23': 'تعطیلی عید سعید فطر',
    '02/15': 'شهادت امام جعفر صادق (ع)',
    '03/14': 'رحلت امام خمینی',
    '03/15': 'قیام ۱۵ خرداد',
    '03/28': 'عید سعید قربان',
    '04/05': 'عید سعید غدیر خم',
    '04/25': 'تاسوعای حسینی',
    '04/26': 'عاشورای حسینی',
    '05/04': 'اربعین حسینی',
    '05/12': 'رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)',
    '05/14': 'شهادت امام رضا (ع)',
    '05/22': 'شهادت امام حسن عسکری (ع)',
    '05/31': 'میلاد رسول اکرم (ص) و امام صادق (ع)',
    '09/15': 'شهادت حضرت فاطمه زهرا (س)',
    '10/25': 'ولادت امام علی (ع) و روز پدر',
    '11/09': 'مبعث رسول اکرم (ص)',
    '11/22': 'پیروزی انقلاب اسلامی',
    '11/26': 'ولادت حضرت قائم (عج) و نیمه شعبان',
    '12/29': 'روز ملی شدن صنعت نفت'
  },
  1404: {
    '01/01': 'عید نوروز',
    '01/02': 'عید نوروز',
    '01/03': 'عید نوروز',
    '01/04': 'عید نوروز',
    '01/11': 'عید سعید فطر',
    '01/12': 'تعطیلی عید فطر و روز جمهوری اسلامی',
    '01/13': 'روز طبیعت',
    '02/04': 'شهادت امام جعفر صادق (ع)',
    '03/14': 'رحلت امام خمینی',
    '03/15': 'قیام ۱۵ خرداد',
    '03/17': 'عید سعید قربان',
    '03/25': 'عید غدیر خم',
    '04/14': 'تاسوعای حسینی',
    '04/15': 'عاشورای حسینی',
    '05/24': 'اربعین حسینی',
    '05/28': 'تعطیل رسمی ۲۸ مرداد و عزاداری صفر',
    '05/31': 'رحلت پیامبر (ص) و شهادت امام حسن مجتبی (ع)',
    '06/02': 'شهادت امام رضا (ع)',
    '06/10': 'ولادت رسول اکرم (ص)',
    '09/04': 'شهادت حضرت فاطمه زهرا (س)',
    '10/14': 'ولادت امام علی (ع)',
    '10/28': 'مبعث پیامبر (ص)',
    '11/15': 'نیمه شعبان ولادت حضرت مهدی (عج)',
    '11/22': 'پیروزی انقلاب اسلامی',
    '12/20': 'شهادت حضرت علی (ع)',
    '12/29': 'روز ملی شدن صنعت نفت'
  },
  1405: {
    '01/01': 'عید نوروز',
    '01/02': 'عید نوروز',
    '01/03': 'عید نوروز',
    '01/04': 'عید نوروز',
    '01/12': 'روز جمهوری اسلامی',
    '01/13': 'روز طبیعت',
    '01/29': 'شهادت امام جعفر صادق (ع)',
    '03/06': 'عید سعید قربان',
    '03/14': 'رحلت امام خمینی و عید غدیر خم',
    '03/15': 'قیام ۱۵ خرداد',
    '04/04': 'تاسوعای حسینی',
    '04/05': 'عاشورای حسینی',
    '05/13': 'اربعین حسینی',
    '05/21': 'رحلت پیامبر اکرم (ص) و شهادت امام حسن مجتبی (ع)',
    '05/23': 'شهادت امام رضا (ع)',
    '05/30': 'ولادت پیامبر اکرم (ص)',
    '08/24': 'شهادت حضرت فاطمه زهرا (س)',
    '10/03': 'ولادت امام علی (ع)',
    '10/17': 'مبعث رسول اکرم (ص)',
    '11/04': 'ولادت حضرت مهدی (عج)',
    '11/22': 'پیروزی انقلاب اسلامی',
    '12/09': 'شهادت حضرت علی (ع)',
    '12/29': 'روز ملی شدن صنعت نفت'
  },
  1406: {
    '01/01': 'عید نوروز',
    '01/02': 'عید نوروز',
    '01/03': 'عید نوروز',
    '01/04': 'عید نوروز',
    '01/12': 'روز جمهوری اسلامی',
    '01/13': 'روز طبیعت',
    '03/14': 'رحلت امام خمینی',
    '03/15': 'قیام ۱۵ خرداد',
    '03/26': 'عید سعید قربان',
    '04/03': 'عید سعید غدیر خم',
    '04/23': 'تاسوعای حسینی',
    '04/24': 'عاشورای حسینی',
    '05/02': 'اربعین حسینی',
    '05/10': 'رحلت رسول اکرم (ص) و شهادت امام حسن مجتبی (ع)',
    '05/12': 'شهادت امام رضا (ع)',
    '05/19': 'میلاد حضرت رسول اکرم (ص)',
    '11/22': 'پیروزی انقلاب اسلامی',
    '12/29': 'روز ملی شدن صنعت نفت'
  }
};

/**
 * Returns holiday description if the given Persian date is an official Iranian holiday.
 */
export function getPersianHolidayTitle(year: number, month: number, day: number): string | null {
  const mdKey = `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
  
  // 1. Check specific year mapping
  if (YEARLY_PERSIAN_HOLIDAYS[year] && YEARLY_PERSIAN_HOLIDAYS[year][mdKey]) {
    return YEARLY_PERSIAN_HOLIDAYS[year][mdKey];
  }

  // 2. Check general recurring official holidays
  if (OFFICIAL_PERSIAN_HOLIDAYS[mdKey]) {
    return OFFICIAL_PERSIAN_HOLIDAYS[mdKey];
  }

  return null;
}

export interface CourseSessionDayInfo {
  date: string;
  weekdayName: string;
  monthName: string;
  isHoliday: boolean;
  holidayTitle?: string;
  isCustomSelected: boolean;
}

export interface MonthlySessionsBreakdown {
  monthKey: string; // e.g. "1405/05"
  monthName: string; // e.g. "مرداد ۱۴۰۵"
  totalSessions: number;
  sessionDates: CourseSessionDayInfo[];
  holidaysEncountered: { date: string; title: string }[];
}

/**
 * Parses Persian date string "1405/05/27" into { year, month, day }
 */
export function parsePersianDate(dateStr: string): { year: number; month: number; day: number } | null {
  if (!dateStr) return null;
  const normalized = normalizeDigits(dateStr).trim();
  const parts = normalized.split(/[\/\-]/).map(Number);
  if (parts.length < 3 || isNaN(parts[0]) || isNaN(parts[1]) || isNaN(parts[2])) {
    return null;
  }
  return { year: parts[0], month: parts[1], day: parts[2] };
}

/**
 * Compares two Persian dates: returns -1 if d1 < d2, 0 if equal, 1 if d1 > d2
 */
export function comparePersianDates(d1: string, d2: string): number {
  const p1 = parsePersianDate(d1);
  const p2 = parsePersianDate(d2);
  if (!p1 || !p2) return 0;
  if (p1.year !== p2.year) return p1.year - p2.year;
  if (p1.month !== p2.month) return p1.month - p2.month;
  return p1.day - p2.day;
}

/**
 * Formats year, month, day into "YYYY/MM/DD"
 */
export function formatJalaliString(year: number, month: number, day: number): string {
  return `${year}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`;
}

/**
 * Generates and analyzes all course sessions between startDate and endDate
 * considering selected weekdays, custom dates, and Iranian official holidays.
 */
export function calculateCourseSessionsTimeline(
  startDateStr: string,
  endDateStr: string,
  selectedWeekdays: string[] = ['شنبه', 'دوشنبه', 'چهارشنبه'],
  customDatesList?: string[]
): {
  totalSessions: number;
  totalHolidaysExcluded: number;
  monthlyBreakdown: MonthlySessionsBreakdown[];
  allSessionsList: CourseSessionDayInfo[];
} {
  const start = parsePersianDate(startDateStr) || parsePersianDate(getTodayPersianDate()) || { year: 1405, month: 1, day: 1 };
  const end = parsePersianDate(endDateStr) || { year: start.year, month: 12, day: 29 };

  // If custom dates list is explicitly provided and non-empty
  if (customDatesList && customDatesList.length > 0) {
    const sortedCustom = [...customDatesList].sort(comparePersianDates);
    const monthlyMap: Record<string, MonthlySessionsBreakdown> = {};
    const allSessionsList: CourseSessionDayInfo[] = [];
    let holidayCount = 0;

    sortedCustom.forEach(dateStr => {
      const p = parsePersianDate(dateStr);
      if (!p) return;
      const isFriday = isPersianFriday(p.year, p.month, p.day);
      const officialTitle = getPersianHolidayTitle(p.year, p.month, p.day);
      const isOfficialHoliday = !!officialTitle;
      const isHoliday = isFriday || isOfficialHoliday;
      const holidayTitle = isFriday ? 'جمعه (تعطیل رسمی)' : (officialTitle || 'تعطیل رسمی');
      const weekdayName = getPersianWeekdayName(p.year, p.month, p.day);
      const monthName = `${PERSIAN_MONTH_NAMES[p.month - 1]} ${p.year}`;
      const monthKey = `${p.year}/${String(p.month).padStart(2, '0')}`;

      if (isHoliday) holidayCount++;

      const item: CourseSessionDayInfo = {
        date: dateStr,
        weekdayName,
        monthName,
        isHoliday,
        holidayTitle: isHoliday ? holidayTitle : undefined,
        isCustomSelected: true
      };
      allSessionsList.push(item);

      if (!monthlyMap[monthKey]) {
        monthlyMap[monthKey] = {
          monthKey,
          monthName,
          totalSessions: 0,
          sessionDates: [],
          holidaysEncountered: []
        };
      }
      if (!isHoliday) {
        monthlyMap[monthKey].totalSessions++;
      }
      monthlyMap[monthKey].sessionDates.push(item);
      if (isHoliday && holidayTitle) {
        monthlyMap[monthKey].holidaysEncountered.push({ date: dateStr, title: holidayTitle });
      }
    });

    return {
      totalSessions: allSessionsList.filter(s => !s.isHoliday).length,
      totalHolidaysExcluded: holidayCount,
      monthlyBreakdown: Object.values(monthlyMap),
      allSessionsList
    };
  }

  // Iterate day by day from startDate to endDate
  const allSessionsList: CourseSessionDayInfo[] = [];
  const monthlyMap: Record<string, MonthlySessionsBreakdown> = {};
  let totalHolidaysExcluded = 0;

  // Loop across months and days
  let curY = start.year;
  let curM = start.month;
  let curD = start.day;

  while (curY < end.year || (curY === end.year && curM < end.month) || (curY === end.year && curM === end.month && curD <= end.day)) {
    const daysInCurrentMonth = getDaysInPersianMonth(curY, curM);
    
    const weekday = getPersianWeekdayName(curY, curM, curD);
    const dateFormatted = formatJalaliString(curY, curM, curD);
    const isFriday = isPersianFriday(curY, curM, curD);
    const officialHolidayTitle = getPersianHolidayTitle(curY, curM, curD);
    const isOfficialHoliday = !!officialHolidayTitle;
    const isHoliday = isFriday || isOfficialHoliday;
    const holidayTitle = isFriday ? 'جمعه (تعطیل هفتگی)' : (officialHolidayTitle || 'تعطیل رسمی');

    const monthKey = `${curY}/${String(curM).padStart(2, '0')}`;
    const monthName = `${PERSIAN_MONTH_NAMES[curM - 1]} ${curY}`;

    // Initialize month in map if not present
    if (!monthlyMap[monthKey]) {
      monthlyMap[monthKey] = {
        monthKey,
        monthName,
        totalSessions: 0,
        sessionDates: [],
        holidaysEncountered: []
      };
    }

    // Check if current weekday matches the requested pattern
    const isSelectedWeekday = selectedWeekdays.includes(weekday);

    if (isSelectedWeekday) {
      if (isHoliday) {
        totalHolidaysExcluded++;
        monthlyMap[monthKey].holidaysEncountered.push({
          date: dateFormatted,
          title: `${holidayTitle} (${weekday})`
        });
      } else {
        // Valid class session
        const sessionInfo: CourseSessionDayInfo = {
          date: dateFormatted,
          weekdayName: weekday,
          monthName,
          isHoliday: false,
          isCustomSelected: false
        };

        allSessionsList.push(sessionInfo);
        monthlyMap[monthKey].totalSessions++;
        monthlyMap[monthKey].sessionDates.push(sessionInfo);
      }
    }

    // Step to next day
    curD++;
    if (curD > daysInCurrentMonth) {
      curD = 1;
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    // Safety brake
    if (allSessionsList.length > 500) break;
  }

  return {
    totalSessions: allSessionsList.length,
    totalHolidaysExcluded,
    monthlyBreakdown: Object.values(monthlyMap),
    allSessionsList
  };
}

/**
 * Normalizes course title for duplicate checks (removes extra spaces, unifies Arabic/Persian letters)
 */
export function normalizeCourseTitle(title: string): string {
  if (!title) return '';
  return normalizeDigits(title)
    .trim()
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

/**
 * Generates an automated unique course code containing holding year and start date
 * e.g., for start date 1404/04/15 -> "1404-0415" (or "1404-0415-02" if collision occurs)
 */
export function generateCourseCode(
  startDateStr: string,
  existingCodes: (string | undefined)[] = [],
  currentCode?: string
): string {
  const normDate = normalizeDigits(startDateStr || getTodayPersianDate());
  const parts = normDate.split(/[\/\-]/);
  const year = parts[0] || '1404';
  const month = (parts[1] || '01').padStart(2, '0');
  const day = (parts[2] || '01').padStart(2, '0');

  const baseCode = `${year}-${month}${day}`;

  // If already matches current code, keep it
  if (currentCode && currentCode.startsWith(baseCode)) {
    return currentCode;
  }

  // Filter existing valid codes with the same base
  const existingSet = new Set(
    existingCodes
      .filter((c): c is string => Boolean(c && c !== currentCode))
      .map(c => c.trim().toUpperCase())
  );

  if (!existingSet.has(baseCode.toUpperCase())) {
    return baseCode;
  }

  // If collision, append an index: 1404-0415-02, 1404-0415-03, ...
  let index = 2;
  while (existingSet.has(`${baseCode}-${String(index).padStart(2, '0')}`.toUpperCase())) {
    index++;
  }

  return `${baseCode}-${String(index).padStart(2, '0')}`;
}
