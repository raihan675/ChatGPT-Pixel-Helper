/**
 * Chrome DevTools extension bootstrap
 * Registers the "ChatGPT Pixel" panel inside Chrome DevTools.
 */

if (typeof chrome !== 'undefined' && chrome.devtools && chrome.devtools.panels) {
  chrome.devtools.panels.create(
    'ChatGPT Pixel',
    'icons/icon32.png',
    'devtools-panel.html',
    (_panel) => {
      // Panel initialized
    }
  );
}
