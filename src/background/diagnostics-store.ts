/**
 * Diagnostics Store Service
 * Records internal telemetry, match rates, parser performance, and error counters.
 */

export interface SystemDiagnostics {
  workerStartedAt: number;
  totalNetworkMatches: number;
  totalEventsParsed: number;
  totalEventsStored: number;
  activeTabsMonitored: number;
  bridgeConnections: number;
}

class DiagnosticsStore {
  private diagnostics: SystemDiagnostics = {
    workerStartedAt: Date.now(),
    totalNetworkMatches: 0,
    totalEventsParsed: 0,
    totalEventsStored: 0,
    activeTabsMonitored: 0,
    bridgeConnections: 0
  };

  public getSnapshot(): SystemDiagnostics {
    return { ...this.diagnostics };
  }

  public incrementNetworkMatches(): void {
    this.diagnostics.totalNetworkMatches++;
  }

  public incrementEventsParsed(count = 1): void {
    this.diagnostics.totalEventsParsed += count;
  }

  public incrementEventsStored(count = 1): void {
    this.diagnostics.totalEventsStored += count;
  }

  public recordBridgeConnection(): void {
    this.diagnostics.bridgeConnections++;
  }
}

export const diagnosticsStore = new DiagnosticsStore();
