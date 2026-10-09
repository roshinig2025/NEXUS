from fastapi import APIRouter, Request
from datetime import datetime, timezone
from typing import TypedDict

router = APIRouter()


class Recommendation(TypedDict):
    action: str
    rationale: str
    priority: str


class OptimizeResponse(TypedDict):
    analyzed_at: str
    predictions: int
    feedbacks: int
    running_accuracy: float
    avg_confidence: float
    recommendations: list[Recommendation]


@router.post("/optimize")
async def optimize(request: Request):
    state = request.app.state
    latest = getattr(state, "latest_metrics", None)
    if latest is None:
        latest = {
            "total_predictions": 0,
            "total_feedback": 0,
            "running_accuracy": 0.0,
            "avg_confidence": 0.0,
        }

    preds = latest["total_predictions"]
    feeds = latest["total_feedback"]
    acc = latest["running_accuracy"]
    conf = latest["avg_confidence"]

    recs: list[Recommendation] = []
    if preds == 0:
        recs.append({
            "action": "send_predictions",
            "rationale": "No predictions recorded yet; collect traffic before optimizing.",
            "priority": "high",
        })
    else:
        if acc < 0.8:
            recs.append({
                "action": "review_model_thresholds",
                "rationale": f"Running accuracy is {acc:.2%}, below 80% target. Consider threshold tuning or retraining.",
                "priority": "high",
            })
        else:
            recs.append({
                "action": "maintain_model",
                "rationale": f"Running accuracy is {acc:.2%}, above target. Continue monitoring.",
                "priority": "low",
            })

        if conf < 0.6:
            recs.append({
                "action": "increase_evidence",
                "rationale": f"Average confidence is {conf:.2f}, low. Prefer higher-confidence decisions or gather more features.",
                "priority": "medium",
            })
        elif conf > 0.9:
            recs.append({
                "action": "scale_confident_paths",
                "rationale": f"High average confidence ({conf:.2f}). Consider automating high-confidence decision paths.",
                "priority": "medium",
            })

        if feeds < max(10, preds // 5):
            recs.append({
                "action": "collect_more_feedback",
                "rationale": f"Feedback coverage is low ({feeds} feedbacks for {preds} predictions). More ground truth improves optimization.",
                "priority": "high",
            })

    return OptimizeResponse(
        analyzed_at=datetime.now(timezone.utc).isoformat(),
        predictions=preds,
        feedbacks=feeds,
        running_accuracy=acc,
        avg_confidence=conf,
        recommendations=recs,
    )
