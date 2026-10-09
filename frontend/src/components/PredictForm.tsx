import { useState } from "react";
import { api } from "../api";
import type { PredictResponse } from "../types";

interface Props {
  onResult?: (res: PredictResponse) => void;
}

export function PredictForm({ onResult }: Props) {
  const [features, setFeatures] = useState<string[]>(
    Array.from({ length: 10 }, () => "0.0"),
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PredictResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = features.map((v) => {
      const n = parseFloat(v);
      if (!Number.isFinite(n)) throw new Error("All features must be numbers");
      return n;
    });
    setLoading(true);
    setError(null);
    try {
      const res = await api.predict(values);
      setResult(res);
      onResult?.(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "prediction failed");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card predict">
      <h2>Test Prediction</h2>
      <form onSubmit={handleSubmit} className="predict-form">
        <div className="features-grid">
          {features.map((_, i) => (
            <label key={i} className="feature-field">
              Feature {i + 1}
              <input
                type="text"
                inputMode="decimal"
                value={features[i]}
                onChange={(e) => {
                  const next = [...features];
                  next[i] = e.target.value;
                  setFeatures(next);
                }}
              />
            </label>
          ))}
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading}>
            {loading ? "Predicting…" : "Predict"}
          </button>
        </div>
      </form>
      {error ? <div className="error">{error}</div> : null}
      {result ? (
        <div className="prediction-result">
          <h3>Result</h3>
          <p>
            <strong>Prediction:</strong> {result.prediction}
          </p>
          <p>
            <strong>Confidence:</strong> {(result.confidence * 100).toFixed(2)}%
          </p>
          <p>
            <strong>Probabilities:</strong> [class 0: {(result.probabilities[0] * 100).toFixed(2)}%, class 1: {(result.probabilities[1] * 100).toFixed(2)}%]
          </p>
          <p className="predict-id">
            <strong>Prediction ID:</strong> {result.prediction_id}
          </p>
        </div>
      ) : null}
    </section>
  );
}
