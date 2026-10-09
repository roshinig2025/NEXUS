# Problem 04 — Self-Optimizing Web Application
## Implementation Report

### Objective
Build a self-optimizing web application that combines a trained ML model, a
FastAPI backend with explicit health checks and CORS, and a React/Vite frontend
dashboard that displays model-driven metrics and optimization recommendations.

---

## 1. Repository Scaffold

Created the following structure:

```
backend/
  app/
    __init__.py
    main.py
    core/config.py
    ml/model.py
    api/
      health.py
      predict.py
      feedback.py
      metrics.py
      optimize.py
  models/model.joblib
  data/raw_dataset.joblib
  scripts/train_model.py
  requirements.txt
frontend/
  package.json
  vite.config.ts
  index.html
  src/
    main.tsx
    App.tsx
    index.css
    api.ts
    types.ts
    hooks/useMetrics.ts
    components/
      Layout.tsx
      HealthCard.tsx
      MetricsChart.tsx
      PredictForm.tsx
      FeedbackPanel.tsx
      OptimizePanel.tsx
data/
requirements.txt  (top-level convenience)
```

---

## 2. Synthetic Dataset & Model Training

- **Generator:** `sklearn.datasets.make_classification`
- **Size:** 2000 samples, 10 features, 6 informative, 2 redundant
- **Split:** 80% train / 20% test
- **Model:** `RandomForestClassifier(n_estimators=100, random_state=42)`
- **Test accuracy:** 0.915
- **Artifacts:**
  - `backend/models/model.joblib` — trained classifier
  - `backend/data/raw_dataset.joblib` — `(X, y)` tuple for inspection/re-training

Training is reproducible and rerunnable via `backend/scripts/train_model.py`.

---

## 3. FastAPI Backend

### Application entry point
`backend/app/main.py` creates the FastAPI app and mounts:
- Explicit CORS middleware (configurable allow origins, methods, headers, credentials)
- Lifespan context that loads the model on startup and cleans up on shutdown
- Routers: health, predict, feedback, metrics, optimize

### Lifespan health checks
On startup the app:
1. Verifies `backend/models/model.joblib` exists and is loadable
2. Verifies `backend/data/raw_dataset.joblib` exists
3. Extracts model metadata (type, feature count, classes, sample count)
4. Stores model + metadata into app state for fast access during requests

`GET /health` returns a structured JSON payload including `status`, `model_loaded`,
`model_type`, `n_features`, `n_classes`, `n_samples`, `test_accuracy`.

### CORS
Explicit `CORSMiddleware` is configured in `main.py` with:
- Configurable `allow_origins` (defaults to common local frontend origins)
- `allow_credentials=True`
- Explicit `allow_methods` and `allow_headers`

### API design
- **Predict:** accepts a list of 10 features, returns prediction, confidence, and per-class probabilities
- **Feedback:** accepts prediction id + ground truth; backend accumulates accuracy stats in memory
- **Metrics:** returns current aggregated stats (total predictions, feedbacks, running accuracy, model confidence mean)
- **Optimize:** inspects recent feedback trends and model confidence; returns a recommendations object with suggested actions and rationale

### Validation
All endpoints use Pydantic v2 models for request/response schemas, including:
- `PredictRequest` / `PredictResponse`
- `FeedbackRequest` / `FeedbackResponse`
- `MetricsResponse`
- `OptimizeResponse`
- `HealthResponse`

---

## 4. React/Vite Frontend

### Stack
- React 19 with TypeScript
- Vite build tool
- Recharts for metrics visualization
- CSS-based layout (no component framework dependency)

### Pages/Components
- `Layout` — shell with header and sidebar nav
- `HealthCard` — displays `/health` model metadata and load status
- `MetricsChart` — time series of live metrics from `/metrics`
- `PredictForm` — submit feature vectors; shows prediction + confidence
- `FeedbackPanel` — record ground truth for recent predictions
- `OptimizePanel` — trigger `/optimize` and display recommendations

### State
- `useMetrics` hook polls `/metrics` on an interval and exposes the latest snapshot
- API client (`src/api.ts`) centralizes fetch calls and error handling
- Shared types in `src/types.ts` mirror backend Pydantic models

### UX
- Dashboard aggregates health, live metrics, prediction testing, feedback capture,
  and optimization recommendations in a single view
- Feedback and optimize flows are wired to the backend so the self-optimization
  loop is observable from the UI

---

## 5. Verification Approach

### Backend smoke checks
- Start uvicorn; confirm `/health` returns `model_loaded: true` and accurate metadata
- POST a feature vector to `/predict`; confirm prediction/confidence shape
- POST feedback; confirm `/metrics` reflects the update
- POST `/optimize`; confirm recommendations payload

### Frontend smoke checks
- `npm run dev` loads the dashboard
- Health card populates from `/health`
- Metrics chart updates from `/metrics`
- Predict form returns a prediction and confidence
- Feedback panel submits and reflects in metrics
- Optimize panel shows recommendations

---

## 6. Design Decisions

- **Model choice:** RandomForestClassifier gives strong tabular performance and
  calibrated probabilities for the optimization loop without heavy dependencies.
- **Synthetic data:** Keeps the project self-contained and reproducible while still
  exercising the full train/serve/feedback pipeline.
- **In-memory feedback store:** Adequate for demonstration; easy to replace with
  a database later without changing the API contract.
- **Explicit CORS + lifespan:** Matches the requirement for production-style lifecycle
  and security configuration rather than implicit defaults.
- **Single-model serving:** Model loads once at startup; inference is synchronous and
  low-latency for this dataset size.

---

## 7. Limitations & Next Steps

- Feedback is stored in-process; persistence requires a database integration.
- Optimization recommendations are rule-based on recent metrics; a more advanced
  approach could retrain or tune thresholds automatically.
- Metrics poll interval is fixed in the hook; could be made configurable or switched
  to SSE/WebSocket for lower latency.
- The synthetic dataset is generic; replacing `train_model.py` with a real dataset
  pipeline is straightforward.

---

## 8. File Manifest

- `README.md` — project overview and run instructions
- `REPORT.md` — this document
- `backend/app/main.py` — FastAPI app, CORS, lifespan, routers
- `backend/app/ml/model.py` — model load + predict
- `backend/app/api/*.py` — endpoint implementations
- `backend/app/core/config.py` — configuration
- `backend/scripts/train_model.py` — training script
- `backend/requirements.txt` — Python deps
- `backend/models/model.joblib` — trained model
- `backend/data/raw_dataset.joblib` — training data
- `frontend/package.json` — Node deps + scripts
- `frontend/vite.config.ts` — Vite config
- `frontend/index.html` — entry HTML
- `frontend/src/*.tsx/ts/css` — React dashboard source
