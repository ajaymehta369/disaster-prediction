import json
import re
import os
import asyncio
import logging
import base64
from datetime import datetime
from typing import List, Optional

from google import genai
from google.genai import types

from models import (
    PredictionResult,
    UserReport,
    GroundingSource,
    DisasterRisk,
    HistoricalTrend,
    FutureHotspot,
    ModelMetadata,
    FutureForecast,
)

logger = logging.getLogger(__name__)

LANG_NAMES = {"en": "English", "es": "Spanish", "fr": "French", "hi": "Hindi"}

# Models to try in order — if one hits quota, try the next
FALLBACK_MODELS = [
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
]

MAX_RETRIES = 3
RETRY_BASE_DELAY = 5  # seconds


async def _call_with_retry(client, model_list, contents, config, description="API call"):
    """
    Try each model in model_list with retry + exponential backoff.
    Returns the response on success.
    """
    last_error = None

    for model in model_list:
        for attempt in range(MAX_RETRIES):
            try:
                logger.info(f"{description} → model={model}, attempt={attempt + 1}")
                # Run synchronous API call in thread pool for async compatibility
                response = await asyncio.to_thread(
                    client.models.generate_content,
                    model=model,
                    contents=contents,
                    config=config,
                )
                return response
            except Exception as e:
                last_error = e
                error_str = str(e)
                if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                    wait = RETRY_BASE_DELAY * (2 ** attempt)
                    logger.warning(f"Rate limited on {model} (attempt {attempt + 1}). Waiting {wait}s...")
                    await asyncio.sleep(wait)
                else:
                    # Non-rate-limit error, don't retry this model
                    logger.error(f"Non-retryable error on {model}: {e}")
                    break
        logger.warning(f"All retries exhausted for {model}, trying next fallback...")

    raise last_error


async def analyze_location_risk(
    location: str,
    reports: List[UserReport] | None = None,
    lang: str = "en",
) -> dict:
    """
    Analyze disaster risk for a given location using Gemini AI.
    Returns the prediction result as a dict (JSON-serializable).
    """
    if reports is None:
        reports = []

    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        raise ValueError("GEMINI_API_KEY environment variable is not set")

    client = genai.Client(api_key=api_key)

    lang_name = LANG_NAMES.get(lang, "English")

    prompt = f"""ACT AS A NEURAL DISASTER PREDICTION MODEL (V4.2). 
  Analyze {location} in {lang_name}. Use historical patterns and live grounding.
  Provide a detailed prediction including current risks, future 12-month hotspots, and simulated model metadata.
  
  Format as JSON:
  {{
    "location": "{location}",
    "overallRiskLevel": "Low | Moderate | High | Extreme",
    "predictionConfidence": 0-100,
    "summary": "Technical briefing",
    "communityInsights": "Pattern analysis",
    "historicalTrends": [{{ "period": "Last 5 Years", "eventCount": 10, "intensityScore": 7 }}],
    "modelMetadata": {{ "dataPointsAnalyzed": 750000, "trainingEpochs": 256, "neuralAccuracy": 96.4, "algorithmVersion": "NG-X-9" }},
    "futureForecast": {{
      "longTermOutlook": "Outlook string",
      "vulnerabilityScore": 85,
      "hotspots": [{{ "location": "Area", "threat": "Flood", "timeframe": "Summer", "reasoning": "Reason", "probabilityScore": 75 }}]
    }},
    "risks": [{{ "type": "Fire", "probability": 40, "severity": "High", "description": "Desc", "recommendations": ["Ref"] }}]
  }}"""

    try:
        # 1. Generate textual prediction with retry + fallback models
        # Note: google_search tool cannot be combined with response_mime_type="application/json"
        # on some models, so we use JSON in the prompt instead.
        response = await _call_with_retry(
            client,
            FALLBACK_MODELS,
            prompt + "\n\nIMPORTANT: Respond ONLY with a single valid JSON object (not an array). No markdown, no explanation.",
            types.GenerateContentConfig(
                response_mime_type="application/json",
            ),
            description="Text prediction",
        )

        raw_text = response.text or "{}"
        cleaned = re.sub(r"```json|```", "", raw_text).strip()
        data = json.loads(cleaned)

        # Handle case where Gemini returns a list instead of a dict
        if isinstance(data, list):
            data = data[0] if data else {}
        if not isinstance(data, dict):
            raise ValueError(f"Expected JSON object, got {type(data).__name__}")

        # Grounding sources (empty since we removed google_search for compatibility)
        sources: List[dict] = []

        # 2. Generate visualization image (best effort, skip on failure)
        visualization_image = None
        try:
            risks_list = data.get("risks", [])
            risk_type = risks_list[0].get("type", "natural disaster") if risks_list and isinstance(risks_list[0], dict) else "natural disaster"
            risk_level = data.get("overallRiskLevel", "Unknown")

            image_prompt = (
                f"A futuristic, high-tech digital 2.5D schematic map visualization showing a "
                f"{risk_level} risk of {risk_type} in {location}. "
                f"Detailed neon HUD elements, warning markers, and topographical heatmaps. "
                f"Cinematic lighting, deep blue and red aesthetic."
            )

            img_response = await asyncio.to_thread(
                client.models.generate_content,
                model="gemini-2.0-flash-exp-image-generation",
                contents=image_prompt,
                config=types.GenerateContentConfig(
                    response_modalities=["IMAGE", "TEXT"],
                ),
            )

            if img_response.candidates:
                for part in img_response.candidates[0].content.parts:
                    if part.inline_data:
                        b64_data = base64.b64encode(part.inline_data.data).decode("utf-8")
                        visualization_image = f"data:{part.inline_data.mime_type};base64,{b64_data}"
                        break

        except Exception as img_err:
            logger.warning(f"Visualization generation failed (non-critical): {img_err}")

        # Build final result
        result = {
            **data,
            "visualizationImage": visualization_image,
            "sources": sources,
            "activeAlerts": [],
            "timestamp": datetime.utcnow().isoformat(),
        }

        return result

    except Exception as e:
        logger.error(f"Neural Prediction Error: {e}")
        raise
