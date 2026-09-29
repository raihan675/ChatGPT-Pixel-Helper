/**
 * OpenAI Pixel Knowledge Dictionary - Errors & Remedies
 * Standardized catalog of error and warning diagnostics adhering to Principle 4:
 * What is wrong, Why it matters, What was received, What was expected, and How to fix it.
 */

export interface ErrorDefinition {
  ruleId: string;
  severity: 'error' | 'warning' | 'info';
  title: string;
  whyItMatters: string;
  expectedDescription: string;
  recommendedFix: string;
}

export const ERROR_CATALOG: Record<string, ErrorDefinition> = {
  REQ_PIXEL_ID: {
    ruleId: 'REQ_PIXEL_ID',
    severity: 'error',
    title: 'Missing Pixel ID',
    whyItMatters: 'OpenAI Ads cannot associate conversions or attribution with your advertiser account without a valid Pixel ID.',
    expectedDescription: 'A valid alphanumeric Pixel ID (pid).',
    recommendedFix: "Call oaiq('init', 'YOUR_PIXEL_ID') in your site header before firing any events."
  },
  PURCHASE_VALUE_MISSING: {
    ruleId: 'PURCHASE_VALUE_MISSING',
    severity: 'error',
    title: 'Missing Conversion Value on Purchase',
    whyItMatters: 'Target ROAS bidding and revenue reporting require a numeric purchase amount.',
    expectedDescription: 'A positive numeric value (e.g. 99.99).',
    recommendedFix: "Include { value: orderTotal } in your Purchase event parameters."
  },
  PURCHASE_VALUE_INVALID: {
    ruleId: 'PURCHASE_VALUE_INVALID',
    severity: 'error',
    title: 'Invalid Monetary Value',
    whyItMatters: 'Values containing currency signs (like "$29.99") or negative numbers cause server ingestion failures.',
    expectedDescription: 'A clean number without symbols (e.g. 29.99).',
    recommendedFix: 'Strip currency symbols and parse string values using parseFloat(val.replace(/[^0-9.]/g, "")).'
  },
  PURCHASE_CURRENCY_MISSING: {
    ruleId: 'PURCHASE_CURRENCY_MISSING',
    severity: 'error',
    title: 'Missing Currency Code',
    whyItMatters: 'Monetary amounts cannot be converted or attributed across regions without an explicit currency.',
    expectedDescription: 'A 3-letter ISO 4217 uppercase currency code (e.g. USD, EUR, BDT).',
    recommendedFix: "Pass { currency: 'USD' } along with your event value."
  },
  CURRENCY_NON_STANDARD: {
    ruleId: 'CURRENCY_NON_STANDARD',
    severity: 'warning',
    title: 'Non-Standard Currency Code',
    whyItMatters: 'Unrecognized currency codes may trigger conversion attribution fallbacks or discrepancies.',
    expectedDescription: 'Standard ISO 4217 code (e.g. USD, EUR, GBP, BDT).',
    recommendedFix: 'Verify the currency code matches the official ISO 4217 standard.'
  },
  PII_RAW_EMAIL: {
    ruleId: 'PII_RAW_EMAIL',
    severity: 'error',
    title: 'Plain-Text Customer Email Detected',
    whyItMatters: 'Transmitting unhashed Personally Identifiable Information (PII) violates privacy regulations (GDPR/CCPA) and OpenAI policies.',
    expectedDescription: 'SHA-256 hashed lowercase string (64 hex characters) or omitted.',
    recommendedFix: 'Normalize and hash customer emails with SHA-256: crypto.subtle.digest("SHA-256", new TextEncoder().encode(email.trim().toLowerCase())).'
  },
  PII_RAW_PHONE: {
    ruleId: 'PII_RAW_PHONE',
    severity: 'error',
    title: 'Plain-Text Phone Number Detected',
    whyItMatters: 'Transmitting unhashed phone numbers violates user privacy policies and ad platform terms.',
    expectedDescription: 'SHA-256 hashed E.164 phone string or omitted.',
    recommendedFix: 'Format phone numbers in E.164 standard, then hash with SHA-256.'
  },
  ATTR_NO_OPPREF: {
    ruleId: 'ATTR_NO_OPPREF',
    severity: 'info',
    title: 'No OpenAI Campaign Token (__oppref)',
    whyItMatters: 'Conversions fired without __oppref are treated as organic or direct visits rather than attributed ad conversions.',
    expectedDescription: 'The __oppref query parameter from incoming ChatGPT ad click URLs.',
    recommendedFix: 'Ensure your landing page URLs preserve query parameters and forward them across redirects.'
  },
  DUPLICATE_EVENT_DETECTED: {
    ruleId: 'DUPLICATE_EVENT_DETECTED',
    severity: 'warning',
    title: 'Duplicate Event Fired Within Short Window',
    whyItMatters: 'Firing the identical event multiple times artificially inflates conversion metrics and double-charges campaigns.',
    expectedDescription: 'A single event execution per user action or unique deduplication event_id.',
    recommendedFix: 'Add debouncing or assign a unique event_id to both client and server events for deduplication.'
  },
  NETWORK_BLOCKED_BY_CLIENT: {
    ruleId: 'NETWORK_BLOCKED_BY_CLIENT',
    severity: 'error',
    title: 'Request Blocked by Client (Adblocker / Privacy Extension)',
    whyItMatters: 'The browser extension or adblocker prevented the network request from ever reaching OpenAI servers.',
    expectedDescription: 'HTTP 200/202 network response.',
    recommendedFix: 'Disable ad blockers on test domains or deploy server-side tracking (Conversions API) to ensure delivery.'
  }
};

export function lookupError(ruleId: string): ErrorDefinition | null {
  return ERROR_CATALOG[ruleId] || null;
}
