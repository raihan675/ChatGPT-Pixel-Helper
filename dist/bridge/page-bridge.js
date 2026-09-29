"use strict";
(() => {
  // src/bridge/fetch-interceptor.ts
  function setupFetchInterceptor(isOpenAiUrl, parseBody, onCaptured) {
    if (typeof window === "undefined" || typeof window.fetch !== "function") return;
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      const input = args[0];
      const init = args[1];
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input?.url;
      if (url && isOpenAiUrl(url)) {
        const method = init?.method || (typeof input === "object" && "method" in input ? input.method : "GET");
        const parsed = parseBody(init?.body);
        const startTime = Date.now();
        try {
          const response = await originalFetch.apply(window, args);
          const cloned = response.clone();
          cloned.text().then((text) => {
            onCaptured({
              captureSource: "fetch",
              url,
              method,
              payload: parsed,
              status: response.status,
              duration: Date.now() - startTime,
              responseBody: text.slice(0, 500)
            });
          }).catch(() => {
            onCaptured({
              captureSource: "fetch",
              url,
              method,
              payload: parsed,
              status: response.status,
              duration: Date.now() - startTime
            });
          });
          return response;
        } catch (err) {
          onCaptured({
            captureSource: "fetch",
            url,
            method,
            payload: parsed,
            status: "failed",
            duration: Date.now() - startTime,
            error: String(err)
          });
          throw err;
        }
      }
      return originalFetch.apply(window, args);
    };
  }

  // src/bridge/beacon-interceptor.ts
  function setupBeaconInterceptor(isOpenAiUrl, parseBody, onCaptured) {
    if (typeof navigator === "undefined" || typeof navigator.sendBeacon !== "function") return;
    const originalSendBeacon = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url, data) {
      const targetUrl = typeof url === "string" ? url : url.toString();
      if (isOpenAiUrl(targetUrl)) {
        onCaptured({
          captureSource: "beacon",
          url: targetUrl,
          method: "POST",
          payload: parseBody(data),
          status: 200,
          duration: 0
        });
      }
      return originalSendBeacon(url, data);
    };
  }

  // src/bridge/xhr-interceptor.ts
  function setupXhrInterceptor(isOpenAiUrl, parseBody, onCaptured) {
    if (typeof XMLHttpRequest === "undefined") return;
    const origOpen = XMLHttpRequest.prototype.open;
    const origSend = XMLHttpRequest.prototype.send;
    XMLHttpRequest.prototype.open = function(...args) {
      this._pixelMethod = String(args[0]);
      this._pixelUrl = String(args[1]);
      return origOpen.apply(this, args);
    };
    XMLHttpRequest.prototype.send = function(body) {
      if (this._pixelUrl && isOpenAiUrl(this._pixelUrl)) {
        const url = this._pixelUrl;
        const method = this._pixelMethod || "GET";
        const parsed = parseBody(body);
        const startTime = Date.now();
        this.addEventListener("load", () => {
          onCaptured({
            captureSource: "xhr",
            url,
            method,
            payload: parsed,
            status: this.status,
            duration: Date.now() - startTime
          });
        });
        this.addEventListener("error", () => {
          onCaptured({
            captureSource: "xhr",
            url,
            method,
            payload: parsed,
            status: "failed",
            duration: Date.now() - startTime
          });
        });
      }
      return origSend.apply(this, [body]);
    };
  }

  // src/bridge/history-interceptor.ts
  function setupHistoryInterceptor(onNavigated) {
    if (typeof window === "undefined" || typeof history === "undefined") return;
    const origPushState = history.pushState;
    history.pushState = function(...args) {
      origPushState.apply(this, args);
      onNavigated(window.location.href);
    };
    const origReplaceState = history.replaceState;
    history.replaceState = function(...args) {
      origReplaceState.apply(this, args);
      onNavigated(window.location.href);
    };
    window.addEventListener("popstate", () => onNavigated(window.location.href));
    window.addEventListener("hashchange", () => onNavigated(window.location.href));
  }

  // src/bridge/datalayer-monitor.ts
  function setupDataLayerMonitor(onPush) {
    if (typeof window === "undefined") return;
    function wrapDataLayer(dl) {
      const origPush = dl.push;
      dl.push = function(...items) {
        for (const item of items) {
          if (item && typeof item === "object") {
            onPush(item);
          }
        }
        return origPush.apply(dl, items);
      };
    }
    const existingDl = window.dataLayer;
    if (Array.isArray(existingDl)) {
      wrapDataLayer(existingDl);
      for (const item of existingDl) {
        if (item && typeof item === "object") {
          onPush(item);
        }
      }
    } else {
      let currentDl = void 0;
      try {
        Object.defineProperty(window, "dataLayer", {
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
      }
    }
  }

  // src/bridge/gtm-detector.ts
  function detectGtmGlobals() {
    if (typeof window === "undefined") {
      return { gtmActive: false, containerIds: [] };
    }
    const containerIds = [];
    const gtmGlobal = window.google_tag_manager;
    if (gtmGlobal && typeof gtmGlobal === "object") {
      for (const key of Object.keys(gtmGlobal)) {
        if (/^GTM-[A-Z0-9]+$/i.test(key) && !containerIds.includes(key)) {
          containerIds.push(key);
        }
      }
    }
    return {
      gtmActive: containerIds.length > 0 || Boolean(gtmGlobal),
      containerIds
    };
  }

  // src/bridge/page-bridge.ts
  (function() {
    if (window.__OPENAI_PIXEL_BRIDGE_INITIALIZED__) {
      return;
    }
    window.__OPENAI_PIXEL_BRIDGE_INITIALIZED__ = true;
    const BRIDGE_SOURCE = "OPENAI_PIXEL_BRIDGE_MSG";
    function postToContentScript(action, payload) {
      try {
        window.postMessage(
          {
            source: BRIDGE_SOURCE,
            action,
            payload,
            timestamp: Date.now(),
            url: window.location.href
          },
          "*"
        );
      } catch {
      }
    }
    const OPENAI_URL_PATTERNS = [
      "bzr.openai.com/v1/sdk/events",
      "bzr.openai.com/events",
      "bzrcdn.openai.com/sdk/oaiq",
      "st=oaiq-web"
    ];
    function isOpenAiPixelUrl(url) {
      if (!url || typeof url !== "string") return false;
      return OPENAI_URL_PATTERNS.some((pattern) => url.includes(pattern));
    }
    function parseBody(body) {
      if (!body) return null;
      if (typeof body === "string") {
        try {
          return JSON.parse(body);
        } catch {
          try {
            const params = new URLSearchParams(body);
            const obj = {};
            params.forEach((v, k) => {
              obj[k] = v;
            });
            if (Object.keys(obj).length > 0) return obj;
          } catch {
          }
          return body;
        }
      }
      if (typeof FormData !== "undefined" && body instanceof FormData) {
        const obj = {};
        body.forEach((v, k) => {
          obj[k] = v;
        });
        return obj;
      }
      if (typeof URLSearchParams !== "undefined" && body instanceof URLSearchParams) {
        const obj = {};
        body.forEach((v, k) => {
          obj[k] = v;
        });
        return obj;
      }
      return String(body);
    }
    function handleOaiqCall(args) {
      if (!args || args.length === 0) return;
      const command = String(args[0]).toLowerCase();
      if (command === "init") {
        const pixelId = typeof args[1] === "string" ? args[1] : args[1]?.pixelId;
        if (pixelId) {
          postToContentScript("PIXEL_INIT_CAPTURED", { pixelId });
        }
      } else if (command === "event" || command === "track") {
        const eventName = args[1];
        const params = args[2] || {};
        postToContentScript("PIXEL_EVENT_CAPTURED", {
          captureSource: "oaiq",
          eventName,
          params,
          timestamp: Date.now()
        });
      }
    }
    function wrapOaiq(origOaiq) {
      const wrapped = function(...args) {
        handleOaiqCall(args);
        if (typeof origOaiq === "function") {
          return origOaiq.apply(window, args);
        }
        if (Array.isArray(origOaiq?.q)) {
          origOaiq.q.push(args);
        }
      };
      if (origOaiq && typeof origOaiq === "object" && Array.isArray(origOaiq.q)) {
        wrapped.q = origOaiq.q;
        for (const item of origOaiq.q) {
          if (Array.isArray(item)) handleOaiqCall(item);
        }
      } else if (!wrapped.q) {
        wrapped.q = [];
      }
      return wrapped;
    }
    const existingOaiq = window.oaiq;
    if (typeof existingOaiq !== "undefined") {
      window.oaiq = wrapOaiq(existingOaiq);
    } else {
      let currentOaiq = wrapOaiq();
      try {
        Object.defineProperty(window, "oaiq", {
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
        window.oaiq = currentOaiq;
      }
    }
    setupFetchInterceptor(isOpenAiPixelUrl, parseBody, (data) => {
      postToContentScript("NETWORK_REQUEST_CAPTURED", data);
    });
    setupBeaconInterceptor(isOpenAiPixelUrl, parseBody, (data) => {
      postToContentScript("NETWORK_REQUEST_CAPTURED", data);
    });
    setupXhrInterceptor(isOpenAiPixelUrl, parseBody, (data) => {
      postToContentScript("NETWORK_REQUEST_CAPTURED", data);
    });
    setupDataLayerMonitor((item) => {
      postToContentScript("DATALAYER_PUSH_CAPTURED", { item, timestamp: Date.now() });
    });
    const gtmStatus = detectGtmGlobals();
    if (gtmStatus.gtmActive) {
      postToContentScript("GTM_CONTAINERS_DETECTED", { containerIds: gtmStatus.containerIds });
    }
    setupHistoryInterceptor((url) => {
      postToContentScript("SPA_NAVIGATED", { url, timestamp: Date.now() });
    });
    postToContentScript("BRIDGE_READY", { timestamp: Date.now() });
  })();
})();
