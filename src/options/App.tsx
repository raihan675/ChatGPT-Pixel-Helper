import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, CheckCircle, RefreshCcw } from 'lucide-react';
import { DEFAULT_SETTINGS, STORAGE_KEYS } from '../core/constants';
import { ExtensionSettings } from '../core/types';

export const App: React.FC = () => {
  const [settings, setSettings] = useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    chrome.storage?.local?.get(STORAGE_KEYS.SETTINGS, (result) => {
      if (result && result[STORAGE_KEYS.SETTINGS]) {
        setSettings({ ...DEFAULT_SETTINGS, ...result[STORAGE_KEYS.SETTINGS] });
      }
    });
  }, []);

  const handleToggle = (key: keyof ExtensionSettings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSave = () => {
    chrome.storage?.local?.set({ [STORAGE_KEYS.SETTINGS]: settings }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    chrome.storage?.local?.set({ [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS }, () => {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 flex justify-center font-sans antialiased">
      <div className="w-full max-w-2xl">
        <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-slate-800">
          <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-400 border border-brand-500/20">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Extension Settings</h1>
            <p className="text-xs text-slate-400">Configure ChatGPT Pixel Helper & Inspector behavior</p>
          </div>
        </div>

        {/* Network & Capture Preferences */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center space-x-2 mb-4 text-sm font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-brand-400" />
            <span>Network & Capture Preferences</span>
          </div>

          <div className="space-y-3">
            {[
              { key: 'captureNetwork', label: 'Capture Chrome WebRequests', desc: 'Observe HTTP status and network transport' },
              { key: 'captureFetch', label: 'Intercept window.fetch', desc: 'Inspect in-page fetch calls to OpenAI endpoints' },
              { key: 'captureBeacon', label: 'Intercept navigator.sendBeacon', desc: 'Capture background beacon tracking calls' },
              { key: 'captureXHR', label: 'Intercept XMLHttpRequest', desc: 'Capture legacy AJAX calls' }
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-slate-800/40">
                <div>
                  <div className="text-xs font-medium text-slate-200">{item.label}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings[item.key as keyof ExtensionSettings])}
                  onChange={() => handleToggle(item.key as keyof ExtensionSettings)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Validation & Audit Settings */}
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center space-x-2 mb-4 text-sm font-semibold text-slate-200">
            <Shield className="w-4 h-4 text-amber-400" />
            <span>Validation & Security Audits</span>
          </div>

          <div className="space-y-3">
            {[
              { key: 'validateEvents', label: 'Real-time Event Validation', desc: 'Check required parameters and ISO currency rules' },
              { key: 'detectPII', label: 'PII Exposure Warning', desc: 'Flag unhashed customer emails or phone numbers in payloads' },
              { key: 'detectDuplicates', label: 'Duplicate Detection', desc: 'Flag identical events fired within a 3-second window' }
            ].map((item) => (
              <label key={item.key} className="flex items-center justify-between cursor-pointer p-2 rounded hover:bg-slate-800/40">
                <div>
                  <div className="text-xs font-medium text-slate-200">{item.label}</div>
                  <div className="text-[11px] text-slate-400">{item.desc}</div>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(settings[item.key as keyof ExtensionSettings])}
                  onChange={() => handleToggle(item.key as keyof ExtensionSettings)}
                  className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-brand-500 focus:ring-brand-500"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 rounded-lg border border-slate-700 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>Reset to Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center space-x-1.5 rounded-lg bg-brand-600 px-5 py-2 text-xs font-medium text-white hover:bg-brand-500 transition shadow-sm"
          >
            {saved ? <CheckCircle className="w-3.5 h-3.5 text-white" /> : null}
            <span>{saved ? 'Saved!' : 'Save Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
