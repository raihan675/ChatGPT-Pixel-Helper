/**
 * ISO 4217 Currency Metadata & Minor Unit Computation
 * Provides precision specifications, minor-unit conversions, and mismatch detection.
 */

export interface CurrencyMetadata {
  code: string;
  name: string;
  decimals: number;
  symbol: string;
}

export const CURRENCY_REGISTRY: Record<string, CurrencyMetadata> = {
  // Zero-decimal currencies
  JPY: { code: 'JPY', name: 'Japanese Yen', decimals: 0, symbol: '¥' },
  KRW: { code: 'KRW', name: 'South Korean Won', decimals: 0, symbol: '₩' },
  VND: { code: 'VND', name: 'Vietnamese Dong', decimals: 0, symbol: '₫' },
  CLP: { code: 'CLP', name: 'Chilean Peso', decimals: 0, symbol: '$' },
  PYG: { code: 'PYG', name: 'Paraguayan Guarani', decimals: 0, symbol: '₲' },
  UGX: { code: 'UGX', name: 'Ugandan Shilling', decimals: 0, symbol: 'USh' },
  RWF: { code: 'RWF', name: 'Rwandan Franc', decimals: 0, symbol: 'FRw' },

  // Three-decimal currencies
  BHD: { code: 'BHD', name: 'Bahraini Dinar', decimals: 3, symbol: '.د.ب' },
  JOD: { code: 'JOD', name: 'Jordanian Dinar', decimals: 3, symbol: 'د.ا' },
  KWD: { code: 'KWD', name: 'Kuwaiti Dinar', decimals: 3, symbol: 'د.ك' },
  OMR: { code: 'OMR', name: 'Omani Rial', decimals: 3, symbol: 'ر.ع.' },
  TND: { code: 'TND', name: 'Tunisian Dinar', decimals: 3, symbol: 'د.ت' },

  // Standard Two-decimal currencies
  USD: { code: 'USD', name: 'United States Dollar', decimals: 2, symbol: '$' },
  EUR: { code: 'EUR', name: 'Euro', decimals: 2, symbol: '€' },
  GBP: { code: 'GBP', name: 'British Pound', decimals: 2, symbol: '£' },
  CAD: { code: 'CAD', name: 'Canadian Dollar', decimals: 2, symbol: 'CA$' },
  AUD: { code: 'AUD', name: 'Australian Dollar', decimals: 2, symbol: 'A$' },
  BDT: { code: 'BDT', name: 'Bangladeshi Taka', decimals: 2, symbol: '৳' },
  INR: { code: 'INR', name: 'Indian Rupee', decimals: 2, symbol: '₹' },
  BRL: { code: 'BRL', name: 'Brazilian Real', decimals: 2, symbol: 'R$' },
  MXN: { code: 'MXN', name: 'Mexican Peso', decimals: 2, symbol: 'MX$' },
  SEK: { code: 'SEK', name: 'Swedish Krona', decimals: 2, symbol: 'kr' },
  NOK: { code: 'NOK', name: 'Norwegian Krone', decimals: 2, symbol: 'kr' },
  DKK: { code: 'DKK', name: 'Danish Krone', decimals: 2, symbol: 'kr' },
  NZD: { code: 'NZD', name: 'New Zealand Dollar', decimals: 2, symbol: 'NZ$' },
  SGD: { code: 'SGD', name: 'Singapore Dollar', decimals: 2, symbol: 'S$' },
  HKD: { code: 'HKD', name: 'Hong Kong Dollar', decimals: 2, symbol: 'HK$' },
  CHF: { code: 'CHF', name: 'Swiss Franc', decimals: 2, symbol: 'CHF' },
  CNY: { code: 'CNY', name: 'Chinese Yuan', decimals: 2, symbol: '¥' },
  ZAR: { code: 'ZAR', name: 'South African Rand', decimals: 2, symbol: 'R' },
  AED: { code: 'AED', name: 'United Arab Emirates Dirham', decimals: 2, symbol: 'د.إ' },
  SAR: { code: 'SAR', name: 'Saudi Riyal', decimals: 2, symbol: '﷼' },
  PLN: { code: 'PLN', name: 'Polish Zloty', decimals: 2, symbol: 'zł' },
  TRY: { code: 'TRY', name: 'Turkish Lira', decimals: 2, symbol: '₺' },
  THB: { code: 'THB', name: 'Thai Baht', decimals: 2, symbol: '฿' },
  MYR: { code: 'MYR', name: 'Malaysian Ringgit', decimals: 2, symbol: 'RM' },
  PHP: { code: 'PHP', name: 'Philippine Peso', decimals: 2, symbol: '₱' },
  IDR: { code: 'IDR', name: 'Indonesian Rupiah', decimals: 2, symbol: 'Rp' }
};

export function getCurrency(code: string): CurrencyMetadata | null {
  if (!code || typeof code !== 'string') return null;
  return CURRENCY_REGISTRY[code.toUpperCase()] || null;
}

export function majorToMinor(amount: number, currencyCode: string): number {
  const meta = getCurrency(currencyCode);
  const decimals = meta ? meta.decimals : 2;
  const factor = Math.pow(10, decimals);
  return Math.round(amount * factor);
}

export function minorToMajor(minorAmount: number, currencyCode: string): number {
  const meta = getCurrency(currencyCode);
  const decimals = meta ? meta.decimals : 2;
  const factor = Math.pow(10, decimals);
  return minorAmount / factor;
}

export interface AmountValidationResult {
  isValid: boolean;
  warning?: string;
  suggestedMinorUnit?: number;
  decimalsExpected: number;
}

/**
 * Checks for common minor vs major unit discrepancies:
 * e.g., if a server expects cents (12999) but receives 129.99 as a float,
 * or if a zero-decimal currency (like JPY) receives fractional cents.
 */
export function checkMonetaryFormat(
  amount: unknown,
  currencyCode: string
): AmountValidationResult {
  const meta = getCurrency(currencyCode);
  const decimalsExpected = meta ? meta.decimals : 2;

  if (typeof amount !== 'number') {
    const num = Number(amount);
    if (isNaN(num)) {
      return {
        isValid: false,
        warning: `Amount "${amount}" cannot be parsed as a valid numeric amount.`,
        decimalsExpected
      };
    }
    amount = num;
  }

  const numericAmount = amount as number;

  // Zero-decimal check: JPY, KRW shouldn't have decimal points
  if (decimalsExpected === 0) {
    if (!Number.isInteger(numericAmount)) {
      return {
        isValid: false,
        warning: `Currency ${currencyCode} is a zero-decimal currency and must be a whole integer. Received ${numericAmount}.`,
        suggestedMinorUnit: Math.round(numericAmount),
        decimalsExpected
      };
    }
  }

  // Fractional detection for systems that specify amounts in integer minor-units
  // If amount is a float like 49.99, suggest 4999 minor-units
  if (!Number.isInteger(numericAmount)) {
    return {
      isValid: true,
      warning: `Amount is formatted as a major unit float (${numericAmount}). If your server integration expects integer minor units (cents), consider ${majorToMinor(numericAmount, currencyCode)}.`,
      suggestedMinorUnit: majorToMinor(numericAmount, currencyCode),
      decimalsExpected
    };
  }

  return { isValid: true, decimalsExpected };
}
