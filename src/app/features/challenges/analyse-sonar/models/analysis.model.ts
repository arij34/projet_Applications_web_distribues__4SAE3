export type QualityGateStatus = 'PASSED' | 'FAILED';

export type MetricVariant = 'neutral' | 'success' | 'warning' | 'error';

export interface MetricData {
  label: string;
  value: number | string;
  description: string;
  variant?: MetricVariant;
}

export interface InfoBarItem {
  label: string;
  value: string;
}

export interface BreakdownItem {
  type: string;
  count: number;
  severity: string;
}

export interface AnalysisData {
  qualityGateStatus: QualityGateStatus;
  codeHealthScore: number;
  metrics: {
    bugs: MetricData;
    vulnerabilities: MetricData;
    securityHotspots: MetricData;
    codeSmells: MetricData;
    testCoverage: MetricData;
    codeDuplication: MetricData;
  };
  coverage: number;
  duplication: number;
  codebaseInfo: InfoBarItem[];
  detailedBreakdown: BreakdownItem[];
}
