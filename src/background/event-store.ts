/**
 * Event Store Service
 * Manages event lifecycle, deduplication checks, and per-tab history bounds.
 */

import { PixelEvent } from '../core/types';
import { tabManager } from './tab-manager';

export class EventStore {
  private static MAX_EVENTS_PER_TAB = 300;

  public static insertEvent(tabId: number, event: PixelEvent): void {
    const state = tabManager.getOrCreateState(tabId);
    if (state.events.length >= this.MAX_EVENTS_PER_TAB) {
      state.events.pop();
    }
    tabManager.addEvent(tabId, event);
  }

  public static getEvents(tabId: number): PixelEvent[] {
    const state = tabManager.getState(tabId);
    return state?.events || [];
  }
}
