// src/core/constants/index.ts
var OPENAI_ENDPOINTS = [
  "bzr.openai.com/v1/sdk/events",
  "bzr.openai.com/events",
  "bzrcdn.openai.com/sdk/oaiq",
  "/v1/sdk/events",
  "st=oaiq-web"
];
var MESSAGE_ACTIONS = {
  // Bridge -> Content -> Background
  PIXEL_INIT_CAPTURED: "PIXEL_INIT_CAPTURED",
  PIXEL_EVENT_CAPTURED: "PIXEL_EVENT_CAPTURED",
  NETWORK_REQUEST_CAPTURED: "NETWORK_REQUEST_CAPTURED",
  DATALAYER_PUSH_CAPTURED: "DATALAYER_PUSH_CAPTURED",
  PAGE_SCAN_COMPLETED: "PAGE_SCAN_COMPLETED",
  SPA_NAVIGATED: "SPA_NAVIGATED",
  // UI -> Background
  GET_TAB_STATE: "GET_TAB_STATE",
  CLEAR_TAB_STATE: "CLEAR_TAB_STATE",
  GET_SETTINGS: "GET_SETTINGS",
  SAVE_SETTINGS: "SAVE_SETTINGS",
  TRIGGER_PAGE_SCAN: "TRIGGER_PAGE_SCAN",
  // Background -> UI Broadcast
  STATE_UPDATED: "STATE_UPDATED",
  NEW_EVENT: "NEW_EVENT",
  NEW_NETWORK_REQUEST: "NEW_NETWORK_REQUEST"
};
var STORAGE_KEYS = {
  SETTINGS: "chatgpt_pixel_settings",
  TAB_STATE_PREFIX: "chatgpt_tab_state_"
};

// src/background/tab-manager.ts
var TabManager = class {
  tabStates = /* @__PURE__ */ new Map();
  getOrCreateState(tabId, url = "", title = "") {
    if (!this.tabStates.has(tabId)) {
      let hostname = "";
      try {
        if (url) hostname = new URL(url).hostname;
      } catch {
      }
      const defaultState = {
        tabId,
        url,
        title,
        hostname,
        pixelDetected: false,
        pixelIds: [],
        gtmDetected: false,
        gtmContainers: [],
        dataLayerActive: false,
        attributionDetected: false,
        attributionValue: null,
        events: [],
        networkRequests: [],
        stats: {
          totalEvents: 0,
          standardEvents: 0,
          customEvents: 0,
          errors: 0,
          warnings: 0,
          duplicates: 0
        },
        lastUpdated: Date.now()
      };
      this.tabStates.set(tabId, defaultState);
    }
    const state = this.tabStates.get(tabId);
    if (url && state.url !== url) {
      state.url = url;
      try {
        state.hostname = new URL(url).hostname;
      } catch {
      }
    }
    if (title) state.title = title;
    return state;
  }
  getState(tabId) {
    return this.tabStates.get(tabId) || null;
  }
  clearTab(tabId) {
    const existing = this.tabStates.get(tabId);
    const url = existing?.url || "";
    const title = existing?.title || "";
    this.tabStates.delete(tabId);
    this.getOrCreateState(tabId, url, title);
    chrome.storage.local.remove(`${STORAGE_KEYS.TAB_STATE_PREFIX}${tabId}`).catch(() => {
    });
  }
  removeTab(tabId) {
    this.tabStates.delete(tabId);
    chrome.storage.local.remove(`${STORAGE_KEYS.TAB_STATE_PREFIX}${tabId}`).catch(() => {
    });
  }
  async persistState(tabId) {
    const state = this.tabStates.get(tabId);
    if (!state) return;
    try {
      await chrome.storage.local.set({
        [`${STORAGE_KEYS.TAB_STATE_PREFIX}${tabId}`]: state
      });
    } catch {
    }
  }
  async restoreFromStorage() {
    try {
      const all = await chrome.storage.local.get(null);
      for (const [key, value] of Object.entries(all)) {
        if (key.startsWith(STORAGE_KEYS.TAB_STATE_PREFIX) && value && value.tabId) {
          const state = value;
          this.tabStates.set(state.tabId, state);
        }
      }
    } catch {
    }
  }
  addEvent(tabId, event) {
    const state = this.getOrCreateState(tabId);
    state.events.unshift(event);
    state.stats.totalEvents = state.events.length;
    if (event.category === "custom") {
      state.stats.customEvents++;
    } else {
      state.stats.standardEvents++;
    }
    if (event.validation.hasErrors) state.stats.errors++;
    if (event.validation.hasWarnings) state.stats.warnings++;
    if (event.isDuplicate) state.stats.duplicates++;
    state.lastUpdated = Date.now();
    this.persistState(tabId);
  }
  addNetworkRequest(tabId, req) {
    const state = this.getOrCreateState(tabId);
    state.networkRequests.unshift(req);
    if (state.networkRequests.length > 100) {
      state.networkRequests.pop();
    }
    state.lastUpdated = Date.now();
    this.persistState(tabId);
  }
};
var tabManager = new TabManager();

// src/core/messaging/bus.ts
function broadcastStateUpdated(tabId) {
  try {
    const p = chrome.runtime.sendMessage({
      action: "STATE_UPDATED",
      tabId,
      timestamp: Date.now()
    });
    if (p && typeof p.catch === "function") {
      p.catch(() => {
      });
    }
  } catch {
  }
}

// src/background/network-monitor.ts
function isTargetOpenAIUrl(url) {
  if (!url) return false;
  const lower = url.toLowerCase();
  return lower.includes("bzr.openai.com") || lower.includes("bzrcdn.openai.com") || lower.includes("/v1/sdk/events") || lower.includes("/events") && (lower.includes("pid=") || lower.includes("oaiq")) || OPENAI_ENDPOINTS.some((ep) => lower.includes(ep));
}
function initNetworkMonitor() {
  if (typeof chrome === "undefined" || !chrome.webRequest || !chrome.webRequest.onBeforeRequest) {
    return;
  }
  chrome.webRequest.onBeforeRequest.addListener(
    (details) => {
      const { tabId, url, method, requestId, requestBody } = details;
      if (tabId < 0) return;
      if (isTargetOpenAIUrl(url)) {
        let payload = null;
        if (requestBody) {
          if (requestBody.raw && requestBody.raw.length > 0) {
            try {
              const decoder = new TextDecoder("utf-8");
              let str = "";
              for (const part of requestBody.raw) {
                if (part.bytes) str += decoder.decode(part.bytes);
              }
              payload = JSON.parse(str);
            } catch {
              payload = { raw: "Non-JSON or binary payload" };
            }
          } else if (requestBody.formData) {
            payload = requestBody.formData;
          }
        }
        const netReq = {
          id: requestId,
          tabId,
          url,
          method,
          timestamp: Date.now(),
          status: "pending",
          payload,
          correlatedEventIds: []
        };
        tabManager.addNetworkRequest(tabId, netReq);
        broadcastStateUpdated(tabId);
      }
    },
    { urls: ["<all_urls>"] },
    ["requestBody"]
  );
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
    { urls: ["<all_urls>"] }
  );
  chrome.webRequest.onErrorOccurred.addListener(
    (details) => {
      const { tabId, requestId, error } = details;
      if (tabId < 0) return;
      const state = tabManager.getState(tabId);
      if (state) {
        const found = state.networkRequests.find((r) => r.id === requestId);
        if (found) {
          found.status = "failed";
          found.statusText = error;
          found.duration = Date.now() - found.timestamp;
          tabManager.persistState(tabId);
          broadcastStateUpdated(tabId);
        }
      }
    },
    { urls: ["<all_urls>"] }
  );
}

// src/background/service-worker.ts
initNetworkMonitor();
tabManager.restoreFromStorage();
function updateBadge(tabId) {
  const state = tabManager.getState(tabId);
  if (!state || typeof chrome.action === "undefined") return;
  const count = state.stats.totalEvents;
  const errors = state.stats.errors;
  let text = "";
  let color = "#10a37f";
  if (errors > 0) {
    text = `${errors}`;
    color = "#ef4444";
  } else if (count > 0) {
    text = `${count}`;
  } else if (state.pixelDetected) {
    text = "\u2713";
    color = "#3b82f6";
  }
  chrome.action.setBadgeText({ tabId, text }).catch(() => {
  });
  if (text) {
    chrome.action.setBadgeBackgroundColor({ tabId, color }).catch(() => {
    });
  }
}
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "loading" && tab.url) {
    tabManager.getOrCreateState(tabId, tab.url, tab.title || "");
    updateBadge(tabId);
    tabManager.persistState(tabId);
    broadcastStateUpdated(tabId);
  }
});
chrome.tabs.onRemoved.addListener((tabId) => {
  tabManager.removeTab(tabId);
});
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id ?? message.tabId ?? -1;
  switch (message.action) {
    case MESSAGE_ACTIONS.GET_TAB_STATE: {
      const state = tabId >= 0 ? tabManager.getOrCreateState(tabId) : null;
      sendResponse({ state });
      break;
    }
    case MESSAGE_ACTIONS.CLEAR_TAB_STATE: {
      if (tabId >= 0) {
        tabManager.clearTab(tabId);
        updateBadge(tabId);
        broadcastStateUpdated(tabId);
      }
      sendResponse({ success: true });
      break;
    }
    case MESSAGE_ACTIONS.PIXEL_INIT_CAPTURED: {
      if (tabId >= 0) {
        const state = tabManager.getOrCreateState(tabId);
        state.pixelDetected = true;
        const data = message.data;
        if (data?.pixelId && !state.pixelIds.includes(data.pixelId)) {
          state.pixelIds.push(data.pixelId);
        }
        updateBadge(tabId);
        tabManager.persistState(tabId);
        broadcastStateUpdated(tabId);
      }
      sendResponse({ success: true });
      break;
    }
    case MESSAGE_ACTIONS.PIXEL_EVENT_CAPTURED: {
      if (tabId >= 0 && message.data) {
        const event = message.data;
        tabManager.addEvent(tabId, event);
        updateBadge(tabId);
        broadcastStateUpdated(tabId);
      }
      sendResponse({ success: true });
      break;
    }
    case MESSAGE_ACTIONS.DATALAYER_PUSH_CAPTURED: {
      if (tabId >= 0) {
        const state = tabManager.getOrCreateState(tabId);
        state.dataLayerActive = true;
        tabManager.persistState(tabId);
        broadcastStateUpdated(tabId);
      }
      sendResponse({ success: true });
      break;
    }
    case MESSAGE_ACTIONS.PAGE_SCAN_COMPLETED: {
      if (tabId >= 0 && message.data) {
        const data = message.data;
        const state = tabManager.getOrCreateState(tabId);
        Object.assign(state, data);
        updateBadge(tabId);
        tabManager.persistState(tabId);
        broadcastStateUpdated(tabId);
      }
      sendResponse({ success: true });
      break;
    }
    default:
      sendResponse({ status: "unknown_action" });
      break;
  }
  return true;
});
console.info(`[${MESSAGE_ACTIONS.STATE_UPDATED}] Background service worker initialized.`);
