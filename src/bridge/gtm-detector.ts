/**
 * Main World GTM Detector
 * Identifies active Google Tag Manager containers and dataLayer presence.
 */

export function detectGtmGlobals(): { gtmActive: boolean; containerIds: string[] } {
  if (typeof window === 'undefined') {
    return { gtmActive: false, containerIds: [] };
  }

  const containerIds: string[] = [];
  const gtmGlobal = (window as unknown as { google_tag_manager?: Record<string, unknown> }).google_tag_manager;

  if (gtmGlobal && typeof gtmGlobal === 'object') {
    for (const key of Object.keys(gtmGlobal)) {
      if (/^GTM-[A-Z0-9]+$/i.test(key) && !containerIds.includes(key)) {
        containerIds.push(key);
      }
    }
  }

  return {
    gtmActive: containerIds.length > 0 || Boolean(gtmGlobal),
    containerIds
  };
}
