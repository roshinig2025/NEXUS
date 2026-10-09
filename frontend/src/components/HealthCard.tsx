import { HealthResponse } from "../types";

interface Props {
  health: HealthResponse;
}

export function HealthCard({ health }: Props) {
  return (
    <section className="card health">
      <h2>System Health</h2>
      <div className="status-row">
        <span className={`badge ${health.status}`}>{health.status}</span>
        <span className="model-loaded">
          Model loaded: {String(health.model_loaded)}
        </span>
      </div>
      <ul className="health-list">
        <li>
          <strong>Model type:</strong> {health.model_type ?? "—"}
        </li>
        <li>
          <strong>Features:</strong> {health.n_features ?? "—"}
        </li>
        <li>
          <strong>Classes:</strong> {health.n_classes ?? "—"}
        </li>
        <li>
          <strong>Samples:</strong> {health.n_samples ?? "—"}
        </li>
        <li>
          <strong>Test accuracy:</strong>{" "}
          {health.test_accuracy != null ? `${health.test_accuracy.toFixed(3)}` : "—"}
        </li>
      </ul>
    </section>
  );
}
