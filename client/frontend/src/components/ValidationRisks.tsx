import React from "react";
import type { ValidationStrategy, Risk } from "../utils/api";

interface ValidationProps { validation: ValidationStrategy }
interface RisksProps { risks: Risk[] }

export const ValidationPanel: React.FC<ValidationProps> = ({ validation }) => (
  <div style={{ display: "grid", gap: 14 }}>
    {[
      { label: "Primary Metric", value: validation.primary_metric, icon: "◎" },
      { label: "Success Threshold", value: validation.success_threshold, icon: "✓" },
      { label: "Statistical Test", value: validation.statistical_test, icon: "∑" },
      { label: "Sample Size", value: validation.sample_size_justification, icon: "#" },
      { label: "Failure Criteria", value: validation.failure_criteria, icon: "✗" },
    ].map(({ label, value, icon }) => (
      <div key={label} style={{
        display: "flex", gap: 14, padding: "0.875rem",
        background: "#fafafa", border: "1px solid #eee", borderRadius: 10,
      }}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, background: "#f0f4ff",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 18, color: "#3b5bdb", flexShrink: 0, fontWeight: 700,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 13.5, color: "#1a1a2e", lineHeight: 1.5 }}>{value}</div>
        </div>
      </div>
    ))}

    {validation.controls?.length > 0 && (
      <div style={{ padding: "0.875rem", background: "#e8f0fe", border: "1px solid #c5d5f8", borderRadius: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#3b5bdb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Controls</div>
        {validation.controls.map((c, i) => (
          <div key={i} style={{ fontSize: 13, color: "#1a3a8c", marginBottom: 4, paddingLeft: 8, borderLeft: "3px solid #3b5bdb" }}>{c}</div>
        ))}
      </div>
    )}
  </div>
);

const RISK_COLORS = {
  high:   { bg: "#fde8e8", border: "#e74c3c", color: "#7b1a1a", dot: "#e74c3c" },
  medium: { bg: "#fff8e1", border: "#f39c12", color: "#7d5a00", dot: "#f39c12" },
  low:    { bg: "#e6f7ee", border: "#27ae60", color: "#155d27", dot: "#27ae60" },
};

export const RisksPanel: React.FC<RisksProps> = ({ risks }) => (
  <div style={{ display: "grid", gap: 10 }}>
    {risks.map((r, i) => {
      const style = RISK_COLORS[r.likelihood] ?? RISK_COLORS.medium;
      return (
        <div key={i} style={{
          padding: "0.875rem 1rem", borderRadius: 10,
          background: style.bg, border: `1px solid ${style.border}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: style.dot }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: style.dot, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              {r.likelihood} risk
            </span>
          </div>
          <div style={{ fontWeight: 600, color: style.color, fontSize: 13.5, marginBottom: 6 }}>{r.risk}</div>
          <div style={{ fontSize: 13, color: style.color, opacity: 0.8 }}>
            <strong>Mitigation:</strong> {r.mitigation}
          </div>
        </div>
      );
    })}
  </div>
);
