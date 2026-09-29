/**
 * ChatGPT Pixel Helper & Inspector - Background Service Worker (Manifest V3)
 * Orchestrates event persistence, network monitoring, tab isolation, and UI state synchronization.
 */

import { tabManager } from './tab-manager';
import { initNetworkMonitor } from './network-monitor';
import { MESSAGE_ACTIONS } from '../core/constants';
import { RuntimeMessage, PixelEvent } from '../core/types';
import { broadcastStateUpdated } from '../core/messaging/bus';

// Initialize network request observation
initNetworkMonitor();

// Restore persisted session journey on worker startup
tabManager.restoreFromStorage();

function updateBadge(tabId: number): void {
  const state = tabManager.getState(tabId);
  if (!state || typeof chrome.action === 'undefined') return;

  const count = state.stats.totalEvents;
  const errors = state.stats.errors;

  let text = '';
  let color = '#10a37f'; // OpenAI green

  if (errors > 0) {
    text = `${errors}`;
    color = '#ef4444'; // Red
  } else if (count > 0) {
    text = `${count}`;
  } else if (state.pixelDetected) {
    text = '✓';
    color = '#3b82f6'; // Blue
  }

  chrome.action.setBadgeText({ tabId, text }).catch(() => {});
  if (text) {
    chrome.action.setBadgeBackgroundColor({ tabId, color }).catch(() => {});
  }
}

// Tab navigation lifecycle
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading' && tab.url) {
    tabManager.getOrCreateState(tabId, tab.url, tab.title || '');
    updateBadge(tabId);
    tabManager.persistState(tabId);
    broadcastStateUpdated(tabId);
  }
});

// Tab removal cleanup
chrome.tabs.onRemoved.addListener((tabId) => {
  tabManager.removeTab(tabId);
});

// Message dispatch router
chrome.runtime.onMessage.addListener((message: RuntimeMessage, sender, sendResponse) => {
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
        const data = message.data as { pixelId?: string };
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
        const event = message.data as PixelEvent;
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
        const data = message.data as Partial<typeof state>;
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
      sendResponse({ status: 'unknown_action' });
      break;
  }

  return true; // Asynchronous sendResponse support
});

console.info(`[${MESSAGE_ACTIONS.STATE_UPDATED}] Background service worker initialized.`);
