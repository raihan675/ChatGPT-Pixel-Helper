/**
 * ChatGPT Pixel Helper & Inspector - Event Validation Engine
 * Validates payload parameters against schema rules, ISO 4217 standards,
 * and PII safety requirements without mutating data.
 */

import { PixelEvent, ValidationResult, ValidationFinding } from '../types';

const ISO_4217_CURRENCIES = new Set([
  'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'CHF', 'CNY', 'INR', 'BRL',
  'MXN', 'SEK', 'NOK', 'DKK', 'NZD', 'SGD', 'HKD', 'KRW', 'ZAR', 'PLN',
  'TRY', 'AED', 'SAR', 'CZK', 'ILS', 'THB', 'IDR', 'MYR', 'PHP', 'TWD'
]);

const RAW_EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const RAW_PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

export function validatePixelEvent(event: PixelEvent): ValidationResult {
  const findings: ValidationFinding[] = [];
  const p = event.normalizedPayload;
  const name = event.name.toLowerCase();

  // 1. Missing Pixel ID check
  if (!event.pixelId) {
    findings.push({
      severity: 'error',
      ruleId: 'REQ_PIXEL_ID',
      parameterPath: 'pid',
      receivedValue: event.pixelId,
      expectedValue: 'Valid OpenAI Pixel ID string',
      explanation: 'No Pixel ID (pid) was attached or detected for this event.',
      recommendedFix: "Ensure oaiq('init', 'YOUR_PIXEL_ID') is called before firing events."
    });
  }

  // 2. Event-specific validation
  if (name === 'purchase') {
    // Value check
    const val = p.value !== undefined ? p.value : p.val;
    if (val === undefined || val === null || val === '') {
      findings.push({
        severity: 'error',
        ruleId: 'PURCHASE_VALUE_MISSING',
        parameterPath: 'value',
        receivedValue: val,
        expectedValue: 'Numeric value > 0',
        explanation: 'The Purchase event is missing a conversion value.',
        recommendedFix: 'Pass a numeric value (e.g. { value: 49.99 }).'
      });
    } else {
      const numVal = Number(val);
      if (isNaN(numVal) || numVal < 0) {
        findings.push({
          severity: 'error',
          ruleId: 'PURCHASE_VALUE_INVALID',
          parameterPath: 'value',
          receivedValue: val,
          expectedValue: 'Non-negative number',
          explanation: `Received invalid monetary value: ${val}.`,
          recommendedFix: 'Format value as a clean number (e.g. 29.99), not a string with currency signs.'
        });
      }
    }

    // Currency check
    const cur = (p.currency || p.cur) as string | undefined;
    if (!cur) {
      findings.push({
        severity: 'error',
        ruleId: 'PURCHASE_CURRENCY_MISSING',
        parameterPath: 'currency',
        receivedValue: cur,
        expectedValue: 'ISO 4217 Currency code (e.g. USD, EUR)',
        explanation: 'The Purchase event is missing a 3-letter currency code.',
        recommendedFix: "Include { currency: 'USD' } in your event parameters."
      });
    } else if (typeof cur === 'string') {
      const upper = cur.toUpperCase();
      if (!ISO_4217_CURRENCIES.has(upper)) {
        findings.push({
          severity: 'warning',
          ruleId: 'CURRENCY_NON_STANDARD',
          parameterPath: 'currency',
          receivedValue: cur,
          expectedValue: 'Standard ISO 4217 3-letter code',
          explanation: `Currency code "${cur}" is not recognized as a standard ISO 4217 currency.`,
          recommendedFix: 'Use a recognized 3-letter currency code such as USD, EUR, GBP.'
        });
      }
    }
  }

  // 3. PII Detection (Emails, Phone numbers)
  function scanForPII(obj: Record<string, unknown>, pathPrefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;
      if (typeof value === 'string') {
        // Skip already hashed 64-char hex strings
        if (/^[a-f0-9]{64}$/i.test(value)) continue;

        if (RAW_EMAIL_REGEX.test(value)) {
          findings.push({
            severity: 'error',
            ruleId: 'PII_RAW_EMAIL',
            parameterPath: currentPath,
            receivedValue: '[REDACTED_EMAIL]',
            expectedValue: 'SHA-256 Hashed String or omitted',
            explanation: `Raw plain-text email detected in parameter "${currentPath}".`,
            recommendedFix: 'Hash customer emails with SHA-256 before transmitting, or omit them.'
          });
        }

        if (RAW_PHONE_REGEX.test(value) && value.length >= 7) {
          findings.push({
            severity: 'error',
            ruleId: 'PII_RAW_PHONE',
            parameterPath: currentPath,
            receivedValue: '[REDACTED_PHONE]',
            expectedValue: 'SHA-256 Hashed String or omitted',
            explanation: `Raw plain-text phone number detected in parameter "${currentPath}".`,
            recommendedFix: 'Hash phone numbers with SHA-256 before transmitting, or omit them.'
          });
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        scanForPII(value as Record<string, unknown>, currentPath);
      }
    }
  }

  scanForPII(p);

  // 4. Missing Attribution notice (Info)
  if (!event.attribution?.oppref && !p.oppref) {
    findings.push({
      severity: 'info',
      ruleId: 'ATTR_NO_OPPREF',
      parameterPath: 'oppref',
      receivedValue: null,
      expectedValue: 'OpenAI attribution token',
      explanation: 'No __oppref campaign parameter was attached to this event.',
      recommendedFix: 'Traffic originating from ChatGPT Ads will automatically attach __oppref.'
    });
  }

  const hasErrors = findings.some((f) => f.severity === 'error');
  const hasWarnings = findings.some((f) => f.severity === 'warning');

  let score = 100;
  if (hasErrors) score -= 40;
  if (hasWarnings) score -= 20;
  if (score < 0) score = 0;

  let status: ValidationResult['status'] = 'valid';
  if (hasErrors) status = 'error';
  else if (hasWarnings) status = 'warning';

  return {
    status,
    score,
    findings,
    hasErrors,
    hasWarnings
  };
}
