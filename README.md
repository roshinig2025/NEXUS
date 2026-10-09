# Self-Optimizing Web Application
## Problem 04 — Machine Learning-Powered Adaptive System

A full-stack web application demonstrating a self-optimizing architecture where a
machine learning model continuously informs runtime decisions. Built with FastAPI,
scikit-learn, React, and Vite.

---

## Architecture

```
┌────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│  (Vite + TypeScript + Recharts dashboard)                   │
│  React 19 · Strict Mode · SPA                               │
└───────────────────────────┬────────────────────────────────┘
                            │ REST / JSON
                            ▼
┌────────────────────────────────────────────────────────────┐
│                       FastAPI Backend                        │
│  uvicorn · lifespan health checks · explicit CORS           │
│  Pydantic v2 validation · ML inference endpoint             │
└───────────────────────────┬────────────────────────────────┘
                            │ joblib serialized model
                            ▼
┌────────────────────────────────────────────────────────────┐
│                   Trained ML Model                            │
│  RandomForestClassifier · scikit-learn 1.9                   │
│  2000 synthetic samples · 91.5% test accuracy               │
└────────────────────────────────────────────────────────────┘
```

### Directories

| Path         | Purpose                                                |
|--------------|--------------------------------------------------------|
| `backend/`   | FastAPI application, model artifacts, training data    |
| `frontend/`  | React/Vite SPA with adaptive optimization dashboard    |
| `data/`      | Shared synthetic dataset + model exports for inspection|

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

Live metrics snapshot (simulated telemetry for the dashboard).

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
