/**
 * OpenAI Pixel Inspector - Privacy & PII Inspection Engine
 * Inspects payloads for sensitive data (plain-text emails, phone numbers, cards, secrets)
 * and provides display sanitization without mutating raw payloads.
 */

export interface PrivacyFinding {
  severity: 'error' | 'warning';
  parameterPath: string;
  field: string;
  piiType: 'email' | 'phone' | 'card' | 'secret' | 'auth';
  reason: string;
  recommendedAction: string;
}

const RAW_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const RAW_PHONE_REGEX = /^(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
const CREDIT_CARD_REGEX = /^(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|6(?:011|5[0-9]{2})[0-9]{12})$/;
const SENSITIVE_KEY_NAMES = /^(?:password|secret|token|auth|authorization|bearer|cvv|cvc|ssn)$/i;

export class PrivacyEngine {
  /**
   * Sanitizes a string for safe user-interface rendering.
   */
  public static maskValue(val: unknown): string {
    if (typeof val !== 'string') return String(val);

    // Email masking: j***e@domain.com
    if (RAW_EMAIL_REGEX.test(val)) {
      const [user, domain] = val.split('@');
      const maskedUser = user.length > 2 ? `${user[0]}***${user[user.length - 1]}` : '***';
      return `${maskedUser}@${domain}`;
    }

    // Phone masking: +1 555-***-4567
    if (RAW_PHONE_REGEX.test(val)) {
      const cleaned = val.replace(/\s+/g, '');
      return cleaned.slice(0, -4).replace(/\d/g, '*') + cleaned.slice(-4);
    }

    // Credit card masking: ****-****-****-1234
    const digitOnly = val.replace(/[\s-]/g, '');
    if (CREDIT_CARD_REGEX.test(digitOnly)) {
      return `****-****-****-${digitOnly.slice(-4)}`;
    }

    return val;
  }

  /**
   * Scans an object recursively for privacy and PII vulnerabilities.
   */
  public static scanObject(
    obj: Record<string, unknown>,
    pathPrefix = '',
    findings: PrivacyFinding[] = []
  ): PrivacyFinding[] {
    if (!obj || typeof obj !== 'object') return findings;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = pathPrefix ? `${pathPrefix}.${key}` : key;

      // 1. Sensitive Key Name check
      if (SENSITIVE_KEY_NAMES.test(key)) {
        findings.push({
          severity: 'error',
          parameterPath: currentPath,
          field: key,
          piiType: 'secret',
          reason: `Key "${key}" appears to hold an unredacted secret, password, or security token.`,
          recommendedAction: 'Remove authentication secrets and passwords from client-side tracking payloads.'
        });
      }

      if (typeof value === 'string') {
        const trimmed = value.trim();

        // Skip valid 64-character SHA-256 hex hashes
        if (/^[a-f0-9]{64}$/i.test(trimmed)) continue;

        // Plain email check
        if (RAW_EMAIL_REGEX.test(trimmed)) {
          findings.push({
            severity: 'error',
            parameterPath: currentPath,
            field: key,
            piiType: 'email',
            reason: `Plain-text customer email detected in parameter "${currentPath}".`,
            recommendedAction: 'Normalize (trim/lowercase) and hash customer email with SHA-256 before transmission.'
          });
        }

        // Plain phone check
        if (RAW_PHONE_REGEX.test(trimmed) && trimmed.replace(/\D/g, '').length >= 10) {
          findings.push({
            severity: 'error',
            parameterPath: currentPath,
            field: key,
            piiType: 'phone',
            reason: `Plain-text customer phone number detected in parameter "${currentPath}".`,
            recommendedAction: 'Format phone numbers into international E.164 format and hash with SHA-256.'
          });
        }

        // Credit card check
        const digits = trimmed.replace(/[\s-]/g, '');
        if (CREDIT_CARD_REGEX.test(digits)) {
          findings.push({
            severity: 'error',
            parameterPath: currentPath,
            field: key,
            piiType: 'card',
            reason: `Payment card number pattern detected in parameter "${currentPath}".`,
            recommendedAction: 'Never transmit credit card or payment PAN data to analytics or advertising pixels.'
          });
        }
      } else if (value && typeof value === 'object' && !Array.isArray(value)) {
        this.scanObject(value as Record<string, unknown>, currentPath, findings);
      }
    }

    return findings;
  }
}
