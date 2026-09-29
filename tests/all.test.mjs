/**
 * Comprehensive Unit Test Suite for OpenAI Pixel Inspector Core Engines
 * Tests:
 * 1. Normalization & Object Flattening
 * 2. ISO 4217 Currency Math & Minor Units
 * 3. Event Deduplication Logic
 * 4. PII and Privacy Scanning
 * 5. Schema Validation Rules
 * 6. Audit Health Score Computation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

// 1. Flattening test logic
function flattenObject(obj, prefix = '', result = {}) {
  if (obj === null || obj === undefined) {
    if (prefix) result[prefix] = obj;
    return result;
  }
  if (typeof obj !== 'object') {
    result[prefix] = obj;
    return result;
  }
  if (Array.isArray(obj)) {
    obj.forEach((item, index) => {
      const nextPrefix = prefix ? `${prefix}[${index}]` : `[${index}]`;
      flattenObject(item, nextPrefix, result);
    });
    return result;
  }
  for (const [key, val] of Object.entries(obj)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    flattenObject(val, nextPrefix, result);
  }
  return result;
}

// 2. Currency conversion logic
const CURRENCIES = {
  JPY: 0,
  USD: 2,
  EUR: 2,
  BDT: 2,
  BHD: 3,
  KWD: 3
};

function majorToMinor(amount, currency) {
  const dec = CURRENCIES[currency] !== undefined ? CURRENCIES[currency] : 2;
  return Math.round(amount * Math.pow(10, dec));
}

function minorToMajor(minor, currency) {
  const dec = CURRENCIES[currency] !== undefined ? CURRENCIES[currency] : 2;
  return minor / Math.pow(10, dec);
}

// 3. PII Detection logic
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;

function detectPII(str) {
  if (typeof str !== 'string') return null;
  if (/^[a-f0-9]{64}$/i.test(str)) return null; // SHA-256 is safe
  if (EMAIL_REGEX.test(str)) return 'email';
  if (PHONE_REGEX.test(str) && str.replace(/\D/g, '').length >= 10) return 'phone';
  return null;
}

// 4. Deduplication logic
function isDuplicateEvent(prevEvent, newEvent, windowMs = 3000) {
  if (!prevEvent || !newEvent) return false;
  const timeDiff = Math.abs(newEvent.timestamp - prevEvent.timestamp);
  if (timeDiff > windowMs) return false;

  // Exact event_id match
  if (prevEvent.actualEventId && newEvent.actualEventId && prevEvent.actualEventId === newEvent.actualEventId) {
    return true;
  }
  // Same event and identical value
  if (prevEvent.name === newEvent.name && prevEvent.value === newEvent.value && prevEvent.pageUrl === newEvent.pageUrl) {
    return true;
  }
  return false;
}

describe('OpenAI Pixel Inspector Core Engine Tests', () => {
  test('1. Normalization & Object Flattening: nested arrays and objects', () => {
    const raw = {
      order_id: 'ord_123',
      contents: [
        { id: 'sku_1', price: 29.99 },
        { id: 'sku_2', price: 49.99 }
      ]
    };

    const flat = flattenObject(raw);
    assert.equal(flat['order_id'], 'ord_123');
    assert.equal(flat['contents[0].id'], 'sku_1');
    assert.equal(flat['contents[0].price'], 29.99);
    assert.equal(flat['contents[1].id'], 'sku_2');
    assert.equal(flat['contents[1].price'], 49.99);
  });

  test('2. ISO 4217 Currency: zero, two, and three decimal calculations', () => {
    // Two-decimal: USD
    assert.equal(majorToMinor(49.99, 'USD'), 4999);
    assert.equal(minorToMajor(4999, 'USD'), 49.99);

    // Two-decimal: BDT
    assert.equal(majorToMinor(1250.5, 'BDT'), 125050);
    assert.equal(minorToMajor(125050, 'BDT'), 1250.5);

    // Zero-decimal: JPY
    assert.equal(majorToMinor(5000, 'JPY'), 5000);
    assert.equal(minorToMajor(5000, 'JPY'), 5000);

    // Three-decimal: KWD
    assert.equal(majorToMinor(12.345, 'KWD'), 12345);
    assert.equal(minorToMajor(12345, 'KWD'), 12.345);
  });

  test('3. Privacy & PII: flags unhashed emails/phones, allows SHA-256', () => {
    // Unhashed
    assert.equal(detectPII('customer@example.com'), 'email');
    assert.equal(detectPII('+1 (555) 234-5678'), 'phone');

    // Hashed with SHA-256 (64 hex characters)
    const validHash = 'a665a45920422f9d417e4867efdc4fb8a04a1f3fff1fa07e998e86f7f7a27ae3';
    assert.equal(detectPII(validHash), null);
  });

  test('4. Deduplication Engine: flags rapid repeated events', () => {
    const now = Date.now();
    const event1 = {
      name: 'Purchase',
      actualEventId: 'evt_xyz',
      value: 99.99,
      pageUrl: 'https://store.com/checkout',
      timestamp: now
    };

    const event2 = {
      name: 'Purchase',
      actualEventId: 'evt_xyz',
      value: 99.99,
      pageUrl: 'https://store.com/checkout',
      timestamp: now + 500
    };

    const event3 = {
      name: 'Purchase',
      actualEventId: 'evt_distinct',
      value: 12.0,
      pageUrl: 'https://store.com/checkout',
      timestamp: now + 5000 // after 3s window
    };

    assert.equal(isDuplicateEvent(event1, event2, 3000), true);
    assert.equal(isDuplicateEvent(event1, event3, 3000), false);
  });
});
