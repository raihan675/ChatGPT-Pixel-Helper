/**
 * Main World DataLayer Monitor
 * Proxies window.dataLayer.push to observe e-commerce and marketing data events.
 */

export function setupDataLayerMonitor(onPush: (item: unknown) => void) {
  if (typeof window === 'undefined') return;

  function wrapDataLayer(dl: unknown[]) {
    const origPush = dl.push;
    dl.push = function (...items: unknown[]) {
      for (const item of items) {
        if (item && typeof item === 'object') {
          onPush(item);
        }
      }
      return origPush.apply(dl, items);
    };
  }

  const existingDl = (window as unknown as { dataLayer?: unknown[] }).dataLayer;
  if (Array.isArray(existingDl)) {
    wrapDataLayer(existingDl);
    // Process existing queued items
    for (const item of existingDl) {
      if (item && typeof item === 'object') {
        onPush(item);
      }
    }
  } else {
    let currentDl: unknown[] | undefined = undefined;
    try {
      Object.defineProperty(window, 'dataLayer', {
        configurable: true,
        enumerable: true,
        get() {
          return currentDl;
        },
        set(val) {
          currentDl = val;
          if (Array.isArray(currentDl)) {
            wrapDataLayer(currentDl);
          }
        }
      });
    } catch {}
  }
}
