# SmartFarm Prototype (Java Backend)

SmartFarm is a mobile-first prototype for helping small and new Irish farmers manage land effectively.

## Repository Structure

- `frontend/` – React Native (Expo) mobile prototype
- `backend/` – Java Spring Boot API (prototype with mock JWT auth)
- `database/` – PostgreSQL + PostGIS schema

## User Flow

Sign Up → Map Farm → Dashboard → Recommendations → Planning Tools → Scheme Support → Monitoring → Seasonal Reports

## Demo Walkthrough (2-3 minutes)

1. Start backend and frontend from the Quick Start section.
2. Sign up with any email and continue to Map Farm.
3. Tap at least 3 points on the map and click "Save & Continue".
4. On Dashboard, click "Refresh" to load KPIs.
5. Open Recommendations to show rule-based guidance.
6. Open Planning Tools and run the Livestock-Land Balance Calculator.
7. Open Scheme Support and click "Apply" to show a submitted state.
8. Open Monitoring and click "Load NDVI" to show time-series values.
9. Open Seasonal Reports and click "Generate".

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

## Suggested Screenshot Checklist

- Auth screen (Sign Up/Login)
- Map Farm screen with boundary points
- Dashboard KPI cards
- Recommendations screen
- Planning Tools calculator result
- Scheme Support with an "Applied" status
- Monitoring NDVI timeline
- Seasonal report summary

## Notes

- Authentication is prototype-level mock JWT for speed.
- Data is currently in-memory in backend service for demo purposes.
- `database/schema.sql` provides normalized tables and PostGIS geometry for production evolution.
- Program applications and generated records reset if the backend restarts.
- In web mode, the frontend expects backend at `http://localhost:8080/api`.
