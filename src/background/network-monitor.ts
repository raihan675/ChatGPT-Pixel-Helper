/**
 * Network Monitor Service
 * Observes outgoing network requests via chrome.webRequest without blocking or tampering.
 */

import { OPENAI_ENDPOINTS } from '../core/constants';
import { NetworkRequest } from '../core/types';
import { tabManager } from './tab-manager';
import { broadcastStateUpdated } from '../core/messaging/bus';

export function isTargetOpenAIUrl(url: string): boolean {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes('bzr.openai.com') ||
    lower.includes('bzrcdn.openai.com') ||
    lower.includes('/v1/sdk/events') ||
    (lower.includes('/events') && (lower.includes('pid=') || lower.includes('oaiq'))) ||
    OPENAI_ENDPOINTS.some((ep) => lower.includes(ep))
  );
}

export function initNetworkMonitor(): void {
  if (typeof chrome === 'undefined' || !chrome.webRequest || !chrome.webRequest.onBeforeRequest) {
    return;
  }

  // 1. Outgoing request observation
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const { tabId, url, method, requestId, requestBody } = details;
      if (tabId < 0) return;

      if (isTargetOpenAIUrl(url)) {
        let payload: unknown = null;
        if (requestBody) {
          if (requestBody.raw && requestBody.raw.length > 0) {
            try {
              const decoder = new TextDecoder('utf-8');
              let str = '';
              for (const part of requestBody.raw) {
                if (part.bytes) str += decoder.decode(part.bytes);
              }
              payload = JSON.parse(str);
            } catch {
              payload = { raw: 'Non-JSON or binary payload' };
            }
          } else if (requestBody.formData) {
            payload = requestBody.formData;
          }
        }

        const netReq: NetworkRequest = {
          id: requestId,
          tabId,
          url,
          method,
          timestamp: Date.now(),
          status: 'pending',
          payload,
          correlatedEventIds: []
        };

        tabManager.addNetworkRequest(tabId, netReq);
        broadcastStateUpdated(tabId);
      }
    },
    { urls: ['<all_urls>'] },
    ['requestBody']
  );

  // 2. Completed request status observation
  chrome.webRequest.onCompleted.addListener(
    (details) => {
      const { tabId, requestId, statusCode } = details;
      if (tabId < 0) return;

      const state = tabManager.getState(tabId);
      if (state) {
        const found = state.networkRequests.find((r) => r.id === requestId);
        if (found) {
          found.status = statusCode;
          found.duration = Date.now() - found.timestamp;
          tabManager.persistState(tabId);
          broadcastStateUpdated(tabId);
        }
      }
    },
    { urls: ['<all_urls>'] }
  );

  // 3. Error observation (e.g. adblocker net::ERR_BLOCKED_BY_CLIENT)
  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      const { tabId, requestId, error } = details;
      if (tabId < 0) return;

      const state = tabManager.getState(tabId);
      if (state) {
        const found = state.networkRequests.find((r) => r.id === requestId);
        if (found) {
          found.status = 'failed';
          found.statusText = error;
          found.duration = Date.now() - found.timestamp;
          tabManager.persistState(tabId);
          broadcastStateUpdated(tabId);
        }
      }
    },
    { urls: ['<all_urls>'] }
  );
}
