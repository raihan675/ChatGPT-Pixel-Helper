/**
 * Main World Beacon Interceptor
 * Intercepts navigator.sendBeacon calls intended for OpenAI Pixel event endpoints.
 */

export function setupBeaconInterceptor(
  isOpenAiUrl: (url: string) => boolean,
  parseBody: (body: unknown) => unknown,
  onCaptured: (data: Record<string, unknown>) => void
) {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') return;

  const originalSendBeacon = navigator.sendBeacon.bind(navigator);
  navigator.sendBeacon = function (url: string | URL, data?: BodyInit | null) {
    const targetUrl = typeof url === 'string' ? url : url.toString();
    if (isOpenAiUrl(targetUrl)) {
      onCaptured({
        captureSource: 'beacon',
        url: targetUrl,
        method: 'POST',
        payload: parseBody(data),
        status: 200,
        duration: 0
      });
    }
    return originalSendBeacon(url, data);
  };
}
