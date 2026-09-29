/**
 * OpenAI Pixel Knowledge Dictionary - Events
 * Central reference for standard, official, and inferred OpenAI Pixel events.
 */

export interface EventDefinition {
  name: string;
  displayLabel: string;
  category: 'behavioral' | 'ecommerce' | 'leadgen' | 'subscription' | 'custom' | 'diagnostic' | 'system';
  description: string;
  isOfficial: boolean;
  requiredParameters: string[];
  recommendedParameters: string[];
  color: string;
}

export const KNOWN_EVENTS: Record<string, EventDefinition> = {
  // Behavioral
  PageView: {
    name: 'PageView',
    displayLabel: 'Page View',
    category: 'behavioral',
    description: 'Tracks user navigation and page views across the website.',
    isOfficial: true,
    requiredParameters: [],
    recommendedParameters: ['pageUrl', 'title', 'referrer'],
    color: '#3b82f6'
  },
  page_view: {
    name: 'page_view',
    displayLabel: 'Page View',
    category: 'behavioral',
    description: 'Snake-case variation of PageView tracking.',
    isOfficial: false,
    requiredParameters: [],
    recommendedParameters: ['pageUrl', 'title'],
    color: '#3b82f6'
  },

  // E-commerce Funnel
  ViewContent: {
    name: 'ViewContent',
    displayLabel: 'View Content',
    category: 'ecommerce',
    description: 'Triggered when a user views a specific product or content page.',
    isOfficial: true,
    requiredParameters: [],
    recommendedParameters: ['content_ids', 'content_type', 'content_name', 'currency', 'value'],
    color: '#8b5cf6'
  },
  contents_viewed: {
    name: 'contents_viewed',
    displayLabel: 'Contents Viewed',
    category: 'ecommerce',
    description: 'Alternative e-commerce content view step.',
    isOfficial: false,
    requiredParameters: [],
    recommendedParameters: ['contents', 'currency', 'value'],
    color: '#8b5cf6'
  },
  AddToCart: {
    name: 'AddToCart',
    displayLabel: 'Add To Cart',
    category: 'ecommerce',
    description: 'Triggered when a shopper adds an item or product to their shopping cart.',
    isOfficial: true,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['content_ids', 'content_type', 'contents', 'num_items'],
    color: '#06b6d4'
  },
  items_added: {
    name: 'items_added',
    displayLabel: 'Items Added',
    category: 'ecommerce',
    description: 'Standard cart addition indicator.',
    isOfficial: false,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['contents'],
    color: '#06b6d4'
  },
  InitiateCheckout: {
    name: 'InitiateCheckout',
    displayLabel: 'Initiate Checkout',
    category: 'ecommerce',
    description: 'Triggered when a user proceeds to the checkout step.',
    isOfficial: true,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['num_items', 'contents', 'content_ids'],
    color: '#f59e0b'
  },
  checkout_started: {
    name: 'checkout_started',
    displayLabel: 'Checkout Started',
    category: 'ecommerce',
    description: 'Start of checkout flow.',
    isOfficial: false,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['num_items'],
    color: '#f59e0b'
  },
  Purchase: {
    name: 'Purchase',
    displayLabel: 'Purchase',
    category: 'ecommerce',
    description: 'Triggered when an order/purchase transaction successfully completes.',
    isOfficial: true,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['order_id', 'contents', 'content_ids', 'num_items'],
    color: '#10a37f'
  },
  order_created: {
    name: 'order_created',
    displayLabel: 'Order Created',
    category: 'ecommerce',
    description: 'Completed ecommerce order event.',
    isOfficial: false,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['order_id', 'contents'],
    color: '#10a37f'
  },

  // Lead Generation
  Lead: {
    name: 'Lead',
    displayLabel: 'Lead',
    category: 'leadgen',
    description: 'Triggered when a user submits their contact information or inquiry.',
    isOfficial: true,
    requiredParameters: [],
    recommendedParameters: ['content_name', 'content_category', 'value', 'currency'],
    color: '#ec4899'
  },
  lead_created: {
    name: 'lead_created',
    displayLabel: 'Lead Created',
    category: 'leadgen',
    description: 'Lead generation submission event.',
    isOfficial: false,
    requiredParameters: [],
    recommendedParameters: ['value', 'currency'],
    color: '#ec4899'
  },
  CompleteRegistration: {
    name: 'CompleteRegistration',
    displayLabel: 'Complete Registration',
    category: 'leadgen',
    description: 'Triggered when a user completes account registration or signup.',
    isOfficial: true,
    requiredParameters: [],
    recommendedParameters: ['status', 'content_name'],
    color: '#14b8a6'
  },
  registration_completed: {
    name: 'registration_completed',
    displayLabel: 'Registration Completed',
    category: 'leadgen',
    description: 'Account signup completed.',
    isOfficial: false,
    requiredParameters: [],
    recommendedParameters: [],
    color: '#14b8a6'
  },

  // Subscriptions
  Subscribe: {
    name: 'Subscribe',
    displayLabel: 'Subscribe',
    category: 'subscription',
    description: 'Triggered when a user begins a paid subscription.',
    isOfficial: true,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: ['predicted_ltv'],
    color: '#6366f1'
  },
  subscription_created: {
    name: 'subscription_created',
    displayLabel: 'Subscription Created',
    category: 'subscription',
    description: 'Paid subscription creation event.',
    isOfficial: false,
    requiredParameters: ['currency', 'value'],
    recommendedParameters: [],
    color: '#6366f1'
  },
  StartTrial: {
    name: 'StartTrial',
    displayLabel: 'Start Trial',
    category: 'subscription',
    description: 'Triggered when a user starts a free trial.',
    isOfficial: true,
    requiredParameters: [],
    recommendedParameters: ['currency', 'value', 'predicted_ltv'],
    color: '#a855f7'
  },
  trial_started: {
    name: 'trial_started',
    displayLabel: 'Trial Started',
    category: 'subscription',
    description: 'Free trial commenced.',
    isOfficial: false,
    requiredParameters: [],
    recommendedParameters: [],
    color: '#a855f7'
  }
};

export function lookupEvent(name: string): EventDefinition {
  if (KNOWN_EVENTS[name]) {
    return KNOWN_EVENTS[name];
  }
  // Case-insensitive lookup fallback
  const lower = name.toLowerCase();
  for (const [k, def] of Object.entries(KNOWN_EVENTS)) {
    if (k.toLowerCase() === lower) {
      return def;
    }
  }

  // Fallback for custom / unknown events
  return {
    name,
    displayLabel: name.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim(),
    category: 'custom',
    description: 'Custom or uncataloged event fired by site code.',
    isOfficial: false,
    requiredParameters: [],
    recommendedParameters: [],
    color: '#64748b'
  };
}
