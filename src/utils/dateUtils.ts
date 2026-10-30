/**
 * Date Parsing & Normalization Utilities
 * Formats dates from diverse Excel / Google Sheet inputs (ISO, DD/MM/YYYY, MM/DD/YYYY, Excel serial, text)
 * into standard YYYY-MM-DD format for input[type="date"] and application consistency.
 */

/**
 * Converts an Excel serial date number (e.g. 46322) to a YYYY-MM-DD string.
 * Excel serial numbers count days since December 30, 1899 (accounting for the 1900 leap year bug).
 */
export function excelSerialToDateString(serial: number): string {
  if (isNaN(serial) || serial <= 0) {
    return new Date().toISOString().split('T')[0];
  }
  // Days between 1899-12-30 and 1970-01-01 is 25569 days
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const dateInfo = new Date(utcValue);
  
  const year = dateInfo.getUTCFullYear();
  const month = String(dateInfo.getUTCMonth() + 1).padStart(2, '0');
  const day = String(dateInfo.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses and normalizes any date representation from Excel / Google Sheets
 * into standard 'YYYY-MM-DD'.
 */
export function normalizeSheetDate(raw: any, fallbackDate: string = new Date().toISOString().split('T')[0]): string {
  if (raw === null || raw === undefined) return fallbackDate;
  
  // If it's already a number or numeric string representing an Excel serial number
  if (typeof raw === 'number' && raw > 30000 && raw < 80000) {
    return excelSerialToDateString(raw);
  }

  const str = String(raw).trim();
  if (!str) return fallbackDate;

  // Check if string is purely numeric (Excel serial number as string)
  if (/^\d{5}(\.\d+)?$/.test(str)) {
    const num = parseFloat(str);
    if (!isNaN(num) && num > 30000 && num < 80000) {
      return excelSerialToDateString(num);
    }
  }

  // Standard ISO format: YYYY-MM-DD (e.g. 2026-10-27)
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // DD/MM/YYYY or DD-MM-YYYY (e.g. 27/10/2026 or 27-10-2026)
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (ddmmyyyyMatch) {
    const day = String(parseInt(ddmmyyyyMatch[1], 10)).padStart(2, '0');
    const month = String(parseInt(ddmmyyyyMatch[2], 10)).padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Try standard Date.parse
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    // Safety check for sensible year range
    if (year >= 1970 && year <= 2100) {
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return fallbackDate;
}

/**
 * Formats a YYYY-MM-DD string for display in Sri Lankan / British standard (e.g. "27 Oct 2026").
 */
export function formatDisplayDate(dateStr: string, lang: 'en' | 'si' = 'en'): string {
  if (!dateStr) return '';
  try {
    const [y, m, d] = dateStr.split('-');
    if (!y || !m || !d) return dateStr;
    const date = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
    if (isNaN(date.getTime())) return dateStr;

    if (lang === 'si') {
      return `${y}-${m}-${d}`;
    }

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}
