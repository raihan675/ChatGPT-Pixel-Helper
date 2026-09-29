/**
 * ChatGPT Pixel Inspector - Master Page Bridge (Main World)
 * Injected into the page's MAIN execution world to intercept:
 * 1. window.oaiq calls (init, event, track)
 * 2. Network requests via modular fetch, sendBeacon, and XHR interceptors
 * 3. window.dataLayer pushes and GTM container discovery
 * 4. SPA route changes
 *
 * Communicates with the isolated content script via window.postMessage.
 */

import { setupFetchInterceptor } from './fetch-interceptor';
import { setupBeaconInterceptor } from './beacon-interceptor';
import { setupXhrInterceptor } from './xhr-interceptor';
import { setupHistoryInterceptor } from './history-interceptor';
import { setupDataLayerMonitor } from './datalayer-monitor';
import { detectGtmGlobals } from './gtm-detector';

(function () {
  // Prevent duplicate execution
  if ((window as unknown as { __OPENAI_PIXEL_BRIDGE_INITIALIZED__?: boolean }).__OPENAI_PIXEL_BRIDGE_INITIALIZED__) {
    return;
  }
  (window as unknown as { __OPENAI_PIXEL_BRIDGE_INITIALIZED__: boolean }).__OPENAI_PIXEL_BRIDGE_INITIALIZED__ = true;

  const BRIDGE_SOURCE = 'OPENAI_PIXEL_BRIDGE_MSG';

  function postToContentScript(action: string, payload: Record<string, unknown>) {
    try {
      window.postMessage(
        {
          source: BRIDGE_SOURCE,
          action,
          payload,
          timestamp: Date.now(),
          url: window.location.href
        },
        '*'
      );
    } catch {}
  }

  const OPENAI_URL_PATTERNS = [
    'bzr.openai.com/v1/sdk/events',
    'bzr.openai.com/events',
    'bzrcdn.openai.com/sdk/oaiq',
    'st=oaiq-web'
  ];

  function isOpenAiPixelUrl(url: string): boolean {
    if (!url || typeof url !== 'string') return false;
    return OPENAI_URL_PATTERNS.some((pattern) => url.includes(pattern));
  }

  function parseBody(body: unknown): Record<string, unknown> | string | null {
    if (!body) return null;
    if (typeof body === 'string') {
      try {
        return JSON.parse(body);
      } catch {
        try {
          const params = new URLSearchParams(body);
          const obj: Record<string, unknown> = {};
          params.forEach((v, k) => {
            obj[k] = v;
          });
          if (Object.keys(obj).length > 0) return obj;
        } catch {}
        return body;
      }
    }
    if (typeof FormData !== 'undefined' && body instanceof FormData) {
      const obj: Record<string, unknown> = {};
      body.forEach((v, k) => {
        obj[k] = v;
      });
      return obj;
    }
    if (typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams) {
      const obj: Record<string, unknown> = {};
      body.forEach((v, k) => {
        obj[k] = v;
      });
      return obj;
    }
    return String(body);
  }

  // 1. Hook window.oaiq
  function handleOaiqCall(args: unknown[]) {
    if (!args || args.length === 0) return;
    const command = String(args[0]).toLowerCase();

    if (command === 'init') {
      const pixelId = typeof args[1] === 'string' ? args[1] : (args[1] as { pixelId?: string })?.pixelId;
      if (pixelId) {
        postToContentScript('PIXEL_INIT_CAPTURED', { pixelId });
      }
    } else if (command === 'event' || command === 'track') {
      const eventName = args[1] as string;
      const params = (args[2] || {}) as Record<string, unknown>;
      postToContentScript('PIXEL_EVENT_CAPTURED', {
        captureSource: 'oaiq',
        eventName,
        params,
        timestamp: Date.now()
      });
    }
  }

  function wrapOaiq(origOaiq?: unknown) {
    const wrapped = function (...args: unknown[]) {
      handleOaiqCall(args);
      if (typeof origOaiq === 'function') {
        return origOaiq.apply(window, args);
      }
      if (Array.isArray((origOaiq as { q?: unknown[] })?.q)) {
        (origOaiq as { q: unknown[] }).q.push(args);
      }
    };

    if (origOaiq && typeof origOaiq === 'object' && Array.isArray((origOaiq as { q?: unknown[] }).q)) {
      (wrapped as unknown as { q: unknown[] }).q = (origOaiq as { q: unknown[] }).q;
      for (const item of (origOaiq as { q: unknown[] }).q) {
        if (Array.isArray(item)) handleOaiqCall(item);
      }
    } else if (!(wrapped as unknown as { q?: unknown[] }).q) {
      (wrapped as unknown as { q: unknown[] }).q = [];
    }

    return wrapped;
  }

  const existingOaiq = (window as unknown as { oaiq?: unknown }).oaiq;
  if (typeof existingOaiq !== 'undefined') {
    (window as unknown as { oaiq: unknown }).oaiq = wrapOaiq(existingOaiq);
  } else {
    let currentOaiq = wrapOaiq();
    try {
      Object.defineProperty(window, 'oaiq', {
        configurable: true,
        enumerable: true,
        get() {
          return currentOaiq;
        },
        set(val) {
          currentOaiq = wrapOaiq(val);
        }
      });
    } catch {
      (window as unknown as { oaiq: unknown }).oaiq = currentOaiq;
    }
  }

  // 2. Setup Modular Network Interceptors
  setupFetchInterceptor(isOpenAiPixelUrl, parseBody, (data) => {
    postToContentScript('NETWORK_REQUEST_CAPTURED', data);
  });

  setupBeaconInterceptor(isOpenAiPixelUrl, parseBody, (data) => {
    postToContentScript('NETWORK_REQUEST_CAPTURED', data);
  });

  setupXhrInterceptor(isOpenAiPixelUrl, parseBody, (data) => {
    postToContentScript('NETWORK_REQUEST_CAPTURED', data);
  });

  // 3. Setup DataLayer & GTM
  setupDataLayerMonitor((item) => {
    postToContentScript('DATALAYER_PUSH_CAPTURED', { item, timestamp: Date.now() });
  });

  const gtmStatus = detectGtmGlobals();
  if (gtmStatus.gtmActive) {
    postToContentScript('GTM_CONTAINERS_DETECTED', { containerIds: gtmStatus.containerIds });
  }

  // 4. Setup History & SPA Navigation
  setupHistoryInterceptor((url) => {
    postToContentScript('SPA_NAVIGATED', { url, timestamp: Date.now() });
  });

  // Ready signal
  postToContentScript('BRIDGE_READY', { timestamp: Date.now() });
})();
