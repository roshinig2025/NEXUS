"""
train_model.py

Generates a synthetic dataset and trains a RandomForestClassifier.
Outputs:
  - backend/models/model.joblib
  - backend/data/raw_dataset.joblib
"""
from pathlib import Path

from sklearn.datasets import make_classification
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "models"
DATA_DIR = PROJECT_ROOT / "data"
MODEL_PATH = MODEL_DIR / "model.joblib"
DATA_PATH = DATA_DIR / "raw_dataset.joblib"


def main() -> None:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    X, y = make_classification(
        n_samples=2000,
        n_features=10,
        n_informative=6,
        n_redundant=2,
        random_state=42,
    )

    # Save raw dataset
    joblib.dump((X, y), DATA_PATH)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    clf = RandomForestClassifier(n_estimators=100, random_state=42)
    clf.fit(X_train, y_train)

    accuracy = clf.score(X_test, y_test)
    print(f"Test accuracy: {accuracy:.4f}")

    joblib.dump(clf, MODEL_PATH)
    print(f"Model saved to {MODEL_PATH}")
    print(f"Dataset saved to {DATA_PATH}")


if __name__ == "__main__":
    main()
