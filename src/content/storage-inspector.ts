/**
 * Storage & Attribution Inspector
 * Scans cookies, localStorage, and query parameters for OpenAI attribution tokens.
 */

export interface AttributionScanResult {
  oppref: string | null;
  source: 'url' | 'cookie' | 'storage' | null;
  detected: boolean;
}

export function scanPageAttribution(): AttributionScanResult {
  const result: AttributionScanResult = {
    oppref: null,
    source: null,
    detected: false
  };

  // 1. URL parameter check
  try {
    const params = new URLSearchParams(window.location.search);
    const oppref = params.get('oppref');
    if (oppref) {
      result.oppref = oppref;
      result.source = 'url';
      result.detected = true;
      return result;
    }
  } catch {}

  // 2. Cookie check
  try {
    const cookies = document.cookie.split(';');
    for (const c of cookies) {
      const [name, ...rest] = c.trim().split('=');
      if (name === '__oppref') {
        const val = rest.join('=');
        if (val) {
          result.oppref = decodeURIComponent(val);
          result.source = 'cookie';
          result.detected = true;
          return result;
        }
      }
    }
  } catch {}

  // 3. LocalStorage check
  try {
    const stored = localStorage.getItem('__oppref') || localStorage.getItem('oppref');
    if (stored) {
      result.oppref = stored;
      result.source = 'storage';
      result.detected = true;
      return result;
    }
  } catch {}

  return result;
}
