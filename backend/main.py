import os
import sys
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env.local from project root (one level up)
env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env.local")
load_dotenv(env_path)

# Also load plain .env if exists
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env"))

from models import AnalyzeRequest
from translations import UI_STRINGS
from services.gemini_service import analyze_location_risk

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    api_key = os.environ.get("GEMINI_API_KEY", "")
    if not api_key:
        logger.warning("⚠️  GEMINI_API_KEY not found in environment!")
    else:
        logger.info("✅ GEMINI_API_KEY loaded successfully")
    logger.info("🚀 DisasterGuard Python Backend Started")
    yield
    logger.info("🛑 DisasterGuard Python Backend Shutting Down")


app = FastAPI(
    title="DisasterGuard API",
    description="Neural Prediction Engine - Python Backend",
    version="4.2.0",
    lifespan=lifespan,
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────── API Endpoints ────────────────


@app.get("/api/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "online",
        "engine": "Neural-X V4.2",
        "language": "python",
    }


@app.post("/api/analyze")
async def analyze(request: AnalyzeRequest):
    """
    Main prediction endpoint.
    Accepts location + optional community reports + language.
    Returns full PredictionResult.
    """
    try:
        result = await analyze_location_risk(
            location=request.location,
            reports=request.reports,
            lang=request.lang,
        )
        return result
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Analyze endpoint error: {e}")
        raise HTTPException(status_code=500, detail="Neural Core Sync Failure")


@app.get("/api/translations")
async def get_translations():
    """Return all UI translation strings."""
    return UI_STRINGS


@app.get("/api/translations/{lang}")
async def get_translation(lang: str):
    """Return UI strings for a specific language."""
    if lang not in UI_STRINGS:
        raise HTTPException(status_code=404, detail=f"Language '{lang}' not found")
    return UI_STRINGS[lang]


# ──────────────── Run Server ────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
