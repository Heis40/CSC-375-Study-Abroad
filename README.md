# SmartFarm Prototype (Java Backend)

SmartFarm is a mobile-first prototype for helping small and new Irish farmers manage land effectively.

## Repository Structure

- `frontend/` – React Native (Expo) mobile prototype
- `backend/` – Java Spring Boot API (prototype with mock JWT auth)
- `database/` – PostgreSQL + PostGIS schema

## User Flow

Sign Up → Map Farm → Dashboard → Recommendations → Planning Tools → Scheme Support → Monitoring → Seasonal Reports

## Implemented Features

1. Land Use Mapping (field boundary polygon capture via map taps)
2. Crop Diversification Suggestions (rule-based recommendations)
3. Rough Grazing Optimization suggestions
4. Satellite Monitoring (sample NDVI time series)
5. Soil Health Tracking (soil model + dashboard status)
6. Livestock–Land Balance Calculator
7. Government Program Integration (program list + application)
8. Predictive Yield Analytics (seasonal forecast records)

## Tech Stack (Adjusted)

- Frontend: React Native + Expo
- Backend: Java 17 + Spring Boot
- Database: PostgreSQL + PostGIS
- Mapping: `react-native-maps` (prototype map capture)

## Quick Start

### 1) Backend (Java)

```powershell
Set-Location "c:\Users\user\Documents\CSC 375 Study Abroad\backend"
mvn spring-boot:run
```

API runs on `http://localhost:8080/api`.

### 2) Frontend (React Native)

```powershell
Set-Location "c:\Users\user\Documents\CSC 375 Study Abroad\frontend"
npm install
npm run start
```

For Android emulator, API base URL is preconfigured as `http://10.0.2.2:8080/api`.

### 3) Database schema (optional for next phase)

```powershell
# From psql prompt on your Postgres instance
\i "c:/Users/user/Documents/CSC 375 Study Abroad/database/schema.sql"
```

## Backend Prototype API Endpoints

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/farms`
- `POST /api/fields`
- `GET /api/farms/{farmId}/fields`
- `POST /api/livestock`
- `GET /api/dashboard/{farmId}`
- `GET /api/recommendations/{farmId}`
- `GET /api/monitoring/{fieldId}`
- `POST /api/calculator/livestock-land`
- `GET /api/programs`
- `POST /api/programs/{programId}/apply?farmerId={farmerId}`
- `GET /api/reports/seasonal/{farmId}?season=Spring`

## Notes

- Authentication is prototype-level mock JWT for speed.
- Data is currently in-memory in backend service for demo purposes.
- `database/schema.sql` provides normalized tables and PostGIS geometry for production evolution.
