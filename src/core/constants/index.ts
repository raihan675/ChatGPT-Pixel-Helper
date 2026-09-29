/**
 * ChatGPT Pixel Helper & Inspector - Central Constants & Action Tokens
 */

export const EXTENSION_NAME = 'ChatGPT Pixel Helper & Inspector';
export const EXTENSION_VERSION = '1.0.0';

export const OPENAI_ENDPOINTS = [
  'bzr.openai.com/v1/sdk/events',
  'bzr.openai.com/events',
  'bzrcdn.openai.com/sdk/oaiq',
  '/v1/sdk/events',
  'st=oaiq-web'
];

export const MESSAGE_ACTIONS = {
  // Bridge -> Content -> Background
  PIXEL_INIT_CAPTURED: 'PIXEL_INIT_CAPTURED',
  PIXEL_EVENT_CAPTURED: 'PIXEL_EVENT_CAPTURED',
  NETWORK_REQUEST_CAPTURED: 'NETWORK_REQUEST_CAPTURED',
  DATALAYER_PUSH_CAPTURED: 'DATALAYER_PUSH_CAPTURED',
  PAGE_SCAN_COMPLETED: 'PAGE_SCAN_COMPLETED',
  SPA_NAVIGATED: 'SPA_NAVIGATED',

  // UI -> Background
  GET_TAB_STATE: 'GET_TAB_STATE',
  CLEAR_TAB_STATE: 'CLEAR_TAB_STATE',
  GET_SETTINGS: 'GET_SETTINGS',
  SAVE_SETTINGS: 'SAVE_SETTINGS',
  TRIGGER_PAGE_SCAN: 'TRIGGER_PAGE_SCAN',

  // Background -> UI Broadcast
  STATE_UPDATED: 'STATE_UPDATED',
  NEW_EVENT: 'NEW_EVENT',
  NEW_NETWORK_REQUEST: 'NEW_NETWORK_REQUEST'
} as const;

export const DEFAULT_SETTINGS = {
  captureNetwork: true,
  captureFetch: true,
  captureBeacon: true,
  captureXHR: true,
  validateEvents: true,
  detectDuplicates: true,
  detectPII: true,
  clearOnReload: false,
  theme: 'dark' as const
};

export const STORAGE_KEYS = {
  SETTINGS: 'chatgpt_pixel_settings',
  TAB_STATE_PREFIX: 'chatgpt_tab_state_'
} as const;
