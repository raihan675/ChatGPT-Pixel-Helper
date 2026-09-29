/**
 * OpenAI Pixel Inspector - Audit Engine
 * Synthesizes event health, network correlation, duplicate rates, and privacy compliance
 * into actionable implementation reports (Markdown, CSV, JSON).
 */

import { TabSessionState, PixelEvent } from '../types';

export interface AuditReportData {
  siteHostname: string;
  generatedAt: string;
  healthScore: number;
  status: 'Optimal' | 'Caution' | 'Critical';
  metrics: {
    totalEvents: number;
    standardEvents: number;
    customEvents: number;
    errorCount: number;
    warningCount: number;
    duplicateCount: number;
    networkSuccessRate: number;
  };
  pixelId: string | null;
  attributionDetected: boolean;
  gtmDetected: boolean;
  criticalFindings: string[];
  recommendedActions: string[];
}

export class AuditEngine {
  /**
   * Evaluates session telemetry and computes transparent health score and findings.
   */
  public static generateAudit(state: TabSessionState): AuditReportData {
    const events = state.events || [];
    const total = events.length;
    const errors = state.stats.errors;
    const warnings = state.stats.warnings;
    const duplicates = state.stats.duplicates;

    let healthScore = 100;
    if (!state.pixelDetected) healthScore -= 35;
    if (errors > 0) healthScore -= Math.min(40, errors * 12);
    if (warnings > 0) healthScore -= Math.min(20, warnings * 4);
    if (duplicates > 0) healthScore -= Math.min(15, duplicates * 5);
    if (!state.attributionDetected) healthScore -= 5;
    if (healthScore < 0) healthScore = 0;

    let status: AuditReportData['status'] = 'Optimal';
    if (healthScore < 60 || errors > 0) status = 'Critical';
    else if (healthScore < 85 || warnings > 0) status = 'Caution';

    const networkTotal = state.networkRequests.length;
    const networkAccepted = state.networkRequests.filter(
      (r) => typeof r.status === 'number' && r.status >= 200 && r.status < 300
    ).length;
    const networkSuccessRate = networkTotal > 0 ? Math.round((networkAccepted / networkTotal) * 100) : 100;

    const criticalFindings: string[] = [];
    const recommendedActions: string[] = [];

    if (!state.pixelDetected) {
      criticalFindings.push('No OpenAI Pixel script tag or oaiq SDK detected on this page.');
      recommendedActions.push("Install the official OpenAI Pixel base code in the site's <head>.");
    }

    if (errors > 0) {
      criticalFindings.push(`Detected ${errors} high-severity parameter or PII validation error(s).`);
      recommendedActions.push('Resolve mandatory parameter requirements and ensure customer PII is SHA-256 hashed.');
    }

    if (duplicates > 0) {
      criticalFindings.push(`Detected ${duplicates} duplicate event invocation(s) within short intervals.`);
      recommendedActions.push('Debounce event triggers and pass unique event_id values for conversion deduplication.');
    }

    if (!state.attributionDetected) {
      recommendedActions.push('Ensure campaign landing pages preserve the __oppref query parameter across redirects.');
    }

    return {
      siteHostname: state.hostname || 'Unknown domain',
      generatedAt: new Date().toISOString(),
      healthScore,
      status,
      metrics: {
        totalEvents: total,
        standardEvents: state.stats.standardEvents,
        customEvents: state.stats.customEvents,
        errorCount: errors,
        warningCount: warnings,
        duplicateCount: duplicates,
        networkSuccessRate
      },
      pixelId: state.pixelIds[0] || null,
      attributionDetected: state.attributionDetected,
      gtmDetected: state.gtmDetected,
      criticalFindings,
      recommendedActions
    };
  }

  /**
   * Generates a clean Markdown audit summary suitable for developers or tickets.
   */
  public static toMarkdown(state: TabSessionState): string {
    const audit = this.generateAudit(state);
    const dateFormatted = new Date().toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });

    return `# OpenAI Pixel Implementation Audit

**Website:** ${audit.siteHostname}  
**Audit Date:** ${dateFormatted}  
**Implementation Health:** ${audit.healthScore}% (${audit.status})  

---

## 📊 Summary Metrics

| Metric | Count / State |
| :--- | :--- |
| **Total Events Observed** | ${audit.metrics.totalEvents} |
| **Standard Events** | ${audit.metrics.standardEvents} |
| **Custom Events** | ${audit.metrics.customEvents} |
| **Validation Errors** | ${audit.metrics.errorCount} |
| **Validation Warnings** | ${audit.metrics.warningCount} |
| **Duplicates Detected** | ${audit.metrics.duplicateCount} |
| **Network Success Rate** | ${audit.metrics.networkSuccessRate}% |
| **Primary Pixel ID** | \`${audit.pixelId || 'None Detected'}\` |
| **OpenAI Attribution (__oppref)** | ${audit.attributionDetected ? 'Preserved' : 'None Detected'} |
| **Google Tag Manager** | ${audit.gtmDetected ? 'Active' : 'Not Detected'} |

---

## 🚨 Critical Findings

${
  audit.criticalFindings.length > 0
    ? audit.criticalFindings.map((f, i) => `${i + 1}. ${f}`).join('\n')
    : '✓ No critical implementation issues detected.'
}

---

## 🛠️ Recommended Actions

${
  audit.recommendedActions.length > 0
    ? audit.recommendedActions.map((a, i) => `${i + 1}. ${a}`).join('\n')
    : '✓ Implementation adheres to all standard specifications.'
}

---

*Generated by ChatGPT Pixel Helper & Inspector v1.0.0*
`;
  }

  /**
   * Generates CSV string of all observed events and validation statuses.
   */
  public static toCsv(events: PixelEvent[]): string {
    const headers = ['Internal ID', 'Actual Event ID', 'Event Name', 'Category', 'Source', 'HTTP Status', 'Validation Status', 'Timestamp', 'Page URL'];
    const rows = events.map((e) => [
      `"${e.internalId}"`,
      `"${e.actualEventId || ''}"`,
      `"${e.name}"`,
      `"${e.category}"`,
      `"${e.captureSource}"`,
      `"${e.httpStatus || ''}"`,
      `"${e.validation.status}"`,
      `"${e.timestampFormatted}"`,
      `"${e.pageUrl.replace(/"/g, '""')}"`
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
