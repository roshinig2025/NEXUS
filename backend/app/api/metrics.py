from fastapi import APIRouter, Request
from datetime import datetime, timezone
from typing import TypedDict

router = APIRouter()


class MetricPoint(TypedDict):
    timestamp: str
    total_predictions: int
    total_feedback: int
    running_accuracy: float
    avg_confidence: float
    correct_predictions: int


class MetricsResponse(TypedDict):
    metrics: list[MetricPoint]
    latest: MetricPoint


@router.get("/metrics")
async def metrics(request: Request):
    state = request.app.state
    points: list[MetricPoint] = getattr(state, "metric_points", [])
    if not points:
        points = [{
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "total_predictions": 0,
            "total_feedback": 0,
            "running_accuracy": 0.0,
            "avg_confidence": 0.0,
            "correct_predictions": 0,
        }]
    latest = state.latest_metrics
    if not latest:
        latest = {
            "total_predictions": 0,
            "total_feedback": 0,
            "running_accuracy": 0.0,
            "avg_confidence": 0.0,
        }
    return {"metrics": points, "latest": latest}
