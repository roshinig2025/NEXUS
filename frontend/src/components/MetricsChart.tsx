import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { MetricPoint } from "../types";

interface Props {
  metrics: MetricPoint[];
}

export function MetricsChart({ metrics }: Props) {
  const data = useMemo(() => {
    return metrics.map((m) => ({
      time: m.timestamp.slice(11, 19),
      predictions: m.total_predictions,
      feedback: m.total_feedback,
      accuracy: (m.running_accuracy * 100).toFixed(1),
      confidence: (m.avg_confidence * 100).toFixed(1),
    }));
  }, [metrics]);

  if (data.length === 0) {
    return <div className="card metrics card-empty">No metrics yet</div>;
  }

  return (
    <div className="card metrics">
      <h2>Live Metrics</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="time" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Line yAxisId="left" type="monotone" dataKey="predictions" stroke="#4f46e5" />
          <Line yAxisId="left" type="monotone" dataKey="feedback" stroke="#0891b2" />
          <Line yAxisId="right" type="monotone" dataKey="accuracy" stroke="#16a34a" />
          <Line yAxisId="right" type="monotone" dataKey="confidence" stroke="#dc2626" />
        </LineChart>
      </ResponsiveContainer>
      <div className="legend">
        <span><span className="dot" style={{ background: "#4f46e5" }} />Predictions</span>
        <span><span className="dot" style={{ background: "#0891b2" }} />Feedback</span>
        <span><span className="dot" style={{ background: "#16a34a" }} />Accuracy %</span>
        <span><span className="dot" style={{ background: "#dc2626" }} />Confidence %</span>
      </div>
    </div>
  );
}
