/**
 * OpenAI Pixel Inspector - Batch Processing & Normalization Engine
 * Handles batch unrolling, nested parameter flattening with array indexing,
 * and preservation of raw payloads without mutation.
 */

export interface FlattenedParameters {
  flat: Record<string, unknown>;
  original: Record<string, unknown>;
}

/**
 * Flattens nested objects and arrays into indexed dot-notation paths:
 * e.g., { contents: [{ id: 'sku_1', price: 29.99 }] }
 * becomes:
 * { 'contents[0].id': 'sku_1', 'contents[0].price': 29.99 }
 */
export function flattenObject(
  obj: unknown,
  prefix = '',
  result: Record<string, unknown> = {}
): Record<string, unknown> {
  if (obj === null || obj === undefined) {
    if (prefix) result[prefix] = obj;
    return result;
  }

  if (typeof obj !== 'object') {
    result[prefix] = obj;
    return result;
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0 && prefix) {
      result[prefix] = [];
    } else {
      obj.forEach((item, index) => {
        const nextPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
        flattenObject(item, nextPrefix, result);
      });
    }
    return result;
  }

  const entries = Object.entries(obj as Record<string, unknown>);
  if (entries.length === 0 && prefix) {
    result[prefix] = {};
    return result;
  }

  for (const [key, val] of entries) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenObject(val, nextPrefix, result);
  }

  return result;
}

/**
 * Detects whether a payload contains batched events and unrolls them into an array of distinct event objects.
 */
export function unrollBatchPayload(payload: unknown): Array<Record<string, unknown>> {
  if (!payload) return [];

  // If payload itself is an array of event objects
  if (Array.isArray(payload)) {
    return payload.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
  }

  if (typeof payload === 'object') {
    const p = payload as Record<string, unknown>;

    // Case: { events: [...] }
    if (Array.isArray(p.events)) {
      return p.events.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
    }

    // Case: { batch: [...] }
    if (Array.isArray(p.batch)) {
      return p.batch.filter((item) => item && typeof item === 'object') as Array<Record<string, unknown>>;
    }

    // Single event payload
    return [p];
  }

  return [];
}

/**
 * Normalizes query string parameters, un-escaping keys and values.
 */
export function normalizeQueryParams(url: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!url) return result;

  try {
    const u = new URL(url, 'https://localhost');
    u.searchParams.forEach((val, key) => {
      result[key] = val;
    });
  } catch {
    // Fallback split
    const queryIdx = url.indexOf('?');
    if (queryIdx >= 0) {
      const qs = url.substring(queryIdx + 1);
      const pairs = qs.split('&');
      for (const pair of pairs) {
        const [k, ...v] = pair.split('=');
        if (k) {
          result[decodeURIComponent(k)] = decodeURIComponent(v.join('='));
        }
      }
    }
  }

  return result;
}
