export interface HealthResponse {
  status: "ok" | "degraded";
  model_loaded: boolean;
  model_type: string | null;
  n_features: number | null;
  n_classes: number | null;
  n_samples: number | null;
  test_accuracy: number | null;
}

export interface PredictRequest {
  features: number[];
}

export interface PredictResponse {
  prediction: number;
  confidence: number;
  probabilities: number[];
  prediction_id: string;
}

export interface FeedbackRequest {
  prediction_id: string;
  actual: 0 | 1;
}

export interface FeedbackResponse {
  received: boolean;
  prediction_id: string;
}

export interface MetricPoint {
  timestamp: string;
  total_predictions: number;
  total_feedback: number;
  running_accuracy: number;
  avg_confidence: number;
  correct_predictions: number;
}

export interface MetricsResponse {
  metrics: MetricPoint[];
  latest: MetricPoint;
}

export interface Recommendation {
  action: string;
  rationale: string;
  priority: string;
}

export interface OptimizeResponse {
  analyzed_at: string;
  predictions: number;
  feedbacks: number;
  running_accuracy: number;
  avg_confidence: number;
  recommendations: Recommendation[];
}
