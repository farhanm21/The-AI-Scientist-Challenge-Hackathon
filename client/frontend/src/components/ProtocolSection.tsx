import React, { useState } from "react";
import type { ProtocolStep } from "../utils/api";

interface Props {
  steps: ProtocolStep[];
  onFeedback?: (step: ProtocolStep) => void;
}

export const ProtocolSection: React.FC<Props> = ({ steps, onFeedback }) => {
  const [expanded, setExpanded] = useState<Set<number>>(new Set([1]));

  const toggle = (n: number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });

  return (
    <div>
      {steps.map((step) => {
        const open = expanded.has(step.step);
        return (
          <div key={step.step} style={{
            border: "1px solid #e8e8e8",
            borderRadius: 10,
            marginBottom: 10,
            overflow: "hidden",
            transition: "box-shadow 0.2s",
            boxShadow: open ? "0 2px 12px rgba(0,0,0,0.06)" : "none",
          }}>
            {/* Header */}
            <button
              onClick={() => toggle(step.step)}
              style={{
                width: "100%", display: "flex", alignItems: "center",
                gap: 14, padding: "0.875rem 1rem",
                background: open ? "#f0f4ff" : "#fff",
                border: "none", cursor: "pointer", textAlign: "left",
                borderBottom: open ? "1px solid #e0e8ff" : "none",
                transition: "background 0.2s",
              }}
            >
              <span style={{
                minWidth: 28, height: 28, borderRadius: "50%",
                background: open ? "#3b5bdb" : "#e8e8e8",
                color: open ? "#fff" : "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, flexShrink: 0,
              }}>{step.step}</span>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: "#1a1a2e" }}>
                {step.title}
              </span>
              <span style={{ fontSize: 12, color: "#888", marginRight: 8 }}>{step.duration}</span>
              <span style={{ color: "#aaa", fontSize: 16 }}>{open ? "−" : "+"}</span>
            </button>

            {/* Body */}
            {open && (
              <div style={{ padding: "1rem", animation: "fadeIn 0.2s ease" }}>
                <style>{`@keyframes fadeIn{from{opacity:0}to{opacity:1}}`}</style>
                <p style={{ margin: "0 0 0.75rem", fontSize: 14, lineHeight: 1.65, color: "#2c2c3e" }}>
                  {step.description}
                </p>
                {step.critical_notes && (
                  <div style={{
                    padding: "0.625rem 0.875rem",
                    background: "#fff8e1", borderRadius: 7,
                    border: "1px solid #ffe082", fontSize: 13,
                    color: "#7a5900",
                  }}>
                    <strong>⚠ Critical:</strong> {step.critical_notes}
                  </div>
                )}
                {onFeedback && (
                  <button
                    onClick={() => onFeedback(step)}
                    style={{
                      marginTop: 10, fontSize: 12, color: "#3b5bdb",
                      background: "none", border: "none", cursor: "pointer",
                      padding: 0, textDecoration: "underline",
                    }}
                  >
                    Suggest correction
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
