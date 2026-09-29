/**
 * ChatGPT Pixel Helper & Inspector - Page Bridge (Main World)
 * Injected into the page's MAIN execution world to intercept:
 * 1. window.oaiq calls (init, event, track)
 * 2. Network requests (fetch, sendBeacon, XMLHttpRequest)
 * 3. window.dataLayer pushes
 * 4. SPA route changes
 *
 * Communicates with the isolated content script via window.postMessage.
 */

(function () {
  // Prevent duplicate bridge execution
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
    } catch {
      // Ignore serialization issues
    }
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
        // Try parsing URL query format
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

  // ==========================================
  // 1. Hook window.oaiq
  // ==========================================
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

    // Preserve existing queue if present
    if (origOaiq && typeof origOaiq === 'object' && Array.isArray((origOaiq as { q?: unknown[] }).q)) {
      (wrapped as unknown as { q: unknown[] }).q = (origOaiq as { q: unknown[] }).q;
      // Process past items
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

  // ==========================================
  // 2. Intercept window.fetch
  // ==========================================
  if (typeof window.fetch === 'function') {
    const originalFetch = window.fetch;
    window.fetch = async function (...args) {
      const input = args[0];
      const init = args[1];
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input?.url;

      if (url && isOpenAiPixelUrl(url)) {
        const method = init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET');
        const parsed = parseBody(init?.body);
        const startTime = Date.now();

        try {
          const response = await originalFetch.apply(window, args);
          const cloned = response.clone();
          cloned.text().then((text) => {
            postToContentScript('NETWORK_REQUEST_CAPTURED', {
              captureSource: 'fetch',
              url,
              method,
              payload: parsed,
              status: response.status,
              duration: Date.now() - startTime,
              responseBody: text.slice(0, 500)
            });
          }).catch(() => {
            postToContentScript('NETWORK_REQUEST_CAPTURED', {
              captureSource: 'fetch',
              url,
              method,
              payload: parsed,
              status: response.status,
              duration: Date.now() - startTime
            });
          });
          return response;
        } catch (err) {
          postToContentScript('NETWORK_REQUEST_CAPTURED', {
            captureSource: 'fetch',
            url,
            method,
            payload: parsed,
            status: 'failed',
            duration: Date.now() - startTime,
            error: String(err)
          });
          throw err;
        }
      }

      return originalFetch.apply(window, args);
    };
  }

  // ==========================================
  // 3. Intercept navigator.sendBeacon
  // ==========================================
  if (navigator && typeof navigator.sendBeacon === 'function') {
    const originalSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null) {
      const targetUrl = typeof url === 'string' ? url : url.toString();
      if (isOpenAiPixelUrl(targetUrl)) {
        postToContentScript('NETWORK_REQUEST_CAPTURED', {
          captureSource: 'beacon',
          url: targetUrl,
          method: 'POST',
          payload: parseBody(data),
          status: 200,
          duration: 0
        });
      }
      return originalSendBeacon(url, data);
    };
  }

  // ==========================================
  // 4. Intercept XMLHttpRequest
  // ==========================================
  if (typeof XMLHttpRequest !== 'undefined') {
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;

    XMLHttpRequest.prototype.open = function (this: XMLHttpRequest & { _pixelUrl?: string; _pixelMethod?: string }, ...args: unknown[]) {
      this._pixelMethod = String(args[0]);
      this._pixelUrl = String(args[1]);
      return (origOpen as Function).apply(this, args);
    };

    XMLHttpRequest.prototype.send = function (this: XMLHttpRequest & { _pixelUrl?: string; _pixelMethod?: string }, body?: Document | XMLHttpRequestBodyInit | null) {
      if (this._pixelUrl && isOpenAiPixelUrl(this._pixelUrl)) {
        const url = this._pixelUrl;
        const method = this._pixelMethod || 'GET';
        const parsed = parseBody(body);
        const startTime = Date.now();

        this.addEventListener('load', () => {
          postToContentScript('NETWORK_REQUEST_CAPTURED', {
            captureSource: 'xhr',
            url,
            method,
            payload: parsed,
            status: this.status,
            duration: Date.now() - startTime
          });
        });

        this.addEventListener('error', () => {
          postToContentScript('NETWORK_REQUEST_CAPTURED', {
            captureSource: 'xhr',
            url,
            method,
            payload: parsed,
            status: 'failed',
            duration: Date.now() - startTime
          });
        });
      }

      return origSend.apply(this, [body]);
    };
  }

  // ==========================================
  // 5. Intercept window.dataLayer
  // ==========================================
  function wrapDataLayer(dl: unknown[]) {
    const origPush = dl.push;
    dl.push = function (...items: unknown[]) {
      for (const item of items) {
        if (item && typeof item === 'object') {
          postToContentScript('DATALAYER_PUSH_CAPTURED', {
            item,
            timestamp: Date.now()
          });
        }
      }
      return origPush.apply(dl, items);
    };
  }

  const existingDl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(existingDl)) {
    wrapDataLayer(existingDl);
  } else {
    let currentDl: unknown[] | undefined = undefined;
    try {
      Object.defineProperty(window, 'dataLayer', {
        configurable: true,
        enumerable: true,
        get() {
          return currentDl;
        },
        set(val) {
          currentDl = val;
          if (Array.isArray(currentDl)) {
            wrapDataLayer(currentDl);
          }
        }
      });
    } catch {
      // Ignored if non-configurable
    }
  }

  // ==========================================
  // 6. SPA Route Navigation
  // ==========================================
  function notifyNavigation() {
    postToContentScript('SPA_NAVIGATED', {
      url: window.location.href,
      pathname: window.location.pathname,
      timestamp: Date.now()
    });
  }

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    notifyNavigation();
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    notifyNavigation();
  };

  window.addEventListener('popstate', notifyNavigation);
  window.addEventListener('hashchange', notifyNavigation);

  // Ready signal
  postToContentScript('BRIDGE_READY', { timestamp: Date.now() });
})();
