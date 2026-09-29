/**
 * OpenAI Pixel Inspector - Comprehensive Schema & Parameter Validation Engine
 * Validates events against knowledge dictionaries, ISO 4217 minor-unit rules,
 * and PII privacy criteria without mutating payloads.
 */

import { PixelEvent, ValidationResult, ValidationFinding } from '../types';
import { lookupEvent } from '../../dictionary/events';
import { checkMonetaryFormat } from '../../dictionary/currencies';
import { PrivacyEngine } from '../privacy/privacy-engine';
import { lookupError } from '../../dictionary/errors';

export function validatePixelEvent(event: PixelEvent): ValidationResult {
  const findings: ValidationFinding[] = [];
  const p = event.normalizedPayload;
  const eventDef = lookupEvent(event.name);

  // 1. Missing Pixel ID validation
  if (!event.pixelId) {
    const err = lookupError('REQ_PIXEL_ID');
    findings.push({
      severity: 'error',
      ruleId: 'REQ_PIXEL_ID',
      parameterPath: 'pid',
      receivedValue: event.pixelId,
      expectedValue: err?.expectedDescription || 'Alphanumeric Pixel ID string',
      explanation: err?.whyItMatters || 'No Pixel ID was attached to this event.',
      recommendedFix: err?.recommendedFix || "Call oaiq('init', 'PID') prior to tracking."
    });
  }

  // 2. Event-specific Required Parameters Check
  if (eventDef.requiredParameters && eventDef.requiredParameters.length > 0) {
    for (const reqParam of eventDef.requiredParameters) {
      const val = p[reqParam];
      if (val === undefined || val === null || val === '') {
        findings.push({
          severity: 'error',
          ruleId: `REQ_PARAM_${reqParam.toUpperCase()}`,
          parameterPath: reqParam,
          receivedValue: val,
          expectedValue: `Parameter "${reqParam}" is required for event ${event.name}`,
          explanation: `The event "${event.name}" is missing mandatory parameter "${reqParam}".`,
          recommendedFix: `Include "${reqParam}" in the event payload.`
        });
      }
    }
  }

  // 3. Monetary Amount & Currency Validation
  const val = p.value !== undefined ? p.value : p.amount !== undefined ? p.amount : p.val;
  const cur = (p.currency || p.cur) as string | undefined;

  if (cur) {
    const monetaryCheck = checkMonetaryFormat(val, cur);
    if (!monetaryCheck.isValid && monetaryCheck.warning) {
      findings.push({
        severity: 'error',
        ruleId: 'MONETARY_AMOUNT_INVALID',
        parameterPath: p.value !== undefined ? 'value' : 'amount',
        receivedValue: val,
        expectedValue: `Valid numeric amount for ${cur}`,
        explanation: monetaryCheck.warning,
        recommendedFix: monetaryCheck.suggestedMinorUnit
          ? `Provide minor unit integer: ${monetaryCheck.suggestedMinorUnit}`
          : 'Send a clean positive number.'
      });
    } else if (monetaryCheck.warning) {
      findings.push({
        severity: 'warning',
        ruleId: 'MONETARY_UNIT_MISMATCH',
        parameterPath: p.value !== undefined ? 'value' : 'amount',
        receivedValue: val,
        expectedValue: 'Matching integer minor units or standard float',
        explanation: monetaryCheck.warning,
        recommendedFix: monetaryCheck.suggestedMinorUnit
          ? `If your server integration expects integer minor units (cents), send ${monetaryCheck.suggestedMinorUnit}.`
          : undefined
      });
    }
  }

  // 4. Privacy & PII Inspection
  const privacyIssues = PrivacyEngine.scanObject(p);
  for (const pi of privacyIssues) {
    findings.push({
      severity: pi.severity,
      ruleId: `PII_${pi.piiType.toUpperCase()}`,
      parameterPath: pi.parameterPath,
      receivedValue: '[REDACTED_PII]',
      expectedValue: 'SHA-256 Hashed String or omitted',
      explanation: pi.reason,
      recommendedFix: pi.recommendedAction
    });
  }

  // 5. Attribution Information Warning (Info)
  if (!event.attribution?.oppref && !p.oppref) {
    const attrInfo = lookupError('ATTR_NO_OPPREF');
    findings.push({
      severity: 'info',
      ruleId: 'ATTR_NO_OPPREF',
      parameterPath: 'oppref',
      receivedValue: null,
      expectedValue: attrInfo?.expectedDescription || 'OpenAI attribution token (__oppref)',
      explanation: attrInfo?.whyItMatters || 'No __oppref campaign parameter was attached to this event.',
      recommendedFix: attrInfo?.recommendedFix || 'Traffic originating from ChatGPT Ads will automatically attach __oppref.'
    });
  }

  // 6. Deduplication Warning if already flagged
  if (event.isDuplicate && event.duplicateReason) {
    findings.push({
      severity: 'warning',
      ruleId: 'DUPLICATE_EVENT_DETECTED',
      parameterPath: 'event_id',
      receivedValue: event.actualEventId || 'none',
      expectedValue: 'Unique event per user action',
      explanation: event.duplicateReason,
      recommendedFix: 'Implement client debouncing or supply distinct event_id parameters.'
    });
  }

  const hasErrors = findings.some((f) => f.severity === 'error');
  const hasWarnings = findings.some((f) => f.severity === 'warning');

  let score = 100;
  if (hasErrors) score -= 40;
  if (hasWarnings) score -= 20;
  if (score < 0) score = 0;

  let status: ValidationResult['status'] = 'valid';
  if (hasErrors) status = 'error';
  else if (hasWarnings) status = 'warning';

  return {
    status,
    score,
    findings,
    hasErrors,
    hasWarnings
  };
}
