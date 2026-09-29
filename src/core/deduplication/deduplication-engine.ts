/**
 * OpenAI Pixel Inspector - Duplicate Event Detection Engine
 * Detects rapid duplicate dispatches while distinguishing legitimate repeated actions.
 */

import { PixelEvent } from '../types';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateType?: 'exact' | 'likely' | 'legitimate_repeat';
  reason?: string;
  matchedEventInternalId?: string;
}

export class DeduplicationEngine {
  private static DUPLICATE_WINDOW_MS = 3000;

  /**
   * Generates a structural footprint hash of significant event properties.
   */
  private static computePayloadFootprint(event: PixelEvent): string {
    const p = event.normalizedPayload;
    const significant = {
      name: event.name,
      value: p.value || p.amount,
      currency: p.currency,
      content_ids: p.content_ids,
      order_id: p.order_id
    };
    return JSON.stringify(significant);
  }

  /**
   * Evaluates an incoming event against previously recorded events in the session.
   */
  public static evaluateEvent(
    incoming: PixelEvent,
    history: PixelEvent[],
    windowMs = DeduplicationEngine.DUPLICATE_WINDOW_MS
  ): DuplicateCheckResult {
    const incomingFootprint = this.computePayloadFootprint(incoming);

    for (const prev of history) {
      if (prev.internalId === incoming.internalId) continue;

      const timeDelta = Math.abs(incoming.timestamp - prev.timestamp);
      if (timeDelta > windowMs) continue;

      // 1. Exact Duplicate by Actual Event ID
      if (
        incoming.actualEventId &&
        prev.actualEventId &&
        incoming.actualEventId === prev.actualEventId
      ) {
        return {
          isDuplicate: true,
          duplicateType: 'exact',
          reason: `Exact duplicate: Shared actual event_id "${incoming.actualEventId}" fired ${timeDelta}ms apart.`,
          matchedEventInternalId: prev.internalId
        };
      }

      // 2. Exact Duplicate by Matching Payload Footprint & Event Name
      if (incoming.name === prev.name) {
        const prevFootprint = this.computePayloadFootprint(prev);
        if (incomingFootprint === prevFootprint) {
          // If it's a Purchase or PageView with identical payload fired within short window, it's an exact duplicate
          return {
            isDuplicate: true,
            duplicateType: 'exact',
            reason: `Identical payload fired within ${timeDelta}ms for event "${incoming.name}".`,
            matchedEventInternalId: prev.internalId
          };
        }

        // 3. Same Event Name on Same URL within very short window (< 1000ms) with different items
        if (timeDelta < 1000 && incoming.pageUrl === prev.pageUrl) {
          return {
            isDuplicate: false,
            duplicateType: 'legitimate_repeat',
            reason: `Rapid subsequent event fired with distinct payload parameters.`,
            matchedEventInternalId: prev.internalId
          };
        }
      }
    }

    return {
      isDuplicate: false
    };
  }
}
