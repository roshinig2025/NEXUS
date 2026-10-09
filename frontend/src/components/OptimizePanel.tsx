import { useState } from "react";
import { api } from "../api";
import type { OptimizeResponse } from "../types";

export function OptimizePanel() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OptimizeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOptimize = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.optimize();
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "optimize failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card optimize">
      <h2>Optimization Recommendations</h2>
      <button onClick={handleOptimize} disabled={loading} className="optimize-button">
        {loading ? "Analyzing…" : "Run Optimization"}
      </button>
      {error ? <div className="error">{error}</div> : null}
      {data ? (
        <div className="optimize-result">
          <p className="optimize-summary">
            Analyzed at {data.analyzed_at.slice(11, 19)} · {data.predictions} predictions ·{" "}
            {data.feedbacks} feedbacks
          </p>
          <ul className="recommendations">
            {data.recommendations.map((r, i) => (
              <li key={i} className={`rec ${r.priority}`}>
                <strong>{r.action}</strong>
                <p>{r.rationale}</p>
                <span className="priority-badge">{r.priority}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
