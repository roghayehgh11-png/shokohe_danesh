/**
 * Utility functions for smart email normalization, auto-correction, and validation.
 * Automatically fixes common typing mistakes, Persian/Arabic numerals, spaces, and typos in domains.
 */

// Mapping of common domain typos to correct domains
const COMMON_DOMAIN_TYPOS: Record<string, string> = {
  // Gmail typos
  'gmai.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.ir': 'gmail.com',
  'gemail.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaik.com': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gimail.com': 'gmail.com',

  // Yahoo typos
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yaho.con': 'yahoo.com',
  'yaho.co': 'yahoo.com',
  'yaho.ir': 'yahoo.com',
  'yahou.com': 'yahoo.com',
  'yaho.cm': 'yahoo.com',

  // Hotmail typos
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'hotmali.com': 'hotmail.com',
  'hotmiel.com': 'hotmail.com',

  // Outlook typos
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlock.com': 'outlook.com',
  'outluk.com': 'outlook.com',

  // iCloud typos
  'iclod.com': 'icloud.com',
  'icloude.com': 'icloud.com'
};

export interface CleanedEmailResult {
  original: string;
  normalized: string;
  isValid: boolean;
  wasCorrected: boolean;
  correctionReason?: string;
}

/**
 * Converts Persian and Arabic numerals and special characters to standard English.
 */
export function convertPersianArabicDigits(str: string): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

  let result = str;
  for (let i = 0; i < 10; i++) {
    result = result.replace(new RegExp(persianDigits[i], 'g'), String(i));
    result = result.replace(new RegExp(arabicDigits[i], 'g'), String(i));
  }
  return result;
}

/**
 * Automatically cleans, normalizes and corrects typos in user-entered email addresses.
 */
export function cleanAndNormalizeEmail(input: string): CleanedEmailResult {
  const raw = (input || '').trim();
  if (!raw) {
    return {
      original: '',
      normalized: '',
      isValid: false,
      wasCorrected: false
    };
  }

  // 1. Remove mailto: prefix, brackets, quotes
  let cleaned = raw
    .replace(/^mailto:/i, '')
    .replace(/^<+|>+$/g, '')
    .replace(/^"+|"+$/g, '')
    .replace(/^'+|'+$/g, '')
    .replace(/^\(+|\)+$/g, '');

  // 2. Convert Persian/Arabic numbers to English
  cleaned = convertPersianArabicDigits(cleaned);

  // 3. Remove all whitespace inside the email (users often accidentally enter spaces)
  cleaned = cleaned.replace(/\s+/g, '');

  // 4. Replace Persian comma (،) or standard comma (,) with dot (.)
  cleaned = cleaned.replace(/،/g, '.').replace(/,/g, '.');

  // 5. Replace multiple dots with a single dot
  cleaned = cleaned.replace(/\.{2,}/g, '.');

  // 6. Handle cases where user typed space or dot instead of @ before domain
  // e.g. "user.gmail.com" where domain is known
  if (!cleaned.includes('@')) {
    const knownDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    for (const d of knownDomains) {
      if (cleaned.endsWith(d)) {
        const prefix = cleaned.slice(0, -d.length).replace(/[._-]+$/, '');
        if (prefix) {
          cleaned = `${prefix}@${d}`;
          break;
        }
      }
    }
  }

  // 7. Check if we have an @ symbol now
  const atParts = cleaned.split('@');
  let correctionReason: string | undefined = undefined;
  let wasCorrected = false;

  if (atParts.length === 2) {
    const userPart = atParts[0].trim();
    let domainPart = atParts[1].toLowerCase().trim();

    // Check for domain typos
    if (COMMON_DOMAIN_TYPOS[domainPart]) {
      const fixedDomain = COMMON_DOMAIN_TYPOS[domainPart];
      correctionReason = `اصلاح خودکار دامنه از ${domainPart} به ${fixedDomain}`;
      domainPart = fixedDomain;
      wasCorrected = true;
    }

    // Remove any trailing dot from domain
    if (domainPart.endsWith('.')) {
      domainPart = domainPart.slice(0, -1);
      wasCorrected = true;
    }

    cleaned = `${userPart}@${domainPart}`;
  }

  // Check if modified compared to original trimmed input
  if (cleaned !== raw) {
    wasCorrected = true;
    if (!correctionReason) {
      correctionReason = 'اصلاح خودکار فاصله‌ها و کاراکترهای نگارشی';
    }
  }

  // 8. Validate with robust email regular expression
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  const isValid = emailRegex.test(cleaned);

  return {
    original: raw,
    normalized: cleaned,
    isValid,
    wasCorrected,
    correctionReason
  };
}
