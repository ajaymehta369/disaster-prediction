/**
 * Frontend service - calls Python FastAPI backend instead of Gemini directly.
 * All AI logic now lives in backend/services/gemini_service.py
 */
import { PredictionResult, UserReport, Language } from "../types";

// Use environment variable for backend URL, fallback to relative path for local dev
const API_BASE = import.meta.env.VITE_BACKEND_URL || "/api";

export const analyzeLocationRisk = async (
  location: string,
  reports: UserReport[] = [],
  lang: Language = 'en'
): Promise<PredictionResult> => {
  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, reports, lang }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Unknown error" }));
      throw new Error(err.detail || `Server error: ${response.status}`);
    }

    const data: PredictionResult = await response.json();
    return data;
  } catch (error) {
    console.error("Neural Prediction Error:", error);
    throw error;
  }
};
