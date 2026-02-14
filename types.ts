
export type Language = 'en' | 'es' | 'fr' | 'hi';

export interface DisasterRisk {
  type: string;
  probability: number;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  description: string;
  recommendations: string[];
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface UserReport {
  id: string;
  type: string;
  description: string;
  severity: 'Minor' | 'Moderate' | 'Severe';
  timestamp: string;
  location: string;
}

export interface HistoricalTrend {
  period: string;
  eventCount: number;
  intensityScore: number;
}

export interface FutureHotspot {
  location: string;
  threat: string;
  timeframe: string;
  reasoning: string;
  probabilityScore: number;
}

export interface PredictionResult {
  location: string;
  overallRiskLevel: 'Low' | 'Moderate' | 'High' | 'Extreme';
  predictionConfidence: number;
  summary: string;
  risks: DisasterRisk[];
  visualizationImage?: string; // AI generated threat image
  activeAlerts: any[];
  communityInsights: string;
  historicalTrends: HistoricalTrend[];
  modelMetadata: {
    dataPointsAnalyzed: number;
    trainingEpochs: number;
    neuralAccuracy: number;
    algorithmVersion: string;
  };
  futureForecast: {
    longTermOutlook: string;
    vulnerabilityScore: number;
    hotspots: FutureHotspot[];
  };
  sources: GroundingSource[];
  timestamp: string;
}
