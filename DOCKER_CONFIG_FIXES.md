# Docker Configuration Fixes Summary

## Issues Fixed

### 1. **Environment Variable Naming Mismatch**
- **Problem**: Backend code expected `PORT` and `DB_PASS`, but Dockerfile was setting different names
- **Fix**: Now Dockerfile sets both variants:
  - `PORT=${BACKEND_PORT}` (for index.js)
  - `DB_PASS=${DB_PASSWORD}` (for mongoOperations.js)
  - `BACKEND_PORT=${BACKEND_PORT}` (kept for reference)

### 2. **MongoDB Connection Hardcoded**
- **Problem**: mongoOperations.js had hardcoded MongoDB Atlas credentials
- **Fix**: Now uses environment variable `MONGODB_URI`
  - Default for Docker: `mongodb://root:mongoadmin@mongodb:27017/?authSource=admin`
  - Code dynamically constructs connections: `${MONGODB_URI}/${databaseName}`

### 3. **Single Root .env Configuration**
- **Problem**: Backend and Frontend had separate .env files, no root .env handling
- **Fix**: Now all variables passed through root `.env` → docker-compose → Dockerfile → containers

### 4. **Environment Variable Propagation**
- **Path**: Root `.env` → `docker-compose.yaml` → `Dockerfile` (build args) → container ENVs

## Architecture

```
Root .env (source of truth)
  ↓
docker-compose.yaml (reads with ${VAR} syntax)
  ├→ build args (BACKEND_PORT, CORS_ORIGIN, etc.)
  ├→ environment (PORT, DB_PASS, MONGODB_URI, etc.)
  ↓
Dockerfile (receives via ARG and ENV)
  ↓
Container (all envs available to backend & frontend)
```

## Key Environment Variables

| Variable | Purpose | Example |
|----------|---------|---------|
| `BACKEND_PORT` | API server port | 8091 |
| `CORS_ORIGIN` | Frontend CORS origin | http://localhost:3000 |
| `JWT_SECRET_KEY` | JWT signing key | (your-secret-key) |
| `MONGODB_URI` | MongoDB connection string | mongodb://root:mongoadmin@mongodb:27017/?authSource=admin |
| `JUDGE0_URL` | Judge0 API endpoint | http://judge0-server:2358/submissions?... |
| `DB_USERNAME` | Database username | (for reference) |
| `DB_PASSWORD` | Database password | (for reference) |
| `GEMINI_API_KEY` | Google Gemini API key | (your-gemini-key) |
| `PING_BOT_DURATION` | Bot ping interval | 300000 |
| `MEMORY_LIMIT` | Code output memory limit | 31457280 |

## Docker Services Connection Map

```
codecolosseum (backend + frontend + judge0-worker)
  ├→ judge0-server (internal network)
  ├→ mongodb (mongodb://root:mongoadmin@mongodb:27017/)
  ├→ postgres (for judge0)
  └→ redis (for judge0)
```

## Running the App

```bash
# 1. Create .env file in root (copy from .env.example)
cp .env.example .env

# 2. Update .env with your values
# Edit CORS_ORIGIN, GEMINI_API_KEY, JWT_SECRET_KEY, etc.

# 3. Build and run
docker-compose up --build

# 4. Access
- Frontend: http://localhost:3000 (static build served by backend)
- Backend API: http://localhost:8091
- Judge0: http://localhost:2358 (internal only)
- MongoDB: localhost:27017 (internal only)
```

## Files Changed

1. **Dockerfile** - Added proper ENV variable handling and MONGODB_URI
2. **docker-compose.yaml** - Updated args and environment section
3. **Backend/src/db/mongoOperations.js** - Now uses MONGODB_URI env var instead of hardcoded Atlas
4. **.env.example** - Updated with all required variables and their purposes
