/**
 * OpenAI Pixel Inspector - Session Journey & Funnel Engine
 * Tracks chronological event sequences across pages, detects missing funnel steps,
 * and identifies abnormal event ordering.
 */

import { PixelEvent } from '../types';

export interface FunnelStep {
  stepIndex: number;
  expectedEvent: string;
  actualEvent?: PixelEvent;
  isCompleted: boolean;
  timestamp?: number;
  timeFromPreviousMs?: number;
}

export interface FunnelAnalysis {
  funnelType: 'ecommerce' | 'leadgen' | 'subscription' | 'generic';
  steps: FunnelStep[];
  isComplete: boolean;
  missingSteps: string[];
  anomalies: string[];
  conversionAchieved: boolean;
}

export class JourneyEngine {
  private static ECOM_STANDARD_PATH = ['ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'];
  private static ECOM_ALIASES: Record<string, string> = {
    contents_viewed: 'ViewContent',
    viewcontent: 'ViewContent',
    items_added: 'AddToCart',
    addtocart: 'AddToCart',
    add_to_cart: 'AddToCart',
    checkout_started: 'InitiateCheckout',
    initiatecheckout: 'InitiateCheckout',
    initiate_checkout: 'InitiateCheckout',
    order_created: 'Purchase',
    purchase: 'Purchase'
  };

  /**
   * Normalizes standard event names to canonical funnel milestones.
   */
  private static mapToCanonical(name: string): string | null {
    const lower = name.toLowerCase().replace(/[\s_-]/g, '');
    for (const [alias, canonical] of Object.entries(this.ECOM_ALIASES)) {
      if (alias.replace(/[\s_-]/g, '') === lower) {
        return canonical;
      }
    }
    return null;
  }

  /**
   * Analyzes an array of session events (chronological order, oldest to newest) against the standard ecommerce funnel.
   */
  public static analyzeEcommerceFunnel(events: PixelEvent[]): FunnelAnalysis {
    // Sort oldest first for chronological journey analysis
    const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp);

    const steps: FunnelStep[] = this.ECOM_STANDARD_PATH.map((expected, idx) => ({
      stepIndex: idx + 1,
      expectedEvent: expected,
      isCompleted: false
    }));

    const observedMilestones: Array<{ canonical: string; event: PixelEvent }> = [];
    const anomalies: string[] = [];

    // Map each observed event
    for (const evt of sorted) {
      const canonical = this.mapToCanonical(evt.name);
      if (canonical) {
        observedMilestones.push({ canonical, event: evt });
        const step = steps.find((s) => s.expectedEvent === canonical);
        if (step && !step.isCompleted) {
          step.isCompleted = true;
          step.actualEvent = evt;
          step.timestamp = evt.timestamp;
        }
      }
    }

    // Compute timings between steps
    let prevTime: number | null = null;
    for (const step of steps) {
      if (step.isCompleted && step.timestamp) {
        if (prevTime !== null) {
          step.timeFromPreviousMs = step.timestamp - prevTime;
        }
        prevTime = step.timestamp;
      }
    }

    // Check for sequence anomalies (e.g. Purchase before AddToCart)
    let highestStepSeen = -1;
    for (const item of observedMilestones) {
      const stepIdx = this.ECOM_STANDARD_PATH.indexOf(item.canonical);
      if (stepIdx < highestStepSeen) {
        anomalies.push(`Out of sequence: "${item.canonical}" was fired after a later step in the funnel.`);
      } else {
        highestStepSeen = Math.max(highestStepSeen, stepIdx);
      }
    }

    // Check for skipped intermediate steps
    const missingSteps: string[] = [];
    const purchaseCompleted = steps.find((s) => s.expectedEvent === 'Purchase')?.isCompleted;

    if (purchaseCompleted) {
      for (const step of steps) {
        if (step.expectedEvent !== 'Purchase' && !step.isCompleted) {
          missingSteps.push(step.expectedEvent);
          anomalies.push(`Funnel step "${step.expectedEvent}" was skipped prior to Purchase completion.`);
        }
      }
    }

    return {
      funnelType: 'ecommerce',
      steps,
      isComplete: Boolean(purchaseCompleted),
      missingSteps,
      anomalies,
      conversionAchieved: Boolean(purchaseCompleted)
    };
  }
}
