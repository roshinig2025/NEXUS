from fastapi import APIRouter, Request
from pydantic import BaseModel, field_validator

router = APIRouter()


class FeedbackRequest(BaseModel):
    prediction_id: str
    actual: int

    @field_validator("actual")
    @classmethod
    def validate_actual(cls, value):
        if value not in (0, 1):
            raise ValueError("actual must be 0 or 1")
        return value


class FeedbackResponse(BaseModel):
    received: bool
    prediction_id: str


@router.post("/feedback", response_model=FeedbackResponse)
async def feedback_endpoint(payload: FeedbackRequest, request: Request):
    state = request.app.state
    state.feedback_store[payload.prediction_id] = payload.actual
    state.total_feedback += 1
    # Mark correctness using most recent prediction id if available
    recent_pred = state.recent_prediction_id
    if recent_pred == payload.prediction_id and getattr(state, "last_prediction", None) is not None:
        state.correct_predictions += int(state.last_prediction == payload.actual)
    return FeedbackResponse(received=True, prediction_id=payload.prediction_id)
