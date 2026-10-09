from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, field_validator
import uuid

from app.ml.model import predict

router = APIRouter()


class PredictRequest(BaseModel):
    features: list[float]

    @field_validator("features")
    @classmethod
    def validate_feature_count(cls, value):
        if len(value) != 10:
            raise ValueError("features must contain exactly 10 numeric values")
        return value


class PredictResponse(BaseModel):
    prediction: int
    confidence: float
    probabilities: list[float]
    prediction_id: str


@router.post("/predict", response_model=PredictResponse)
async def predict_endpoint(payload: PredictRequest, request: Request):
    model = getattr(request.app.state, "model", None)
    if not model or not getattr(request.app.state, "model_loaded", False):
        raise HTTPException(status_code=503, detail="Model not loaded")
    result = predict(model, payload.features)
    pred_id = str(uuid.uuid4())
    state = request.app.state
    state.total_predictions += 1
    state.confidence_sum += result["confidence"]
    state.recent_prediction_id = pred_id
    state.last_prediction = result["prediction"]
    result["prediction_id"] = pred_id
    return PredictResponse(**result)
