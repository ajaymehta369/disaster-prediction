from pydantic import BaseModel, Field
from typing import List, Optional, Literal
from datetime import datetime


class DisasterRisk(BaseModel):
    type: str
    probability: int = Field(ge=0, le=100)
    severity: Literal["Low", "Medium", "High", "Critical"]
    description: str
    recommendations: List[str]


class GroundingSource(BaseModel):
    title: str
    uri: str


class UserReport(BaseModel):
    id: str
    type: str
    description: str
    severity: Literal["Minor", "Moderate", "Severe"]
    timestamp: str
    location: str


class HistoricalTrend(BaseModel):
    period: str
    eventCount: int
    intensityScore: int


class FutureHotspot(BaseModel):
    location: str
    threat: str
    timeframe: str
    reasoning: str
    probabilityScore: int = Field(ge=0, le=100)


class ModelMetadata(BaseModel):
    dataPointsAnalyzed: int
    trainingEpochs: int
    neuralAccuracy: float
    algorithmVersion: str


class FutureForecast(BaseModel):
    longTermOutlook: str
    vulnerabilityScore: int
    hotspots: List[FutureHotspot]


class PredictionResult(BaseModel):
    location: str
    overallRiskLevel: Literal["Low", "Moderate", "High", "Extreme"]
    predictionConfidence: int = Field(ge=0, le=100)
    summary: str
    risks: List[DisasterRisk]
    visualizationImage: Optional[str] = None
    activeAlerts: List[dict] = []
    communityInsights: str
    historicalTrends: List[HistoricalTrend]
    modelMetadata: ModelMetadata
    futureForecast: FutureForecast
    sources: List[GroundingSource] = []
    timestamp: str


# --- Request Models ---

Language = Literal["en", "es", "fr", "hi"]


class AnalyzeRequest(BaseModel):
    location: str
    reports: List[UserReport] = []
    lang: Language = "en"
