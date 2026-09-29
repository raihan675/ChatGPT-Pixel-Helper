/**
 * ChatGPT Pixel Helper & Inspector - Event Parser & Categorizer
 * Extracts, decodes, and categorizes raw network payloads and oaiq SDK calls
 * into organized, inspectable parameter groups (Categories A, B, C, D).
 */

import { PixelEvent, CaptureSource, ValidationResult } from '../types';

export interface CategorizedParameters {
  categoryA_pixel: Record<string, { value: unknown; label: string; description: string }>;
  categoryB_event: Record<string, { value: unknown; label: string; description: string }>;
  categoryC_technical: Record<string, { value: unknown; label: string; description: string }>;
  categoryD_attribution: Record<string, { value: unknown; label: string; description: string }>;
  custom: Record<string, unknown>;
}

export function parseQueryString(queryString: string): Record<string, string> {
  const params: Record<string, string> = {};
  if (!queryString) return params;

  const clean = queryString.startsWith('?') ? queryString.slice(1) : queryString;
  const pairs = clean.split('&');
  for (const pair of pairs) {
    if (!pair) continue;
    const [rawKey, ...rest] = pair.split('=');
    const key = decodeURIComponent(rawKey || '');
    const val = decodeURIComponent(rest.join('=') || '');
    if (key) params[key] = val;
  }
  return params;
}

export function categorizeParameters(
  queryParams: Record<string, string>,
  bodyParams: Record<string, unknown>
): CategorizedParameters {
  const merged: Record<string, unknown> = { ...queryParams, ...bodyParams };

  const result: CategorizedParameters = {
    categoryA_pixel: {},
    categoryB_event: {},
    categoryC_technical: {},
    categoryD_attribution: {},
    custom: {}
  };

  // Known metadata maps
  const CAT_A_KEYS: Record<string, { label: string; desc: string }> = {
    pid: { label: 'Pixel ID', desc: 'Identifies the OpenAI Pixel / data source' },
    pixelId: { label: 'Pixel ID', desc: 'Identifies the OpenAI Pixel / data source' },
    st: { label: 'SDK Type', desc: 'SDK / transport type (e.g. oaiq-web)' },
    sdkType: { label: 'SDK Type', desc: 'SDK transport type' },
    sv: { label: 'SDK Version', desc: 'OpenAI Web SDK version' },
    sdkVersion: { label: 'SDK Version', desc: 'SDK version' },
    ec: { label: 'Event Count', desc: 'Number of events batched in this request' },
    eventCount: { label: 'Event Count', desc: 'Number of events in request' }
  };

  const CAT_B_KEYS: Record<string, { label: string; desc: string }> = {
    ev: { label: 'Event Name', desc: 'Standard or custom event name' },
    event: { label: 'Event Name', desc: 'Standard or custom event name' },
    name: { label: 'Event Name', desc: 'Name of the fired event' },
    eid: { label: 'Event ID', desc: 'Unique event identifier for deduplication' },
    event_id: { label: 'Event ID', desc: 'Deduplication event identifier' },
    value: { label: 'Value', desc: 'Monetary conversion value' },
    currency: { label: 'Currency', desc: 'ISO 4217 3-letter currency code' },
    content_name: { label: 'Content Name', desc: 'Item / product name' },
    content_category: { label: 'Content Category', desc: 'Product category' },
    content_ids: { label: 'Content IDs', desc: 'Array or list of product identifiers' },
    contents: { label: 'Contents', desc: 'Itemized product details' },
    num_items: { label: 'Number of Items', desc: 'Quantity of items purchased or viewed' },
    order_id: { label: 'Order ID', desc: 'Transaction identifier' },
    transaction_id: { label: 'Transaction ID', desc: 'Unique transaction identifier' }
  };

  const CAT_C_KEYS: Record<string, { label: string; desc: string }> = {
    dl: { label: 'Document Location', desc: 'Active page URL where event fired' },
    pageUrl: { label: 'Page URL', desc: 'Active page URL' },
    url: { label: 'Page URL', desc: 'Active page URL' },
    ref: { label: 'Referrer URL', desc: 'HTTP document referrer' },
    referrer: { label: 'Referrer URL', desc: 'Document referrer' },
    ts: { label: 'Timestamp', desc: 'Client epoch timestamp (ms)' },
    timestamp: { label: 'Timestamp', desc: 'Client epoch timestamp' },
    sr: { label: 'Screen Resolution', desc: 'Device screen width x height' },
    vp: { label: 'Viewport Size', desc: 'Browser viewport dimensions' },
    dt: { label: 'Document Title', desc: 'HTML document title' },
    title: { label: 'Document Title', desc: 'Page title' }
  };

  const CAT_D_KEYS: Record<string, { label: string; desc: string }> = {
    oppref: { label: 'Attribution Token', desc: 'OpenAI campaign attribution token (__oppref)' },
    _oaiq: { label: 'Visitor Cookie', desc: 'OpenAI first-party visitor identifier' },
    em: { label: 'Hashed Email', desc: 'SHA-256 hashed customer email' },
    ph: { label: 'Hashed Phone', desc: 'SHA-256 hashed customer phone number' }
  };

  for (const [k, v] of Object.entries(merged)) {
    if (CAT_A_KEYS[k]) {
      result.categoryA_pixel[k] = { value: v, label: CAT_A_KEYS[k].label, description: CAT_A_KEYS[k].desc };
    } else if (CAT_B_KEYS[k]) {
      result.categoryB_event[k] = { value: v, label: CAT_B_KEYS[k].label, description: CAT_B_KEYS[k].desc };
    } else if (CAT_C_KEYS[k]) {
      result.categoryC_technical[k] = { value: v, label: CAT_C_KEYS[k].label, description: CAT_C_KEYS[k].desc };
    } else if (CAT_D_KEYS[k]) {
      result.categoryD_attribution[k] = { value: v, label: CAT_D_KEYS[k].label, description: CAT_D_KEYS[k].desc };
    } else {
      result.custom[k] = v;
    }
  }

  return result;
}

export function extractEventName(params: Record<string, unknown>): string {
  const candidate = params.ev || params.event || params.name || params.eventName;
  if (typeof candidate === 'string' && candidate.trim()) {
    return candidate.trim();
  }
  return 'UnknownEvent';
}

export function determineCategory(
  eventName: string
): 'behavioral' | 'ecommerce' | 'leadgen' | 'subscription' | 'custom' | 'diagnostic' | 'system' {
  const lower = eventName.toLowerCase();
  const ecom = ['purchase', 'addtocart', 'add_to_cart', 'initiatecheckout', 'initiate_checkout', 'viewcontent', 'view_content'];
  const lead = ['lead', 'contact', 'submited_form', 'form_submit', 'completeregistration', 'complete_registration', 'signup'];
  const sub = ['subscribe', 'starttrial', 'start_trial'];
  const behav = ['pageview', 'page_view', 'scroll', 'click', 'search'];

  if (ecom.includes(lower)) return 'ecommerce';
  if (lead.includes(lower)) return 'leadgen';
  if (sub.includes(lower)) return 'subscription';
  if (behav.includes(lower)) return 'behavioral';
  return 'custom';
}

export function parseRawToPixelEvent(options: {
  url?: string;
  payload?: unknown;
  captureSource: CaptureSource;
  pixelId?: string | null;
  eventName?: string;
  pageUrl?: string;
  oppref?: string | null;
  httpStatus?: number;
}): PixelEvent {
  const queryParams: Record<string, string> = {};
  if (options.url) {
    try {
      const u = new URL(options.url, 'http://localhost');
      u.searchParams.forEach((v, k) => {
        queryParams[k] = v;
      });
    } catch {}
  }

  let bodyParams: Record<string, unknown> = {};
  if (options.payload && typeof options.payload === 'object') {
    bodyParams = options.payload as Record<string, unknown>;
  }

  const merged = { ...queryParams, ...bodyParams };
  const name = options.eventName || extractEventName(merged);
  const pid = options.pixelId || (merged.pid as string) || (merged.pixelId as string) || null;
  const eid = (merged.eid as string) || (merged.event_id as string) || null;
  const oppref = options.oppref || (merged.oppref as string) || null;

  const now = Date.now();
  const internalId = `evt_${Math.random().toString(36).substring(2, 9)}_${now.toString(36)}`;

  const defaultValidation: ValidationResult = {
    status: 'valid',
    score: 100,
    findings: [],
    hasErrors: false,
    hasWarnings: false
  };

  return {
    internalId,
    actualEventId: eid,
    name,
    displayName: name.replace(/([A-Z])/g, ' $1').trim(),
    category: determineCategory(name),
    timestamp: now,
    timestampFormatted: new Date(now).toLocaleTimeString(),
    pageUrl: options.pageUrl || (merged.dl as string) || options.url || '',
    referrer: (merged.ref as string) || null,
    pixelId: pid,
    rawPayload: options.payload || options.url,
    normalizedPayload: merged,
    queryParameters: queryParams,
    parameters: bodyParams,
    captureSource: options.captureSource,
    httpStatus: options.httpStatus,
    networkStatus: options.httpStatus && options.httpStatus < 400 ? 'accepted' : 'fired',
    validation: defaultValidation,
    attribution: {
      oppref,
      source: oppref ? 'url' : null
    }
  };
}
