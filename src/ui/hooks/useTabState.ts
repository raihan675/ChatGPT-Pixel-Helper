/**
 * React Hook: useTabState
 * Subscribes to live tab session state from background service worker.
 */

import { useState, useEffect, useCallback } from 'react';
import { TabSessionState } from '../../core/types';
import { MESSAGE_ACTIONS } from '../../core/constants';

export function useTabState() {
  const [state, setState] = useState<TabSessionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabId, setActiveTabId] = useState<number | null>(null);

  // Fetch active tab and request its state
  const fetchState = useCallback(async () => {
    try {
      let tabId: number | undefined;

      // In DevTools panel, chrome.devtools.inspectedWindow.tabId is available
      if (typeof chrome !== 'undefined' && chrome.devtools?.inspectedWindow?.tabId) {
        tabId = chrome.devtools.inspectedWindow.tabId;
      } else if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
        const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
        tabId = tabs[0]?.id;
      }

      if (typeof tabId === 'number' && tabId >= 0) {
        setActiveTabId(tabId);
        chrome.runtime.sendMessage(
          { action: MESSAGE_ACTIONS.GET_TAB_STATE, tabId },
          (response) => {
            if (response?.state) {
              setState(response.state);
            }
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchState();

    // Listen for background state update broadcasts
    const messageListener = (message: { action: string; tabId?: number; data?: unknown }) => {
      if (message.action === MESSAGE_ACTIONS.STATE_UPDATED) {
        if (!activeTabId || message.tabId === activeTabId) {
          fetchState();
        }
      }
    };

    chrome.runtime?.onMessage?.addListener(messageListener);
    return () => {
      chrome.runtime?.onMessage?.removeListener(messageListener);
    };
  }, [fetchState, activeTabId]);

  const clearState = useCallback(() => {
    if (activeTabId !== null) {
      chrome.runtime.sendMessage(
        { action: MESSAGE_ACTIONS.CLEAR_TAB_STATE, tabId: activeTabId },
        () => {
          fetchState();
        }
      );
    }
  }, [activeTabId, fetchState]);

  const triggerScan = useCallback(() => {
    if (activeTabId !== null) {
      chrome.tabs.sendMessage(activeTabId, { action: MESSAGE_ACTIONS.TRIGGER_PAGE_SCAN }, () => {
        fetchState();
      });
    }
  }, [activeTabId, fetchState]);

  return { state, loading, activeTabId, clearState, triggerScan, refresh: fetchState };
}
