from fastapi import APIRouter, Request
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter()


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_type: str | None = None
    n_features: int | None = None
    n_classes: int | None = None
    n_samples: int | None = None
    test_accuracy: float | None = None


@router.get("/health", response_model=HealthResponse)
async def health(request: Request):
    state = request.app.state
    model_loaded = getattr(state, "model_loaded", False)
    return HealthResponse(
        status="ok" if state.model_loaded else "degraded",
        model_loaded=state.model_loaded,
        model_type=state.model_type,
        n_features=state.n_features,
        n_classes=state.n_classes,
        n_samples=state.n_samples,
        test_accuracy=state.test_accuracy,
    )
