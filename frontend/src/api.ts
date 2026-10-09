const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return res.json();
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`POST ${path} failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  health: () => get<import("./types").HealthResponse>("/health"),
  metrics: () => get<import("./types").MetricsResponse>("/metrics"),
  predict: (features: number[]) =>
    post<import("./types").PredictResponse>("/predict", { features }),
  feedback: (prediction_id: string, actual: 0 | 1) =>
    post<import("./types").FeedbackResponse>("/feedback", { prediction_id, actual }),
  optimize: () =>
    post<import("./types").OptimizeResponse>("/optimize", {}),
};
