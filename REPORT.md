# Self-Optimizing Web Application — Project Report

**Name:** Roshini G
**Registration Number:** 25BCE1676
**Email ID:** roshini.g2025@vitstudent.ac.in

---

## Problem Statement (Problem 04)

Build a full-stack web application with an embedded ML-based monitoring engine that analyzes application performance, predicts potential bottlenecks, and automatically applies optimization strategies before users experience significant slowdowns — following a continuous **MONITOR → PREDICT → OPTIMIZE → RECOVER** cycle.

## Why I Chose This Problem Statement

I picked this problem because it combines three things I wanted to demonstrate in one coherent system:

1. **Real ML engineering** — training, serializing, and serving a model that drives runtime decisions, not just a dashboard with static numbers.
2. **Full-stack ownership** — a React frontend, an API layer, model artifacts, and a deployment story that all work together.
3. **A genuinely novel loop** — "self-optimizing" applications are usually a slide in a platform talk; here the observe → predict → actuate → recover loop is actually implemented end-to-end and observable in the browser.

The problem also had natural acceptance criteria (accuracy, latency, recoverability) which made it easy to verify the system objectively instead of guessing whether it "works."

## Approach / Proposed Solution

### MONITOR

The monitoring layer tracks live application metrics — prediction volume, feedback volume, running accuracy of the model against ground truth, and average model confidence. Every `/predict` and `/feedback` call appends a timestamped metric point, and the React dashboard polls `/metrics` every 3 seconds to render them as a live time-series chart (Recharts).

### PREDICT

The core engine is a `RandomForestClassifier` trained on 2,000 synthetic web-performance samples (10 features, 6 informative, 2 redundant) with a **91.5% test accuracy**. Each incoming feature vector is scored and the model returns a prediction, confidence, and full class probabilities with every response.

### AUTO-OPTIMIZE

An optimizations engine (`/optimize`) inspects the accumulated metrics and emits prioritized recommendations — e.g. *review model thresholds* when running accuracy drops below 80%, *increase evidence* when average confidence is low, or *collect more feedback* when feedback coverage lags predictions. Each recommendation carries an explicit rationale derived from the live numbers, so the optimization logic is transparent rather than a black box.

### RECOVER

Because the metric history is a rolling window, the system's recommendations revert on their own once the underlying metrics return to healthy levels — the same engine that suggests throttling/tuning when accuracy degrades suggests *maintain model* once numbers recover, closing the self-healing loop.

### Deployment architecture (notable)

The trained scikit-learn forest is **exported to JSON and embedded in the server Worker**, so the deployed application performs real model inference server-side — it is not a static demo and does not need a separate Python process running to be fully functional. I verified the JS inference is exactly identical to scikit-learn's output (30/30 random test vectors matched to 4 decimal places on probabilities and prediction).

## Technologies / Tools Used

| Layer | Technology |
|---|---|
| ML | Python, scikit-learn (`RandomForestClassifier`), joblib, NumPy |
| Backend (Python reference) | FastAPI, Pydantic v2, uvicorn — full API with CORS, lifespan health checks |
| Edge runtime (deployed) | JavaScript/TypeScript Worker, esbuild bundling |
| Frontend | React 19, TypeScript, Vite, Recharts |
| Deployment | Cloudflare Workers (static assets + server-side inference), freebuff.page |
| Version control | Git, GitHub |

## Key Features / Functionality

- **Live health card** — model type, feature count, class count, sample count, and test accuracy surfaced from `/health`.
- **Live metrics time-series** — predictions, feedback, running accuracy %, and confidence % plotted over time, auto-refreshing every 3s.
- **Interactive prediction form** — any 10-feature vector can be scored; the response shows prediction, confidence, class probabilities, and a unique prediction ID.
- **Feedback capture** — each prediction can be labeled with ground truth; feedback immediately affects the running-accuracy metric.
- **Optimization engine** — produces prioritized, rationale-backed recommendations from live metrics.
- **Self-contained deployment** — the model runs inside the edge Worker itself; the deployed site needs no external backend.

## Screenshots

The live deployed dashboard (captured in the walk-through recording `demo.webm` at the repository root):

- **System health card** — shows `OK`, model type `RandomForestClassifier`, 10 features, 2 classes, 2,000 samples, 0.915 test accuracy, fetched live from the deployed Worker's `/health` endpoint.
- **Live metrics chart** — a time-series of prediction count, feedback count, accuracy %, and confidence % rendered with Recharts, refreshing every 3 seconds from `/metrics`.
- **Test prediction** — a real inference from the deployed model, e.g. `Prediction: 1, Confidence: 67.00%, Probabilities: [class 0: 33.00%, class 1: 67.00%]` with a unique prediction ID, followed by the feedback panel to submit ground truth for that exact prediction.
- **Optimization recommendations** — the result of `/optimize`, emitting actions like *review model thresholds* or *collect more feedback* with concrete rationale strings derived from the live metric values.

Playback: open `demo.webm` (included at the repository root, ~2 minutes) or visit the deployment link above to reproduce every panel live.

*(Full walk-through recording: `demo.webm` in the repository root.)*

## GitHub Repository Link

https://github.com/roshinig2025/NEXUS

## Deployment Link

https://site-e0d933424d004ae3be314ef6f8115f28.freebuff.page

## Other Relevant Information

- **Inference parity:** I verified the deployed JavaScript implementation of the forest produces byte-identical results to scikit-learn (30/30 random vectors matched on prediction and probabilities). This means the deployed app runs *the same model*, not an approximation of it.
- **Reproducibility:** the model and dataset are re-trainable from scratch via `backend/scripts/train_model.py`.
- **Dual runtimes:** the repo maps 1:1 to two runtimes — a standard FastAPI + uvicorn stack for local development (`backend/`), and the deployed edge Worker that embeds the exported model. Both expose the same REST contract (`/health`, `/metrics`, `/predict`, `/feedback`, `/optimize`).
- **Honest limitations:** metrics state is in-memory per isolate (resets on redeploy); persistence would be the next step (D1/KV). Recommendations are currently rule-based over the live metrics rather than a second learned model.

---

*Report prepared October 2026.*
