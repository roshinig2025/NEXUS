import joblib
import numpy as np
from sklearn.base import BaseEstimator

from app.core.config import settings


def load_model(path: str = settings.model_path) -> BaseEstimator:
    """Load the serialized model. Call once at startup."""
    return joblib.load(path)


def predict(model: BaseEstimator, features: list[float]) -> dict:
    """Run inference and return prediction, confidence, and probabilities."""
    X = np.array(features, dtype=float).reshape(1, -1)
    probs = model.predict_proba(X)[0]
    pred = int(model.predict(X)[0])
    confidence = float(max(probs))
    return {
        "prediction": pred,
        "confidence": round(confidence, 4),
        "probabilities": [round(float(p), 4) for p in probs],
    }
