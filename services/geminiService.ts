/**
 * Frontend service - calls Python FastAPI backend instead of Gemini directly.
 * All AI logic now lives in backend/services/gemini_service.py
 */
import { PredictionResult, UserReport, Language } from "../types";

// Local testing: http://localhost:8001, Production: Render URL
// const BACKEND_URL = "http://localhost:8001";
const BACKEND_URL = "https://disasterguard-backend-v79u.onrender.com";
const API_BASE = `${BACKEND_URL}/api`;

export const analyzeLocationRisk = async (
  location: string,
  reports: UserReport[] = [],
  lang: Language = 'en'
): Promise<PredictionResult> => {
  try {
    
    const url = `${API_BASE}/analyze`;
    console.log("🔗 Requesting:", url);
    
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location, reports, lang }),
    });
    console.log("resp", response);
    

    console.log("📡 Response status:", response.status);

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Unknown error" }));
      console.error("❌ API Error:", err);
      throw new Error(err.detail || `Server error: ${response.status}`);
    }

    const data: PredictionResult = await response.json();
    console.log("✅ Analysis complete");
    return data;
  } catch (error) {
    console.error("Neural Prediction Error:", error);
    throw error;
  }
};
