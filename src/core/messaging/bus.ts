/**
 * Central Message Bus for Manifest V3
 * Provides type-safe messaging with automatic error boundary handling.
 */

import { RuntimeMessage } from '../types';

export function sendRuntimeMessage<T = unknown, R = unknown>(
  action: string,
  data?: T,
  tabId?: number
): Promise<R | null> {
  return new Promise((resolve) => {
    try {
      const message: RuntimeMessage<T> = {
        action,
        data,
        tabId,
        timestamp: Date.now()
      };

      chrome.runtime.sendMessage(message, (response: R) => {
        if (chrome.runtime.lastError) {
          // Channel closed or receiver does not exist (e.g. popup closed)
          resolve(null);
        } else {
          resolve(response);
        }
      });
    } catch {
      resolve(null);
    }
  });
}

export function broadcastStateUpdated(tabId: number): void {
  try {
    const p = chrome.runtime.sendMessage({
      action: 'STATE_UPDATED',
      tabId,
      timestamp: Date.now()
    });
    if (p && typeof p.catch === 'function') {
      p.catch(() => {});
    }
  } catch {}
}

export function sendTabMessage<T = unknown, R = unknown>(
  tabId: number,
  action: string,
  data?: T
): Promise<R | null> {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { action, data, timestamp: Date.now() }, (response: R) => {
        if (chrome.runtime.lastError) {
          resolve(null);
        } else {
          resolve(response);
        }
      });
    } catch {
      resolve(null);
    }
  });
}
