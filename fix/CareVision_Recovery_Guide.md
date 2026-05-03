# CareVision Feature Recovery Guide

**Document Purpose:** Systematic diagnosis and repair of non-functional features  
**Target Features:** TestStrip, MedScan, DocReader, Protocol Assistant  
**Current Status:** All four features failing due to interconnected blockers  
**Estimated Recovery Time:** 2-4 hours for complete restoration

---

## Executive Summary: Root Cause Analysis

**Confidence Level: CONFIRMED**

Your features are failing due to **three critical, cascading blockers**:

1. **Backend Not Running** (Blocker #1) → Python dependencies uninstalled due to PEP 668
2. **API Schema Mismatch** (Blocker #2) → Frontend payload structure doesn't match Pydantic schemas
3. **Missing Environment Configuration** (Blocker #3) → API keys and service connections not verified

**Impact Chain:**
```
Python env broken → Backend won't start → API returns 404/500 
                 → Frontend gets errors → All features fail
```

**Fix Priority Order:**
1. Fix Python environment (CRITICAL - blocks everything)
2. Verify environment variables (CRITICAL - enables services)
3. Align API contracts (HIGH - enables features)
4. Test each feature endpoint (MEDIUM - validates fixes)

---

## Part 1: Critical Foundation Fixes

### Fix 1.1: Python Environment Isolation

**Diagnosis:** Your README states dependencies fail with `ModuleNotFoundError` due to PEP 668 restrictions. This means the backend cannot start at all.

**Root Cause:** Modern Linux distributions prevent `pip install` into system Python. The backend code is written but dependencies aren't installed in a usable environment.

**Verification Test:**
```bash
# Navigate to backend directory
cd carevision/backend

# Try to run the server (this will fail)
python -m uvicorn app.main:app --reload

# Expected error:
# ModuleNotFoundError: No module named 'fastapi'
```

**Solution - Create Isolated Virtual Environment:**

```bash
# STEP 1: Navigate to backend
cd carevision/backend

# STEP 2: Create virtual environment
python3.12 -m venv venv

# STEP 3: Activate it
# On Linux/macOS:
source venv/bin/activate

# On Windows:
# venv\Scripts\activate

# VERIFY: Your terminal should now show (venv) prefix

# STEP 4: Upgrade pip inside venv
pip install --upgrade pip

# STEP 5: Install all dependencies
pip install -r requirements.txt

# EXPECTED OUTPUT:
# Successfully installed fastapi-0.111.0 pydantic-2.x.x uvicorn-0.x.x ...
```

**Verification Test (After Fix):**
```bash
# Still inside activated venv
python -c "import fastapi; print(fastapi.__version__)"

# Expected: 0.111.0
```

**Critical Note:** Every time you work on the backend, you MUST activate the virtual environment first:
```bash
cd carevision/backend
source venv/bin/activate  # Linux/macOS
```

---

### Fix 1.2: Environment Variables Configuration

**Diagnosis:** Your backend requires API keys and database URLs. Without these, services fail silently or return 500 errors.

**Root Cause:** The `.env` file either doesn't exist or has placeholder values.

**Required Variables (from your documentation):**

```bash
# Create/Edit: carevision/backend/.env
# DO NOT commit this file to git

# 1. GEMMA API KEY (CRITICAL - without this, all AI features fail)
GEMMA_API_KEY=your_actual_google_ai_studio_key_here

# 2. DATABASE URL (CRITICAL - without this, backend crashes on startup)
DATABASE_URL=postgresql+asyncpg://user:password@host/dbname
# Example for Neon:
# DATABASE_URL=postgresql+asyncpg://username:password@ep-xxx.us-east-2.aws.neon.tech/carevision?sslmode=require

# 3. CLOUDFLARE R2 CREDENTIALS (MEDIUM priority - image storage)
R2_ACCOUNT_ID=your_cloudflare_account_id
R2_ACCESS_KEY_ID=your_r2_access_key
R2_SECRET_ACCESS_KEY=your_r2_secret_key
R2_BUCKET_NAME=carevision-images

# 4. OPTIONAL: Monitoring
LOGFIRE_TOKEN=optional_but_recommended
```

**How to Get Each Credential:**

**GEMMA_API_KEY:**
1. Go to https://aistudio.google.com/
2. Click "Get API Key"
3. Create/select a project
4. Copy the key (starts with `AIza...`)

**DATABASE_URL (Neon PostgreSQL):**
1. Go to https://neon.tech/
2. Create free account
3. Create new project named "carevision"
4. Go to Dashboard → Connection Details
5. Select "Pooled connection" and "asyncpg"
6. Copy the connection string

**Verification Test:**
```bash
# Inside activated venv
cd carevision/backend

# Check if .env is loaded
python -c "from app.config import settings; print(settings.gemma_api_key[:10] + '...')"

# Expected: First 10 chars of your key + "..."
# If error: .env not loaded or key missing
```

---

### Fix 1.3: Database Initialization

**Diagnosis:** Even with DATABASE_URL set, the database needs tables created via Alembic migrations.

**Solution:**

```bash
# Inside activated venv, from backend directory
cd carevision/backend

# Run migrations to create tables
alembic upgrade head

# Expected output:
# INFO  [alembic.runtime.migration] Running upgrade -> xxx, initial schema
# INFO  [alembic.runtime.migration] Running upgrade xxx -> yyy, add encounter logs
```

**If Alembic Fails:**
```bash
# Error: "Can't locate revision identified by 'xxx'"
# Solution: Initialize Alembic from scratch

alembic revision --autogenerate -m "initial schema"
alembic upgrade head
```

---

### Fix 1.4: Start the Backend Server

**Now that environment is ready, start the server:**

```bash
# Inside activated venv, from backend directory
uvicorn app.main:app --reload --port 8000

# Expected output:
# INFO:     Uvicorn running on http://127.0.0.1:8000
# INFO:     Application startup complete.
```

**Test the server:**
```bash
# In a new terminal
curl http://localhost:8000/health

# Expected response:
# {"status":"healthy","timestamp":"2026-04-26T..."}
```

**If startup fails with errors:**

**Error: `ModuleNotFoundError: No module named 'app'`**
```bash
# Solution: Run from backend/ directory, not backend/app/
cd carevision/backend  # Not backend/app
uvicorn app.main:app --reload
```

**Error: `sqlalchemy.exc.OperationalError`**
```bash
# Solution: DATABASE_URL is wrong or database doesn't exist
# Fix: Verify DATABASE_URL in .env matches Neon dashboard exactly
```

**Error: `google.generativeai.types.RequestException`**
```bash
# Solution: GEMMA_API_KEY is invalid or missing
# Fix: Verify key in .env, test at https://aistudio.google.com/
```

---

## Part 2: API Contract Alignment

### Fix 2.1: Understanding the Schema Mismatch

**Diagnosis:** Your README states HTTP 422 errors occur. This means the frontend is sending data in a format the backend doesn't accept.

**Root Cause:** The frontend `AnalysisRequest` interface doesn't match backend `AnalyzeRequest` Pydantic schema.

**Backend Expects (from your docs):**
```python
# app/schemas/analyze.py
class AnalyzeRequest(BaseModel):
    image_b64: str          # Base64-encoded image string
    type: AnalysisType      # enum: "teststrip" | "medscan" | "woundassess" | "docreader"
    consent_given: bool     # Must be true
    language: str = "en"    # Optional, defaults to English
```

**Frontend Likely Sending (incorrect structure):**
```typescript
// Possible incorrect structure
{
  image: "data:image/jpeg;base64,/9j/4AAQ...",  // ❌ Wrong key
  analysisType: "teststrip",                      // ❌ Wrong key
  consent: true                                    // ❌ Wrong key
}
```

**Correct Frontend Structure:**
```typescript
// src/types/analysis.ts
export interface AnalysisRequest {
  image_b64: string;      // NOT "image" or "imageData"
  type: string;           // NOT "analysisType" or "feature"
  consent_given: boolean; // NOT "consent" or "hasConsent"
  language?: string;
}
```

---

### Fix 2.2: Frontend API Client Corrections

**File to Edit:** `carevision/frontend/src/api/client.ts` (or wherever your Axios client is)

**Current Broken Code (example):**
```typescript
// ❌ INCORRECT - Will cause 422 errors
export async function analyzeTestStrip(imageData: string, consent: boolean) {
  const response = await apiClient.post('/analyze/teststrip', {
    image: imageData,           // Wrong key
    analysisType: 'teststrip',  // Wrong key
    consent: consent            // Wrong key
  });
  return response.data;
}
```

**Fixed Code:**
```typescript
// ✅ CORRECT - Matches backend Pydantic schema
export async function analyzeTestStrip(imageData: string, consent: boolean, language: string = 'en') {
  const response = await apiClient.post('/analyze/teststrip', {
    image_b64: imageData,        // Exact match
    type: 'teststrip',           // Exact match
    consent_given: consent,      // Exact match
    language: language           // Exact match
  });
  return response.data;
}
```

**Generalized Fix for All Features:**
```typescript
// src/api/analysis.ts
import { apiClient } from './client';
import { AnalysisRequest, AnalysisResponse } from '@/types/analysis';

export async function analyzeImage(request: AnalysisRequest) {
  // This single function works for all 4 features
  const response = await apiClient.post<AnalysisResponse>('/analyze', {
    image_b64: request.image_b64,
    type: request.type,  // "teststrip" | "medscan" | "woundassess" | "docreader"
    consent_given: request.consent_given,
    language: request.language || 'en'
  });
  return response.data;
}
```

---

### Fix 2.3: Image Base64 Encoding Verification

**Diagnosis:** The frontend might be sending malformed base64 strings.

**Common Issues:**

1. **Including data URL prefix (WRONG):**
   ```typescript
   // ❌ Backend will reject this
   image_b64: "data:image/jpeg;base64,/9j/4AAQ..."
   ```

2. **Raw binary data (WRONG):**
   ```typescript
   // ❌ Must be base64 string, not Blob
   image_b64: someBlob
   ```

**Correct Encoding:**
```typescript
// src/utils/imageProcessing.ts
export async function encodeImageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = () => {
      const result = reader.result as string;
      
      // Remove data URL prefix if present
      const base64 = result.includes(',') 
        ? result.split(',')[1]  // Get only the base64 part
        : result;
      
      resolve(base64);
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

**Usage in Component:**
```typescript
// In your TestStrip.tsx or similar
const handleImageCapture = async (file: File) => {
  // Validate file size (backend rejects > 1MB)
  if (file.size > 1024 * 1024) {
    toast.error('Image must be under 1MB');
    return;
  }
  
  // Encode to base64 (without data URL prefix)
  const base64String = await encodeImageToBase64(file);
  
  // Send to backend
  const result = await analyzeImage({
    image_b64: base64String,  // Clean base64, no prefix
    type: 'teststrip',
    consent_given: consentChecked,
    language: selectedLanguage
  });
};
```

---

## Part 3: Protocol Assistant Specific Fixes

### Fix 3.1: Protocol Assistant Endpoint

**Diagnosis:** Your README mentions the Protocol Assistant has fatal communication errors at `/api/protocols`.

**Root Cause:** The endpoint might not exist, or the payload structure is completely different from analysis endpoints.

**Backend Expected Schema (from your docs):**
```python
# app/schemas/protocol.py (or similar)
class ProtocolRequest(BaseModel):
    query: str              # The clinical question
    language: str = "en"    # Language code
```

**Correct Frontend Call:**
```typescript
// src/api/protocol.ts
export async function askProtocolQuestion(query: string, language: string = 'en') {
  const response = await apiClient.post('/api/protocols', {
    query: query,        // NOT "question" or "prompt"
    language: language
  });
  return response.data;
}
```

**If Endpoint Doesn't Exist:**

Check if the route is registered in your backend:

```python
# app/main.py
from app.routes import analyze, protocols  # Make sure protocols is imported

app.include_router(analyze.router, prefix="/api")
app.include_router(protocols.router, prefix="/api")  # This line must exist
```

---

### Fix 3.2: Temperature Configuration Check

**Diagnosis:** Protocol Assistant must run at temperature 0.2 (from your docs) for factual consistency.

**Verify in Backend:**
```python
# app/services/gemma_client.py
class GemmaClient:
    def generate_protocol_response(self, query: str, language: str) -> str:
        # Temperature MUST be 0.2, not 0.7
        response = self.model.generate_content(
            prompt,
            generation_config={
                "temperature": 0.2,  # ✅ CORRECT for protocols
                "top_p": 0.8,
                "top_k": 40,
                "max_output_tokens": 2048,
            }
        )
        return response.text
```

---

## Part 4: Feature-by-Feature Verification

### Step 4.1: Test Backend Endpoints Directly

**Before testing frontend, verify backend works in isolation:**

```bash
# Test 1: Health Check
curl http://localhost:8000/health

# Test 2: TestStrip Analysis (with dummy base64)
curl -X POST http://localhost:8000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "image_b64": "/9j/4AAQSkZJRg...",
    "type": "teststrip",
    "consent_given": true,
    "language": "en"
  }'

# Expected: JSON response with test_type, result, confidence, etc.
# If 422: Schema mismatch - check Pydantic models
# If 500: Gemma API error - check GEMMA_API_KEY in .env
```

---

### Step 4.2: Frontend Environment Variables

**File:** `carevision/frontend/.env`

```bash
# Create if missing
VITE_API_BASE_URL=http://localhost:8000/api

# For production:
# VITE_API_BASE_URL=https://your-backend-url.com/api
```

**Verify in Frontend Code:**
```typescript
// src/api/client.ts
import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // Must read from .env
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});
```

---

### Step 4.3: Start Frontend and Test

```bash
# In new terminal (backend should still be running)
cd carevision/frontend

npm install  # If not done yet

npm run dev

# Frontend should start at http://localhost:5173
```

**Test Each Feature:**

1. **TestStrip:**
   - Navigate to TestStrip page
   - Open browser DevTools → Network tab
   - Upload a test image
   - Check consent checkbox
   - Click "Analyze"
   - **Expected:** POST request to `/api/analyze` with status 200
   - **If 422:** Schema mismatch - review Fix 2.2
   - **If 404:** Backend not running or wrong baseURL
   - **If 500:** Gemma API error - check backend logs

2. **MedScan / WoundAssess / DocReader:**
   - Repeat same test for each feature
   - The only difference should be the `type` field value

3. **Protocol Assistant:**
   - Navigate to Protocol page
   - Type a clinical question
   - Click "Ask"
   - **Expected:** POST to `/api/protocols` with status 200
   - **If 404:** Route not registered - check Fix 3.1

---

## Part 5: Common Error Patterns and Solutions

### Error Pattern 1: CORS Errors

**Symptom:**
```
Access to XMLHttpRequest at 'http://localhost:8000/api/analyze' from origin 'http://localhost:5173' 
has been blocked by CORS policy
```

**Solution:**
```python
# app/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

### Error Pattern 2: Axios Timeout

**Symptom:** Request takes >30 seconds, then fails

**Cause:** Gemma 4 API is slow on first request (cold start)

**Solution:**
```typescript
// src/api/client.ts
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 60000,  // Increase to 60 seconds for AI requests
});
```

---

### Error Pattern 3: Image Too Large

**Symptom:** Backend returns 413 or 500

**Solution:**
```typescript
// Add file size validation BEFORE sending
const MAX_SIZE = 1024 * 1024; // 1MB

if (file.size > MAX_SIZE) {
  toast.error('Image must be under 1MB. Please compress or resize.');
  return;
}
```

---

## Part 6: Verification Checklist

Run through this checklist after applying all fixes:

**Backend Checklist:**
- [ ] Virtual environment created and activated
- [ ] All dependencies installed (`pip list` shows fastapi, pydantic, etc.)
- [ ] `.env` file exists with valid GEMMA_API_KEY and DATABASE_URL
- [ ] Database migrations run successfully (`alembic upgrade head`)
- [ ] Backend starts without errors (`uvicorn app.main:app --reload`)
- [ ] Health endpoint responds: `curl http://localhost:8000/health`

**Frontend Checklist:**
- [ ] `npm install` completed without errors
- [ ] `.env` file exists with VITE_API_BASE_URL set
- [ ] Frontend starts: `npm run dev`
- [ ] Browser shows home page, no console errors
- [ ] Network tab shows API requests going to correct baseURL

**Feature Testing:**
- [ ] TestStrip: Upload image → 200 response → Result displays
- [ ] MedScan: Upload image → 200 response → Drug info displays
- [ ] WoundAssess: Upload image → 200 response → Severity displays
- [ ] DocReader: Upload image → 200 response → Extracted fields display
- [ ] Protocol Assistant: Ask question → 200 response → Answer displays

---

## Part 7: Priority Fix Order (Implementation Sequence)

**Day 1 Morning (2 hours):**
1. Fix 1.1: Create virtual environment, install dependencies
2. Fix 1.2: Configure all environment variables
3. Fix 1.3: Run database migrations
4. Fix 1.4: Start backend, verify health endpoint

**Day 1 Afternoon (2 hours):**
5. Fix 2.2: Align frontend API client with backend schemas
6. Fix 2.3: Fix image base64 encoding
7. Test TestStrip feature end-to-end
8. Test MedScan feature end-to-end

**Day 2 Morning (2 hours):**
9. Test WoundAssess and DocReader features
10. Fix 3.1 & 3.2: Protocol Assistant endpoint and configuration
11. Test Protocol Assistant end-to-end

---

## Part 8: If Features Still Fail After All Fixes

**Debugging Strategy:**

1. **Check Backend Logs:**
   ```bash
   # Backend terminal will show detailed errors
   # Look for:
   # - Pydantic ValidationError: Schema mismatch
   # - google.generativeai.exceptions: API key issues
   # - sqlalchemy.exc: Database errors
   ```

2. **Check Frontend Network Tab:**
   - Right-click request → Copy as cURL
   - Paste in terminal to test backend directly
   - Compare payload with backend schema

3. **Enable Verbose Logging:**
   ```python
   # app/main.py
   import logging
   logging.basicConfig(level=logging.DEBUG)
   ```

4. **Test with Minimal Payload:**
   ```bash
   # Simplest possible request
   curl -X POST http://localhost:8000/api/analyze \
     -H "Content-Type: application/json" \
     -d '{"image_b64":"test","type":"teststrip","consent_given":true}'
   
   # If this fails, backend schema is broken
   # If this works, frontend encoding is the issue
   ```

---

## Critical Success Factors

**What MUST be true for features to work:**

1. ✅ Backend running with no startup errors
2. ✅ GEMMA_API_KEY valid and set in backend .env
3. ✅ Frontend sending exact schema backend expects
4. ✅ Image base64 encoded WITHOUT data URL prefix
5. ✅ Consent checkbox checked (consent_given: true)
6. ✅ CORS configured to allow frontend origin

**If any ONE of these is false, ALL features will fail.**

---

## Final Notes

**Estimated Time to Full Recovery:** 2-4 hours if following this guide sequentially.

**Biggest Time Savers:**
- Don't skip the virtual environment step - it's the foundation
- Test backend with cURL before testing frontend - isolates issues
- Use browser DevTools Network tab - shows exact payloads

**Most Common Mistake:** Trying to fix frontend first when backend isn't running. Always verify backend health before touching frontend code.

**When to Ask for Help:** If backend starts successfully but ALL features return 500 errors, share the backend startup logs and a sample cURL request for diagnosis.

---

**Recovery Path Summary:**
```
Fix Python env → Verify .env config → Start backend → 
Test with cURL → Fix frontend schema → Test each feature → 
Verify end-to-end → Done
```

Good luck! Following this guide sequentially should restore all four features to working order.
