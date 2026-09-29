# ChatGPT Pixel Helper & Inspector

> **Professional Chrome DevTools & Extension for OpenAI Pixel, Attribution, and Event Verification**

A high-performance Chrome Extension built with **Manifest V3**, **React 18**, **TypeScript**, and **Tailwind CSS**. It inspects, validates, and diagnoses OpenAI Pixel events, tracking payloads, network journeys, and `__oppref` campaign attribution in real time.

---

## 🌟 Key Highlights

* **Organized Parameter Grouping**:
  * **Category A: Pixel / Data-Source Identification** (`pid`, `st`, `sv`, `ec`)
  * **Category B: Event Data** (`ev`, `eid`, `value`, `currency`, `content_ids`, custom params)
  * **Category C: Technical / Device Context** (`pageUrl`, `ref`, `ts`, `sr`, `vp`, `title`)
  * **Category D: Attribution & Identity** (`__oppref`, `_oaiq`, `em`, `ph`)
* **Dual Interception (Main World + Background Network)**:
  * Hooks `window.oaiq`, `fetch`, `navigator.sendBeacon`, `XMLHttpRequest`, and `window.dataLayer` in the MAIN execution world.
  * Correlates client dispatches with real `chrome.webRequest` HTTP status codes (`200 OK`, `202 Accepted`, `ERR_BLOCKED_BY_CLIENT`).
* **Attribution Preservation**:
  * Real-time extraction of OpenAI campaign token (`__oppref`) across URLs, first-party cookies, and localStorage.
* **Security & ISO Validation**:
  * Live warning on unhashed customer PII (plain-text emails or phone numbers).
  * Strict ISO 4217 currency checks and conversion value audits.
* **Triple Display Surfaces**:
  * Action Popup, Chrome Side Panel, and Chrome DevTools dedicated panel.

---

## 🚀 Installation & Development

### 1. Build the Extension
```bash
# Install dependencies
npm install

# Build production bundle to dist/
npm run build
```

### 2. Load into Google Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** in the top-right corner.
3. Click **Load unpacked**.
4. Select the `dist/` directory located inside this repository (`ChatGPT-Pixel-Helper/dist`).

---

## 📄 License
MIT
