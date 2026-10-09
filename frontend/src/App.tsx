import { useEffect, useState, useCallback } from "react";
import { useMetrics } from "./hooks/useMetrics";
import { Layout } from "./components/Layout";
import { HealthCard } from "./components/HealthCard";
import { MetricsChart } from "./components/MetricsChart";
import { PredictForm } from "./components/PredictForm";
import { FeedbackPanel } from "./components/FeedbackPanel";
import { OptimizePanel } from "./components/OptimizePanel";
import { api } from "./api";
import type { HealthResponse, PredictResponse } from "./types";

export function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [lastPrediction, setLastPrediction] = useState<PredictResponse | null>(null);
  const { metrics, latest, error: metricsError } = useMetrics();
  void latest;

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const h = await api.health();
        if (!cancelled) setHealth(h);
      } catch (err) {
        if (!cancelled) setHealthError(err instanceof Error ? err.message : "health error");
      }
    };
    fetch();
    const id = setInterval(fetch, 5000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const onPredictResult = useCallback((res: PredictResponse) => {
    setLastPrediction(res);
  }, []);

  return (
    <Layout>
      <div className="dashboard-grid">
        <section className="card health-col">
          {health ? (
            <HealthCard health={health} />
          ) : (
            <div className="card card-empty">Loading health…</div>
          )}
          {healthError ? <div className="error">{healthError}</div> : null}
        </section>

        <section className="card metrics-col">
          {metricsError ? (
            <div className="error">{metricsError}</div>
          ) : (
            <MetricsChart metrics={metrics} />
          )}
        </section>

        <section className="card predict-col">
          <PredictForm onResult={onPredictResult} />
        </section>

        <section className="card feedback-col">
          {lastPrediction ? (
            <FeedbackPanel predictionId={lastPrediction.prediction_id} />
          ) : (
            <div className="card card-empty">Make a prediction first</div>
          )}
        </section>

        <section className="card optimize-col">
          <OptimizePanel />
        </section>
      </div>
    </Layout>
  );
}
