/**
 * SciLab API client — typed wrappers around Flask backend
 */

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface LitQCReference {
  title: string;
  authors: string;
  year: number;
  journal: string;
  relevance: string;
}

export interface LitQCResult {
  novelty_signal: "not found" | "similar work exists" | "exact match found";
  confidence: "high" | "medium" | "low";
  references: LitQCReference[];
  summary: string;
  model_used: string;
}

export interface ProtocolStep {
  step: number;
  title: string;
  description: string;
  duration: string;
  critical_notes: string;
}

export interface Material {
  name: string;
  supplier: string;
  catalog_ref: string;
  quantity: string;
  unit_cost: number;
  total_cost: number;
  category: "reagent" | "consumable" | "equipment" | "cell_line" | "animal";
}
 
export interface Budget {
  reagents_total: number;
  consumables_total: number;
  equipment_total: number;
  labor_total: number;
  overhead_total: number;
  grand_total: number;
  currency: string;
  notes: string;
}

export interface TimelineWeek {
  week: number;
  phase: string;
  tasks: string[];
  dependencies: string;
  deliverable: string;
}

export interface ValidationStrategy {
  primary_metric: string;
  success_threshold: string;
  statistical_test: string;
  sample_size_justification: string;
  controls: string[];
  failure_criteria: string;
}

export interface Risk {
  risk: string;
  likelihood: "high" | "medium" | "low";
  mitigation: string;
}

export interface ExperimentPlan {
  hypothesis: string;
  experimental_design: {
    type: string;
    groups: string[];
    key_variables: {
      independent: string;
      dependent: string;
      controlled: string[];
    };
    sample_size: string;
  };
  protocol: ProtocolStep[];
  materials: Material[];
  budget: Budget;
  timeline: TimelineWeek[];
  validation: ValidationStrategy;
  risks: Risk[];
  model_used: string;
}

export interface FeedbackPayload {
  hypothesis: string;
  experiment_type: string;
  section: string;
  rating: number;
  correction: string;
  original: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error || `HTTP ${res.status}`);
  }

  return json as T;
}

// ─── Endpoints ───────────────────────────────────────────────────────────────

export const api = {
  health: () => apiFetch<{ status: string; models: Record<string, string> }>("/api/health"),

  literatureQC: (hypothesis: string) =>
    apiFetch<LitQCResult>("/api/literature-qc", {
      method: "POST",
      body: JSON.stringify({ hypothesis }),
    }),

  experimentPlan: (hypothesis: string) =>
    apiFetch<ExperimentPlan>("/api/experiment-plan", {
      method: "POST",
      body: JSON.stringify({ hypothesis }),
    }),

  saveFeedback: (payload: FeedbackPayload) =>
    apiFetch<{ status: string; id: number }>("/api/feedback", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  feedbackStats: () =>
    apiFetch<{ total: number; by_section: Record<string, { count: number; avg_rating: number }> }>(
      "/api/feedback/stats"
    ),
};
