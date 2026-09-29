/**
 * Correlation Engine Foundation
 * Maps pixel invocation events to corresponding network requests and HTTP responses.
 */

import { PixelEvent, NetworkRequest } from '../core/types';

export class CorrelationEngine {
  public static correlate(event: PixelEvent, requests: NetworkRequest[]): string | null {
    // Find closest network request in time (within 3 seconds) matching endpoint
    for (const req of requests) {
      const timeDiff = Math.abs(req.timestamp - event.timestamp);
      if (timeDiff < 3000 && !req.correlatedEventIds.includes(event.internalId)) {
        req.correlatedEventIds.push(event.internalId);
        event.networkRequestId = req.id;
        event.httpStatus = typeof req.status === 'number' ? req.status : undefined;
        event.networkStatus = req.status === 200 || req.status === 202 ? 'accepted' : (req.status === 'failed' ? 'failed' : 'sent');
        return req.id;
      }
    }
    return null;
  }
}
