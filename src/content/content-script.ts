/**
 * ChatGPT Pixel Helper & Inspector - Isolated Content Script
 * Relays messages from the Main World Bridge to the Background Service Worker,
 * performs DOM script scans, and inspects storage attribution.
 */

import { scanPageDOM } from './dom-scanner';
import { scanPageAttribution } from './storage-inspector';
import { MESSAGE_ACTIONS } from '../core/constants';
import { parseRawToPixelEvent } from '../core/parser/event-parser';
import { validatePixelEvent } from '../core/validation/validator';
import { PixelEvent } from '../core/types';

const BRIDGE_SOURCE = 'OPENAI_PIXEL_BRIDGE_MSG';

function sendToBackground(action: string, data?: unknown) {
  try {
    chrome.runtime.sendMessage({
      action,
      data,
      timestamp: Date.now()
    }).catch(() => {
      // Background worker might be idle or restarting
    });
  } catch {}
}

// 1. Initial Page Scan
function performFullScan() {
  const domResult = scanPageDOM();
  const attrResult = scanPageAttribution();

  sendToBackground(MESSAGE_ACTIONS.PAGE_SCAN_COMPLETED, {
    pixelDetected: domResult.pixelDetected,
    pixelIds: domResult.pixelIds,
    gtmDetected: domResult.gtmDetected,
    gtmContainers: domResult.gtmContainers,
    attributionDetected: attrResult.detected,
    attributionValue: attrResult.oppref
  });
}

// Run initial scan
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', performFullScan);
} else {
  performFullScan();
}

// Re-scan after short delay to catch asynchronously injected pixels
setTimeout(performFullScan, 1500);
setTimeout(performFullScan, 3500);

// 2. Listen to Main World Bridge Messages
window.addEventListener('message', (event) => {
  if (event.source !== window || !event.data || event.data.source !== BRIDGE_SOURCE) {
    return;
  }

  const { action, payload } = event.data;

  switch (action) {
    case 'PIXEL_INIT_CAPTURED': {
      sendToBackground(MESSAGE_ACTIONS.PIXEL_INIT_CAPTURED, payload);
      break;
    }

    case 'PIXEL_EVENT_CAPTURED': {
      const attr = scanPageAttribution();
      const rawEvent: PixelEvent = parseRawToPixelEvent({
        captureSource: payload?.captureSource || 'oaiq',
        eventName: payload?.eventName,
        payload: payload?.params,
        pageUrl: window.location.href,
        oppref: attr.oppref
      });

      rawEvent.validation = validatePixelEvent(rawEvent);
      sendToBackground(MESSAGE_ACTIONS.PIXEL_EVENT_CAPTURED, rawEvent);
      break;
    }

    case 'NETWORK_REQUEST_CAPTURED': {
      const attr = scanPageAttribution();
      const netEvent: PixelEvent = parseRawToPixelEvent({
        url: payload?.url,
        payload: payload?.payload,
        captureSource: payload?.captureSource || 'fetch',
        pageUrl: window.location.href,
        oppref: attr.oppref,
        httpStatus: typeof payload?.status === 'number' ? payload.status : undefined
      });

      netEvent.validation = validatePixelEvent(netEvent);
      sendToBackground(MESSAGE_ACTIONS.PIXEL_EVENT_CAPTURED, netEvent);
      break;
    }

    case 'DATALAYER_PUSH_CAPTURED': {
      sendToBackground(MESSAGE_ACTIONS.DATALAYER_PUSH_CAPTURED, payload);
      break;
    }

    case 'SPA_NAVIGATED': {
      performFullScan();
      break;
    }

    default:
      break;
  }
});

// 3. Listen for Background requests (e.g. manual scan re-trigger)
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.action === MESSAGE_ACTIONS.TRIGGER_PAGE_SCAN) {
    performFullScan();
    sendResponse({ success: true });
  }
  return true;
});
