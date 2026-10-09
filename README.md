# Self-Optimizing Web Application
## Problem 04 — Machine Learning-Powered Adaptive System

A full-stack web application demonstrating a self-optimizing architecture where a
machine learning model continuously informs runtime decisions: a continuous
**MONITOR → PREDICT → OPTIMIZE → RECOVER** loop, observable in the browser.

Built with FastAPI, scikit-learn, React, and Vite, and deployed as a self-contained
edge application where the trained model itself is embedded in the server Worker.

- **Live deployment:** https://site-e0d933424d004ae3be314ef6f8115f28.freebuff.page
- **Report:** [REPORT.md](REPORT.md)

---

## The Self-Optimization Loop

1. **Observe** — the dashboard polls `/metrics` every 3s and plots predictions,
   feedback, running accuracy %, and confidence % as a live time-series.
2. **Predict** — every feature vector sent to `/predict` is scored by the trained
   RandomForest (91.5% test accuracy) and returns prediction + confidence +
   class probabilities + a prediction ID.
3. **Auto-Optimize** — `/optimize` inspects live metrics and emits prioritized,
   rationale-backed recommendations (threshold tuning, more feedback collection,
   evidence gathering) that appear in the dashboard.
4. **Recover** — the metric history is a rolling window, so recommendations
   revert automatically once metrics return to normal — closing the loop.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    React Frontend (Vite/TS)                  │
│   health card · live metrics chart · predict · feedback      │
└───────────────────────────┬────────────────────────────────┘
                            │ REST / JSON (same-origin)
                            ▼
┌────────────────────────────────────────────────────────────┐
│              API + inference (two interchangeable runtimes)   │
│                                                              │
│  deployment: edge Worker with the model EMBEDDED as JSON     │
│  local dev:  FastAPI + uvicorn + joblib (identical REST API) │
└───────────────────────────┬────────────────────────────────┘
                            │ trained on
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Trained ML Model                           │
│  RandomForestClassifier · scikit-learn 1.9                   │
│  2000 synthetic samples · 91.5% test accuracy                │
└────────────────────────────────────────────────────────────┘
```

### Directories

| Path         | Purpose                                                |
|--------------|--------------------------------------------------------|
| `backend/`   | FastAPI application, model artifacts, training data    |
| `frontend/`  | React/Vite SPA + deployed Worker (embeds the model)    |
| `data/`      | Shared synthetic dataset + model exports for inspection|
| `screenshots/` | Dashboard screenshots used in the report             |

---

## Quick Start

### Prerequisites

- Python >= 3.10
- Node.js >= 20
- npm or equivalent

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The server performs lifespan health checks on startup:
- Verifies the serialized model file is present and loadable
- Confirms the synthetic dataset is available
- Reports model metadata (type, feature count, classes, accuracy) via `/health`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (typically `http://localhost:5173`).

---

## API

### `GET /health`

Full system health check. Returns model metadata and dataset statistics.

```json
{
  "status": "ok",
  "model_loaded": true,
  "model_type": "RandomForestClassifier",
  "n_features": 10,
  "n_classes": 2,
  "n_samples": 2000,
  "test_accuracy": 0.915
}
```

### `GET /metrics`

Live metrics snapshot: rolling window of timestamped metric points plus the latest totals (predictions, feedback, running accuracy, average confidence).

### `POST /predict`

Send feature vectors and receive model predictions with confidence scores.

Request:
```json
{
  "features": [0.12, -0.45, 0.78, 0.03, -0.22, 0.51, -0.09, 0.33, -0.14, 0.67]
}
```

Response:
```json
{
  "prediction": 1,
  "confidence": 0.943,
  "probabilities": [0.057, 0.943]
}
```

### `POST /feedback`

Submit ground-truth feedback so the system can track prediction quality over time.

### `POST /optimize`

Trigger the recommendation engine. Returns optimization suggestions derived from
recent feedback and model confidence trends.

---

## Self-Optimization Features

1. **Model-driven inference** — every `/predict` call runs through the trained
   classifier; confidence scores feed the optimization loop.
2. **Feedback ingestion** — `/feedback` collects real outcomes; the backend
   aggregates accuracy metrics.
3. **Adaptive recommendations** — `/optimize` proposes configurations (e.g.,
   scaling hints, threshold adjustments) based on recent metric trends.
4. **Health-driven lifecycle** — FastAPI lifespan events validate model and data
   availability before serving traffic.

---

## Train Your Own Model

```bash
cd backend
python scripts/train_model.py
```

The script regenerates `backend/models/model.joblib` and `backend/data/raw_dataset.joblib`
from a fresh synthetic sample. Adjust `scripts/train_model.py` to swap datasets or
model families.

---

## Project Structure

```
.
├── README.md
├── REPORT.md
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py          # FastAPI app, CORS, lifespan, routers
│   │   ├── ml/
│   │   │   └── model.py     # Model loading + prediction logic
│   │   ├── api/
│   │   │   ├── health.py
│   │   │   ├── predict.py
│   │   │   ├── feedback.py
│   │   │   ├── metrics.py
│   │   │   └── optimize.py
│   │   └── core/
│   │       └── config.py    # App configuration
│   ├── models/
│   │   └── model.joblib     # Serialized RandomForestClassifier
│   ├── data/
│   │   └── raw_dataset.joblib
│   ├── scripts/
│   │   └── train_model.py
│   └── requirements.txt
├── frontend/
│   ├── package.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── api.ts           # Backend client
│       ├── types.ts        # Shared types
│       ├── hooks/
│       │   └── useMetrics.ts
│       └── components/
│           ├── Layout.tsx
│           ├── HealthCard.tsx
│           ├── MetricsChart.tsx
│           ├── PredictForm.tsx
│           ├── FeedbackPanel.tsx
│           └── OptimizePanel.tsx
└── data/
    └── (shared exports)
```

---

## Tech Stack

- **Backend:** FastAPI, uvicorn, Pydantic v2, scikit-learn, joblib
- **Frontend:** React 19, Vite, TypeScript, Recharts
- **ML:** RandomForestClassifier over synthetic tabular data

---

## Development Notes

- The backend uses explicit CORS middleware configured for local frontend origins.
- Lifespan events load the model once at startup and release resources on shutdown.
- The frontend polls `/metrics` for live dashboard updates.
- All ML inference runs synchronously in-process; no external model server is required.
