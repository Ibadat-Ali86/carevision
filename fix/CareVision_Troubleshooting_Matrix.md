# CareVision Quick Troubleshooting Matrix

**Purpose:** Fast error diagnosis reference - find your symptom, get immediate fix

---

## Error Symptoms → Root Cause → Solution

### Backend Won't Start

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| `ModuleNotFoundError: No module named 'fastapi'` | Dependencies not installed | Create venv: `python -m venv venv`, activate, `pip install -r requirements.txt` |
| `ModuleNotFoundError: No module named 'app'` | Running from wrong directory | Must run from `backend/` not `backend/app/`: `cd carevision/backend && uvicorn app.main:app` |
| `sqlalchemy.exc.OperationalError` | Database not accessible | Fix DATABASE_URL in `.env`, verify Neon connection string |
| `google.generativeai.exceptions.PermissionDenied` | Invalid API key | Fix GEMMA_API_KEY in `.env`, verify at aistudio.google.com |

---

### Frontend Errors

| Symptom | Root Cause | Fix |
|---------|------------|-----|
| Blank white screen | React app crash | Open DevTools Console, check for errors |
| "Network Error" in console | Backend not running OR wrong baseURL | 1. Start backend, 2. Verify VITE_API_BASE_URL in frontend/.env |
| CORS policy error | Backend CORS not configured | Add CORSMiddleware in app/main.py with frontend URL |
| Request timeout | Gemma API slow response | Increase axios timeout to 60s in api/client.ts |

---

### API Errors (HTTP Status Codes)

| Status | Error | Root Cause | Fix |
|--------|-------|------------|-----|
| 404 | Not Found | Route doesn't exist OR baseURL wrong | 1. Check router registration in app/main.py, 2. Verify VITE_API_BASE_URL |
| 422 | Unprocessable Entity | Schema mismatch | Frontend payload doesn't match Pydantic schema - check field names exactly |
| 500 | Internal Server Error | Backend crash | Check backend terminal logs for Python traceback |
| 413 | Payload Too Large | Image > 1MB | Add file size validation: `if (file.size > 1048576) return;` |

---

### Feature-Specific Errors

| Feature | Symptom | Root Cause | Fix |
|---------|---------|------------|-----|
| TestStrip | "Result: unclear" every time | Poor image quality OR model can't identify test | Use well-lit, sharp, close-up photo of test strip |
| MedScan | Returns "Unable to read" | Blurry label OR non-supported language | Retake photo with clear focus on label text |
| WoundAssess | Always severity = 3 | Image quality too poor for assessment | Model defaults to 3 (moderate) when uncertain - retake clearer photo |
| Protocol Assistant | 404 error | Route not registered | Verify `protocols.router` imported and included in app/main.py |
| All Features | HTTP 422 every time | `image_b64` field wrong format | Remove "data:image/jpeg;base64," prefix - send only base64 string |

---

### Common Payload Mistakes

**❌ WRONG:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ...",
  "analysisType": "teststrip",
  "consent": true
}
```

**✅ CORRECT:**
```json
{
  "image_b64": "/9j/4AAQ...",
  "type": "teststrip",
  "consent_given": true,
  "language": "en"
}
```

---

## Diagnostic Commands (Copy-Paste Ready)

### Backend Health Check
```bash
# Terminal 1: Start backend
cd carevision/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000

# Terminal 2: Test endpoint
curl http://localhost:8000/health
# Expected: {"status":"healthy",...}
```

### Test Analysis Endpoint Directly
```bash
# Replace YOUR_BASE64_HERE with actual base64 image data
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image_b64": "YOUR_BASE64_HERE",
    "type": "teststrip",
    "consent_given": true,
    "language": "en"
  }'
```

### Check Python Environment
```bash
cd carevision/backend
source venv/bin/activate
python -c "import fastapi; import pydantic; print('✓ Dependencies OK')"
# Expected: ✓ Dependencies OK
```

### Check Environment Variables
```bash
cd carevision/backend
source venv/bin/activate
python -c "from app.config import settings; print(f'API Key: {settings.gemma_api_key[:10]}...')"
# Should show first 10 chars of your key
```

---

## Critical File Checklist

### Must Exist - Backend
- [ ] `carevision/backend/.env` (with GEMMA_API_KEY, DATABASE_URL)
- [ ] `carevision/backend/venv/` (virtual environment directory)
- [ ] `carevision/backend/requirements.txt`

### Must Exist - Frontend
- [ ] `carevision/frontend/.env` (with VITE_API_BASE_URL)
- [ ] `carevision/frontend/node_modules/` (npm dependencies)
- [ ] `carevision/frontend/src/api/client.ts`

---

## Schema Reference Card

### Backend Expects (Pydantic)
```python
class AnalyzeRequest(BaseModel):
    image_b64: str          # Base64 string WITHOUT prefix
    type: str               # "teststrip" | "medscan" | "woundassess" | "docreader"
    consent_given: bool     # Must be true
    language: str = "en"    # Optional
```

### Frontend Must Send (TypeScript)
```typescript
interface AnalysisRequest {
  image_b64: string;        // EXACT match
  type: string;             // EXACT match
  consent_given: boolean;   // EXACT match
  language?: string;
}
```

**Key Rule:** Field names must match EXACTLY (case-sensitive, underscores matter)

---

## Emergency Reset Procedure

If nothing works and you need to start fresh:

```bash
# 1. Kill all running processes
# Ctrl+C in all terminals

# 2. Backend reset
cd carevision/backend
rm -rf venv/
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Edit .env with correct credentials
alembic upgrade head
uvicorn app.main:app --reload

# 3. Frontend reset
cd carevision/frontend
rm -rf node_modules/
npm install
# Edit .env with correct VITE_API_BASE_URL
npm run dev

# 4. Test health endpoint
curl http://localhost:8000/health
```

---

## Contact Points for External Issues

| Service | Issue Type | Where to Check |
|---------|-----------|----------------|
| Gemma API | Rate limits, auth errors | https://aistudio.google.com/ → API Keys |
| Neon DB | Connection failures | https://neon.tech/ → Dashboard → Connection Details |
| Cloudflare R2 | Storage upload errors | https://dash.cloudflare.com/ → R2 → API Tokens |

---

## Success Indicators

**You know it's working when:**

1. Backend terminal shows:
   ```
   INFO:     Application startup complete.
   INFO:     Uvicorn running on http://127.0.0.1:8000
   ```

2. Frontend terminal shows:
   ```
   VITE v5.x.x ready in XXX ms
   ➜  Local:   http://localhost:5173/
   ```

3. Browser DevTools Network tab shows:
   - POST requests to `/api/analyze` return status 200
   - Response body contains `success: true` and result data

4. UI displays:
   - Result card with AI analysis
   - Disclaimer text at bottom
   - Confidence indicator (high/medium/low)
   - Recommended actions list

---

**Quick Win Test:** If you can successfully analyze ONE test strip image and see a result card with disclaimer, your entire system is working. The same infrastructure handles all four features.
