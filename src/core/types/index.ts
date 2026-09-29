/**
 * ChatGPT Pixel Helper & Inspector - Core Canonical Type Contracts
 */

export type CaptureSource = 'oaiq' | 'fetch' | 'beacon' | 'xhr' | 'webRequest' | 'dataLayer';

export type EventStatus = 'fired' | 'sent' | 'accepted' | 'rejected' | 'failed' | 'blocked';

export type ValidationSeverity = 'info' | 'warning' | 'error' | 'valid';

export interface ValidationFinding {
  severity: ValidationSeverity;
  ruleId: string;
  parameterPath: string;
  receivedValue?: unknown;
  expectedValue?: string;
  explanation: string;
  recommendedFix?: string;
}

export interface ValidationResult {
  status: ValidationSeverity;
  score: number;
  findings: ValidationFinding[];
  hasErrors: boolean;
  hasWarnings: boolean;
}

export interface PixelEvent {
  internalId: string;
  actualEventId: string | null;
  name: string;
  displayName: string;
  category: 'behavioral' | 'ecommerce' | 'leadgen' | 'subscription' | 'custom' | 'diagnostic' | 'system';
  customEventName?: string;
  timestamp: number;
  timestampFormatted: string;
  pageUrl: string;
  referrer: string | null;
  pixelId: string | null;
  rawPayload: unknown;
  normalizedPayload: Record<string, unknown>;
  queryParameters: Record<string, string>;
  parameters: Record<string, unknown>;
  captureSource: CaptureSource;
  networkRequestId?: string;
  httpStatus?: number;
  networkStatus?: EventStatus;
  validation: ValidationResult;
  isDuplicate?: boolean;
  duplicateReason?: string;
  attribution?: {
    oppref?: string | null;
    source?: 'url' | 'cookie' | 'storage' | null;
  };
}

export interface NetworkRequest {
  id: string;
  tabId: number;
  url: string;
  method: string;
  timestamp: number;
  status: number | 'pending' | 'failed';
  statusText?: string;
  duration?: number;
  payload: unknown;
  responseHeaders?: Array<{ name: string; value: string }>;
  correlatedEventIds: string[];
}

export interface TabSessionState {
  tabId: number;
  url: string;
  title: string;
  hostname: string;
  pixelDetected: boolean;
  pixelIds: string[];
  gtmDetected: boolean;
  gtmContainers: string[];
  dataLayerActive: boolean;
  attributionDetected: boolean;
  attributionValue: string | null;
  events: PixelEvent[];
  networkRequests: NetworkRequest[];
  stats: {
    totalEvents: number;
    standardEvents: number;
    customEvents: number;
    errors: number;
    warnings: number;
    duplicates: number;
  };
  lastUpdated: number;
}

export interface ExtensionSettings {
  captureNetwork: boolean;
  captureFetch: boolean;
  captureBeacon: boolean;
  captureXHR: boolean;
  validateEvents: boolean;
  detectDuplicates: boolean;
  detectPII: boolean;
  clearOnReload: boolean;
  theme: 'light' | 'dark' | 'system';
}

export interface RuntimeMessage<T = unknown> {
  action: string;
  tabId?: number;
  data?: T;
  timestamp: number;
}
