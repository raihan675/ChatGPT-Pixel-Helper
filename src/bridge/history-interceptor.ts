/**
 * Main World History & SPA Navigation Interceptor
 * Observes pushState, replaceState, and popstate navigation events.
 */

export function setupHistoryInterceptor(onNavigated: (url: string) => void) {
  if (typeof window === 'undefined' || typeof history === 'undefined') return;

  const origPushState = history.pushState;
  history.pushState = function (...args) {
    origPushState.apply(this, args);
    onNavigated(window.location.href);
  };

  const origReplaceState = history.replaceState;
  history.replaceState = function (...args) {
    origReplaceState.apply(this, args);
    onNavigated(window.location.href);
  };

  window.addEventListener('popstate', () => onNavigated(window.location.href));
  window.addEventListener('hashchange', () => onNavigated(window.location.href));
}
