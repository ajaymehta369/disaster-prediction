# Deploying DisasterGuard to Render

This guide explains how to deploy your DisasterGuard application to Render with secure API key management.

## Prerequisites

1. A [Render](https://render.com/) account
2. Your code pushed to a Git repository (GitHub, GitLab, or Bitbucket)
3. A Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey)

## Deployment Options

### Option 1: Blueprint (Recommended - Easiest)

1. **Push your code to GitHub/GitLab**
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

2. **Connect to Render**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Blueprint"
   - Connect your repository
   - Render will automatically detect `render.yaml`

3. **Set Environment Variables**
   - After blueprint is created, go to your backend service
   - Navigate to "Environment" tab
   - Add: `GEMINI_API_KEY` = `your_actual_api_key_here`
   - Click "Save Changes"

4. **Deploy**
   - Render will automatically deploy both services
   - Wait for builds to complete

### Option 2: Manual Web Services

If you prefer to set up services manually:

#### Backend Service

1. **Create New Web Service**
   - Click "New" → "Web Service"
   - Connect your repository
   - Configure:
     - Name: `disasterguard-backend`
     - Root Directory: `backend`
     - Environment: `Python 3`
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

2. **Environment Variables**
   - Add: `GEMINI_API_KEY` = `your_actual_gemini_api_key`
   - Add: `PYTHON_VERSION` = `3.11.0`

3. **Deploy**

#### Frontend Service

1. **Create Static Site**
   - Click "New" → "Static Site"
   - Connect same repository
   - Configure:
     - Name: `disasterguard-frontend`
     - Build Command: `npm install && npm run build`
     - Publish Directory: `dist`

2. **Update Frontend to Connect to Backend**
   - After backend deploys, copy its URL (e.g., `https://disasterguard-backend.onrender.com`)
   - Update your frontend code to use this URL instead of `localhost:8000`
   - You may need to add this URL to CORS settings in `backend/main.py`

## Security Checklist

✅ API key is stored in Render's environment variables (encrypted)
✅ `.env` and `.env.local` are in `.gitignore` (not committed to Git)
✅ No hardcoded API keys in source code
✅ Environment variables are loaded via `python-dotenv` (local) and Render (production)

## Updating CORS for Production

Update `backend/main.py` to include your frontend URL:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://your-frontend-url.onrender.com",  # Add your Render frontend URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `GEMINI_API_KEY` | Google Gemini API key | `AIza...` |
| `PORT` | Port number (auto-set by Render) | `10000` |

## Troubleshooting

### Backend doesn't start
- Check logs in Render dashboard
- Verify `GEMINI_API_KEY` is set correctly
- Ensure `requirements.txt` includes all dependencies

### Frontend can't connect to backend
- Check CORS settings in `backend/main.py`
- Verify frontend is using correct backend URL
- Check browser console for CORS errors

### API key errors
- Verify key is valid at [AI Studio](https://aistudio.google.com/app/apikey)
- Check key has no extra spaces or quotes
- Ensure environment variable name is exactly `GEMINI_API_KEY`

## Local Development

For local development, create a `.env` file in the project root:

```bash
cp .env.example .env
# Edit .env and add your actual API key
```

Never commit `.env` to Git!

## Support

- [Render Documentation](https://render.com/docs)
- [FastAPI Deployment Guide](https://fastapi.tiangolo.com/deployment/)
- [Vite Production Build](https://vitejs.dev/guide/build.html)
