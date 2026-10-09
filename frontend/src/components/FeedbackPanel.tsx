import { useState } from "react";
import { api } from "../api";

interface Props {
  predictionId: string;
}

export function FeedbackPanel({ predictionId }: Props) {
  const [value, setValue] = useState<0 | 1>(0);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.feedback(predictionId, value);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "feedback failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card feedback">
      <h2>Submit Feedback</h2>
      <form onSubmit={handleSubmit} className="feedback-form">
        <div className="feedback-options">
          <label className={`feedback-option ${value === 0 ? "selected" : ""}`}>
            <input
              type="radio"
              name="actual"
              value={0}
              checked={value === 0}
              onChange={() => setValue(0)}
            />
            Actual: Class 0
          </label>
          <label className={`feedback-option ${value === 1 ? "selected" : ""}`}>
            <input
              type="radio"
              name="actual"
              value={1}
              checked={value === 1}
              onChange={() => setValue(1)}
            />
            Actual: Class 1
          </label>
        </div>
        <div className="form-actions">
          <button type="submit" disabled={loading || !predictionId}>
            {loading ? "Submitting…" : "Submit Feedback"}
          </button>
        </div>
      </form>
      {error ? <div className="error">{error}</div> : null}
      {sent ? <div className="success">Feedback recorded for {predictionId.slice(0, 8)}…</div> : null}
    </section>
  );
}
