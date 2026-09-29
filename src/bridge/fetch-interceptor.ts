/**
 * Main World Fetch Interceptor
 * Transparently observes outgoing fetch requests to OpenAI Pixel endpoints without tampering.
 */

export function setupFetchInterceptor(
  isOpenAiUrl: (url: string) => boolean,
  parseBody: (body: unknown) => unknown,
  onCaptured: (data: Record<string, unknown>) => void
) {
  if (typeof window === 'undefined' || typeof window.fetch !== 'function') return;

  const originalFetch = window.fetch;
  window.fetch = async function (...args) {
    const input = args[0];
    const init = args[1];
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input?.url;

    if (url && isOpenAiUrl(url)) {
      const method = init?.method || (typeof input === 'object' && 'method' in input ? (input as Request).method : 'GET');
      const parsed = parseBody(init?.body);
      const startTime = Date.now();

      try {
        const response = await originalFetch.apply(window, args);
        const cloned = response.clone();
        cloned.text().then((text) => {
          onCaptured({
            captureSource: 'fetch',
            url,
            method,
            payload: parsed,
            status: response.status,
            duration: Date.now() - startTime,
            responseBody: text.slice(0, 500)
          });
        }).catch(() => {
          onCaptured({
            captureSource: 'fetch',
            url,
            method,
            payload: parsed,
            status: response.status,
            duration: Date.now() - startTime
          });
        });
        return response;
      } catch (err) {
        onCaptured({
          captureSource: 'fetch',
          url,
          method,
          payload: parsed,
          status: 'failed',
          duration: Date.now() - startTime,
          error: String(err)
        });
        throw err;
      }
    }

    return originalFetch.apply(window, args);
  };
}
