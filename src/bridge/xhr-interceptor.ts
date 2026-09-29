/**
 * Main World XMLHttpRequest Interceptor
 * Intercepts AJAX requests directed toward OpenAI Pixel endpoints.
 */

export function setupXhrInterceptor(
  isOpenAiUrl: (url: string) => boolean,
  parseBody: (body: unknown) => unknown,
  onCaptured: (data: Record<string, unknown>) => void
) {
  if (typeof XMLHttpRequest === 'undefined') return;

  const origOpen = XMLHttpRequest.prototype.open;
  const origSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function (
    this: XMLHttpRequest & { _pixelUrl?: string; _pixelMethod?: string },
    ...args: unknown[]
  ) {
    this._pixelMethod = String(args[0]);
    this._pixelUrl = String(args[1]);
    return (origOpen as Function).apply(this, args);
  };

  XMLHttpRequest.prototype.send = function (
    this: XMLHttpRequest & { _pixelUrl?: string; _pixelMethod?: string },
    body?: Document | XMLHttpRequestBodyInit | null
  ) {
    if (this._pixelUrl && isOpenAiUrl(this._pixelUrl)) {
      const url = this._pixelUrl;
      const method = this._pixelMethod || 'GET';
      const parsed = parseBody(body);
      const startTime = Date.now();

      this.addEventListener('load', () => {
        onCaptured({
          captureSource: 'xhr',
          url,
          method,
          payload: parsed,
          status: this.status,
          duration: Date.now() - startTime
        });
      });

      this.addEventListener('error', () => {
        onCaptured({
          captureSource: 'xhr',
          url,
          method,
          payload: parsed,
          status: 'failed',
          duration: Date.now() - startTime
        });
      });
    }

    return origSend.apply(this, [body]);
  };
}
