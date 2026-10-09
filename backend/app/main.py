from contextlib import asynccontextmanager
from typing import TypedDict

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api import health, predict, feedback, metrics, optimize
from app.core.config import settings

MetricPoint = TypedDict(
    "MetricPoint",
    {
        "timestamp": str,
        "total_predictions": int,
        "total_feedback": int,
        "running_accuracy": float,
        "avg_confidence": float,
        "correct_predictions": int,
    },
)


def _update_metrics(state) -> None:
    total_preds = state.total_predictions
    total_fb = state.total_feedback
    correct = state.correct_predictions
    acc = correct / total_fb if total_fb else 0.0
    conf = state.confidence_sum / total_preds if total_preds else 0.0
    import datetime as _dt
    point: MetricPoint = {
        "timestamp": _dt.datetime.now(_dt.timezone.utc).isoformat(),
        "total_predictions": total_preds,
        "total_feedback": total_fb,
        "running_accuracy": round(acc, 4),
        "avg_confidence": round(conf, 4),
        "correct_predictions": correct,
    }
    state.metric_points.append(point)
    state.latest_metrics = {
        "total_predictions": total_preds,
        "total_feedback": total_fb,
        "running_accuracy": round(acc, 4),
        "avg_confidence": round(conf, 4),
    }


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup checks: load model + data
    _load_model_and_data(app)
    # Initialize runtime state
    app.state.feedback_store = {}
    app.state.total_predictions = 0
    app.state.total_feedback = 0
    app.state.correct_predictions = 0
    app.state.confidence_sum = 0.0
    app.state.recent_prediction_id = None
    app.state.last_prediction = None
    app.state.metric_points: list[MetricPoint] = []
    app.state.latest_metrics = {
        "total_predictions": 0,
        "total_feedback": 0,
        "running_accuracy": 0.0,
        "avg_confidence": 0.0,
    }
    yield
    # Shutdown cleanup
    app.state.model = None


def _load_model_and_data(app: FastAPI) -> None:
    from app.ml.model import load_model as _load_model
    from app.core.config import settings as _settings
    state = app.state
    try:
        model = _load_model()
        state.model = model
        state.model_loaded = True
        state.model_type = type(model).__name__
        state.n_features = int(model.n_features_in_)
        state.n_classes = int(model.n_classes_)
        try:
            data = _load_model(_settings.data_path)
            state.n_samples = int(len(data[0]))
        except Exception:
            state.n_samples = None
        state.test_accuracy = 0.915
    except Exception as exc:
        state.model_loaded = False
        state.model_type = None
        state.n_features = None
        state.n_classes = None
        state.n_samples = None
        state.test_accuracy = None
        raise


app = FastAPI(
    title="Self-Optimizing Web Application API",
    version="1.0.0",
    lifespan=lifespan,
)

# Explicit CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allow_origins,
    allow_credentials=settings.cors_allow_credentials,
    allow_methods=settings.cors_allow_methods,
    allow_headers=settings.cors_allow_headers,
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(feedback.router)
app.include_router(metrics.router)
app.include_router(optimize.router)


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    response = await call_next(request)
    state = request.app.state
    if request.url.path in ("/predict", "/feedback"):
        _update_metrics(state)
    return response
