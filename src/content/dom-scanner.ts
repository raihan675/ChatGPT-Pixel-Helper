/**
 * DOM Scanner Service
 * Detects OpenAI pixel script tags, GTM containers, and inline snippets in page DOM.
 */

export interface DomScanResult {
  pixelDetected: boolean;
  pixelIds: string[];
  scriptSources: string[];
  gtmDetected: boolean;
  gtmContainers: string[];
}

export function scanPageDOM(): DomScanResult {
  const result: DomScanResult = {
    pixelDetected: false,
    pixelIds: [],
    scriptSources: [],
    gtmDetected: false,
    gtmContainers: []
  };

  const scripts = Array.from(document.querySelectorAll('script'));
  const OAIQ_SDK_REGEX = /bzrcdn\.openai\.com\/sdk\/oaiq(?:\.min)?\.js/i;
  const GTM_REGEX = /googletagmanager\.com\/gtm\.js\?id=([A-Z0-9-]+)/i;
  const PIXEL_INIT_REGEX = /oaiq\s*\(\s*["']init["']\s*,\s*(?:\{[^}]*pixelId\s*:\s*["']([^"']+)["']|["']([^"']+)["'])/g;

  for (const s of scripts) {
    if (s.src) {
      if (OAIQ_SDK_REGEX.test(s.src)) {
        result.pixelDetected = true;
        result.scriptSources.push(s.src);
      }
      const gtmMatch = s.src.match(GTM_REGEX);
      if (gtmMatch && gtmMatch[1]) {
        result.gtmDetected = true;
        if (!result.gtmContainers.includes(gtmMatch[1])) {
          result.gtmContainers.push(gtmMatch[1]);
        }
      }
    } else if (s.textContent) {
      const text = s.textContent;
      if (text.includes('oaiq')) {
        result.pixelDetected = true;
        let match;
        while ((match = PIXEL_INIT_REGEX.exec(text)) !== null) {
          const pid = match[1] || match[2];
          if (pid && !result.pixelIds.includes(pid)) {
            result.pixelIds.push(pid);
          }
        }
      }
    }
  }

  return result;
}
