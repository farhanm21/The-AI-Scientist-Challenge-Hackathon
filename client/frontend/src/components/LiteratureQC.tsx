import React from "react";
import type { LitQCResult } from "../utils/api";

interface Props {
  result: LitQCResult;
  loading: boolean;
  error: string | null;
}

const SIGNAL_CONFIG = {
  "not found": {
    bg: "#e6f7ee",
    border: "#27ae60",
    color: "#155d27",
    icon: "✦",
    label: "Novel — Not Found",
  },
  "similar work exists": {
    bg: "#fff8e1",
    border: "#f39c12",
    color: "#7d5a00",
    icon: "◈",
    label: "Similar Work Exists",
  },
  "exact match found": {
    bg: "#fde8e8",
    border: "#e74c3c",
    color: "#7b1a1a",
    icon: "⊗",
    label: "Exact Match Found",
  },
} as const;

const CONFIDENCE_BADGE: Record<string, { bg: string; color: string }> = {
  high:   { bg: "#dff0d8", color: "#2d6a2d" },
  medium: { bg: "#fdf2cc", color: "#7a5900" },
  low:    { bg: "#f9d6d5", color: "#8b2020" },
};

const LoadingPulse = () => (
  <div style={{ padding: "2rem 0" }}>
    {[1, 2, 3].map((i) => (
      <div
        key={i}
        style={{
          height: 18,
          marginBottom: 12,
          borderRadius: 6,
          background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
          backgroundSize: "200% 100%",
          animation: `shimmer 1.4s ease-in-out ${i * 0.15}s infinite`,
          width: i === 3 ? "60%" : "100%",
        }}
      />
    ))}
    <style>{`@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}`}</style>
  </div>
);

export const LiteratureQC: React.FC<Props> = ({ result, loading, error }) => {
  if (loading) return <LoadingPulse />;
  if (error) return (
    <div style={{ padding: "1rem", background: "#fde8e8", borderRadius: 10, color: "#7b1a1a", fontSize: 14 }}>
      <strong>Literature QC Error:</strong> {error}
    </div>
  );
  if (!result) return null;

  const sig = SIGNAL_CONFIG[result.novelty_signal] ?? SIGNAL_CONFIG["similar work exists"];
  const conf = CONFIDENCE_BADGE[result.confidence] ?? CONFIDENCE_BADGE["medium"];

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* Signal banner */}
      <div style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: "1rem 1.25rem",
        background: sig.bg,
        border: `1.5px solid ${sig.border}`,
        borderRadius: 12,
        marginBottom: "1.25rem",
      }}>
        <span style={{ fontSize: 22, color: sig.border }}>{sig.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <strong style={{ color: sig.color, fontSize: 15 }}>{sig.label}</strong>
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px",
              borderRadius: 20, textTransform: "uppercase", letterSpacing: "0.5px",
              background: conf.bg, color: conf.color,
            }}>
              {result.confidence} confidence
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: sig.color, opacity: 0.85, lineHeight: 1.5 }}>
            {result.summary}
          </p>
        </div>
      </div>

      {/* References */}
      {result.references?.length > 0 && (
        <div>
          <h4 style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#888", marginBottom: 10, margin: "0 0 10px" }}>
            Related References
          </h4>
          {result.references.map((ref, i) => (
            <div key={i} style={{
              padding: "0.875rem 1rem",
              background: "#fafafa",
              border: "1px solid #eee",
              borderLeft: `3px solid ${sig.border}`,
              borderRadius: "0 8px 8px 0",
              marginBottom: 8,
            }}>
              <div style={{ fontWeight: 600, fontSize: 13.5, color: "#1a1a2e", marginBottom: 3 }}>
                {ref.title}
              </div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 5 }}>
                {ref.authors} · {ref.journal} · {ref.year}
              </div>
              <div style={{ fontSize: 12.5, color: "#555", fontStyle: "italic" }}>
                {ref.relevance}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 11, color: "#aaa", marginTop: 12, textAlign: "right" }}>
        Model: {result.model_used?.split("/").pop()}
      </div>
    </div>
  );
};
