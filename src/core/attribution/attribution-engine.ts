/**
 * OpenAI Pixel Inspector - Attribution Engine
 * Analyzes campaign attribution preservation across URL parameters, cookies, and local storage.
 */

export interface AttributionSnapshot {
  hasAttribution: boolean;
  token: string | null;
  sourcesFound: Array<'url' | 'cookie' | 'localStorage' | 'sessionStorage'>;
  primarySource: 'url' | 'cookie' | 'storage' | null;
  firstSeen?: number;
  lastUpdated?: number;
  isPreserved: boolean;
}

export class AttributionEngine {
  /**
   * Resolves unified attribution state from raw inspection readings.
   */
  public static resolveAttribution(options: {
    urlParam?: string | null;
    cookieVal?: string | null;
    storageVal?: string | null;
  }): AttributionSnapshot {
    const sourcesFound: Array<'url' | 'cookie' | 'localStorage' | 'sessionStorage'> = [];
    let token: string | null = null;
    let primarySource: 'url' | 'cookie' | 'storage' | null = null;

    if (options.urlParam) {
      token = options.urlParam;
      sourcesFound.push('url');
      primarySource = 'url';
    }

    if (options.cookieVal) {
      if (!token) token = options.cookieVal;
      sourcesFound.push('cookie');
      if (!primarySource) primarySource = 'cookie';
    }

    if (options.storageVal) {
      if (!token) token = options.storageVal;
      sourcesFound.push('localStorage');
      if (!primarySource) primarySource = 'storage';
    }

    // Preservation check: if token was captured in URL, was it also stored in cookie/storage for multi-page persistence?
    const isPreserved = Boolean(
      token && (sourcesFound.includes('cookie') || sourcesFound.includes('localStorage'))
    );

    return {
      hasAttribution: Boolean(token),
      token,
      sourcesFound,
      primarySource,
      isPreserved
    };
  }
}
