/**
 * OpenAI Pixel Knowledge Dictionary - Parameters
 * Detailed taxonomy of query, payload, user, and attribution parameters.
 */

export type ParameterCategory =
  | 'QUERY'
  | 'BATCH'
  | 'EVENT'
  | 'DATA'
  | 'USER'
  | 'ATTRIBUTION'
  | 'NETWORK'
  | 'DIAGNOSTIC';

export interface ParameterDefinition {
  name: string;
  category: ParameterCategory;
  description: string;
  expectedType: 'string' | 'number' | 'boolean' | 'array' | 'object';
  isOfficial: boolean;
  requiredForEvents?: string[];
}

export const KNOWN_PARAMETERS: Record<string, ParameterDefinition> = {
  // Query & Transport
  pid: {
    name: 'pid',
    category: 'QUERY',
    description: 'Unique OpenAI Pixel identifier (Advertiser Data Source ID).',
    expectedType: 'string',
    isOfficial: true
  },
  st: {
    name: 'st',
    category: 'QUERY',
    description: 'SDK transport identifier (typically oaiq-web).',
    expectedType: 'string',
    isOfficial: true
  },
  sv: {
    name: 'sv',
    category: 'QUERY',
    description: 'Client Web SDK version string.',
    expectedType: 'string',
    isOfficial: true
  },
  ec: {
    name: 'ec',
    category: 'BATCH',
    description: 'Batch event count in the transmitted payload.',
    expectedType: 'number',
    isOfficial: true
  },

  // Event Identification
  ev: {
    name: 'ev',
    category: 'EVENT',
    description: 'Canonical event name (e.g. PageView, Purchase).',
    expectedType: 'string',
    isOfficial: true
  },
  event: {
    name: 'event',
    category: 'EVENT',
    description: 'Alternative event name payload property.',
    expectedType: 'string',
    isOfficial: false
  },
  eid: {
    name: 'eid',
    category: 'EVENT',
    description: 'Advertiser-supplied event_id for deduplication.',
    expectedType: 'string',
    isOfficial: true
  },
  event_id: {
    name: 'event_id',
    category: 'EVENT',
    description: 'Unique deduplication event identifier.',
    expectedType: 'string',
    isOfficial: false
  },

  // Conversion & Monetary Data
  value: {
    name: 'value',
    category: 'DATA',
    description: 'Monetary conversion transaction value.',
    expectedType: 'number',
    isOfficial: true,
    requiredForEvents: ['Purchase', 'AddToCart', 'InitiateCheckout']
  },
  amount: {
    name: 'amount',
    category: 'DATA',
    description: 'Monetary transaction amount (often in minor units).',
    expectedType: 'number',
    isOfficial: false
  },
  currency: {
    name: 'currency',
    category: 'DATA',
    description: 'ISO 4217 standard 3-letter currency code (e.g. USD, EUR, BDT).',
    expectedType: 'string',
    isOfficial: true,
    requiredForEvents: ['Purchase', 'AddToCart', 'InitiateCheckout']
  },
  contents: {
    name: 'contents',
    category: 'DATA',
    description: 'Array of itemized products or cart contents.',
    expectedType: 'array',
    isOfficial: true
  },
  content_ids: {
    name: 'content_ids',
    category: 'DATA',
    description: 'Array or list of product SKU/IDs.',
    expectedType: 'array',
    isOfficial: true
  },
  content_type: {
    name: 'content_type',
    category: 'DATA',
    description: 'Category or schema type of content (e.g. product, product_group).',
    expectedType: 'string',
    isOfficial: true
  },
  content_name: {
    name: 'content_name',
    category: 'DATA',
    description: 'Product or page content title.',
    expectedType: 'string',
    isOfficial: true
  },
  num_items: {
    name: 'num_items',
    category: 'DATA',
    description: 'Total quantity of items in purchase or cart.',
    expectedType: 'number',
    isOfficial: true
  },
  order_id: {
    name: 'order_id',
    category: 'DATA',
    description: 'Unique order confirmation number.',
    expectedType: 'string',
    isOfficial: true
  },

  // Attribution & Campaign Tokens
  oppref: {
    name: 'oppref',
    category: 'ATTRIBUTION',
    description: 'OpenAI campaign attribution token (__oppref) preserved from ad clicks.',
    expectedType: 'string',
    isOfficial: true
  },
  _oaiq: {
    name: '_oaiq',
    category: 'ATTRIBUTION',
    description: 'OpenAI visitor cookie token.',
    expectedType: 'string',
    isOfficial: true
  },

  // Customer / User Identity Data
  em: {
    name: 'em',
    category: 'USER',
    description: 'Customer email (MUST be SHA-256 hashed).',
    expectedType: 'string',
    isOfficial: true
  },
  ph: {
    name: 'ph',
    category: 'USER',
    description: 'Customer phone number (MUST be SHA-256 hashed).',
    expectedType: 'string',
    isOfficial: true
  },

  // Technical & Network Context
  dl: {
    name: 'dl',
    category: 'NETWORK',
    description: 'Document location (active URL of the page).',
    expectedType: 'string',
    isOfficial: true
  },
  ref: {
    name: 'ref',
    category: 'NETWORK',
    description: 'HTTP document referrer URL.',
    expectedType: 'string',
    isOfficial: true
  },
  ts: {
    name: 'ts',
    category: 'DIAGNOSTIC',
    description: 'Client epoch timestamp in milliseconds.',
    expectedType: 'number',
    isOfficial: true
  },
  sr: {
    name: 'sr',
    category: 'DIAGNOSTIC',
    description: 'Screen resolution dimensions.',
    expectedType: 'string',
    isOfficial: true
  },
  vp: {
    name: 'vp',
    category: 'DIAGNOSTIC',
    description: 'Browser viewport dimensions.',
    expectedType: 'string',
    isOfficial: true
  },
  dt: {
    name: 'dt',
    category: 'DIAGNOSTIC',
    description: 'Document HTML title.',
    expectedType: 'string',
    isOfficial: true
  }
};

export function lookupParameter(paramName: string): ParameterDefinition {
  if (KNOWN_PARAMETERS[paramName]) {
    return KNOWN_PARAMETERS[paramName];
  }

  // Handle indexed array parameters like contents[0].id
  const baseMatch = paramName.match(/^([a-zA-Z0-9_]+)\[\d+\]\.(.+)$/);
  if (baseMatch) {
    const subProperty = baseMatch[2];
    return {
      name: paramName,
      category: 'DATA',
      description: `Nested item property: ${subProperty}`,
      expectedType: 'string',
      isOfficial: false
    };
  }

  return {
    name: paramName,
    category: 'DATA',
    description: 'Custom or uncataloged payload parameter.',
    expectedType: 'string',
    isOfficial: false
  };
}
