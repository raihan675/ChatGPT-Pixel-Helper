/**
 * Background Tab Manager & Storage Sync
 * Isolates state per tab and persists sessions to chrome.storage.local.
 */

import { TabSessionState, PixelEvent, NetworkRequest } from '../core/types';
import { STORAGE_KEYS } from '../core/constants';

class TabManager {
  private tabStates: Map<number, TabSessionState> = new Map();

  public getOrCreateState(tabId: number, url = '', title = ''): TabSessionState {
    if (!this.tabStates.has(tabId)) {
      let hostname = '';
      try {
        if (url) hostname = new URL(url).hostname;
      } catch {}

      const defaultState: TabSessionState = {
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

    const state = this.tabStates.get(tabId)!;
    if (url && state.url !== url) {
      state.url = url;
      try {
        state.hostname = new URL(url).hostname;
      } catch {}
    }
    if (title) state.title = title;
    return state;
  }

  public getState(tabId: number): TabSessionState | null {
    return this.tabStates.get(tabId) || null;
  }

  public clearTab(tabId: number): void {
    const existing = this.tabStates.get(tabId);
    const url = existing?.url || '';
    const title = existing?.title || '';
    this.tabStates.delete(tabId);
    this.getOrCreateState(tabId, url, title);
    chrome.storage.local.remove(`${STORAGE_KEYS.TAB_STATE_PREFIX}${tabId}`).catch(() => {});
  }

  public removeTab(tabId: number): void {
    this.tabStates.delete(tabId);
    chrome.storage.local.remove(`${STORAGE_KEYS.TAB_STATE_PREFIX}${tabId}`).catch(() => {});
  }

  public async persistState(tabId: number): Promise<void> {
    const state = this.tabStates.get(tabId);
    if (!state) return;
    try {
      await chrome.storage.local.set({
        [`${STORAGE_KEYS.TAB_STATE_PREFIX}${tabId}`]: state
      });
    } catch {}
  }

  public async restoreFromStorage(): Promise<void> {
    try {
      const all = await chrome.storage.local.get(null);
      for (const [key, value] of Object.entries(all)) {
        if (key.startsWith(STORAGE_KEYS.TAB_STATE_PREFIX) && value && (value as TabSessionState).tabId) {
          const state = value as TabSessionState;
          this.tabStates.set(state.tabId, state);
        }
      }
    } catch {}
  }

  public addEvent(tabId: number, event: PixelEvent): void {
    const state = this.getOrCreateState(tabId);
    state.events.unshift(event); // newest first
    state.stats.totalEvents = state.events.length;
    if (event.category === 'custom') {
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

  public addNetworkRequest(tabId: number, req: NetworkRequest): void {
    const state = this.getOrCreateState(tabId);
    state.networkRequests.unshift(req);
    if (state.networkRequests.length > 100) {
      state.networkRequests.pop();
    }
    state.lastUpdated = Date.now();
    this.persistState(tabId);
  }
}

export const tabManager = new TabManager();
