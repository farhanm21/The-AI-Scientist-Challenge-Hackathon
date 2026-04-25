import React from "react";
import type { Budget, TimelineWeek } from "../utils/api";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

type BudgetKey =
  | "reagents_total"
  | "consumables_total"
  | "equipment_total"
  | "labor_total"
  | "overhead_total";

// ─────────────────────────────────────────────
// BUDGET
// ─────────────────────────────────────────────

interface BudgetProps {
  budget: Budget;
}

const fmt = (n: number, currency = "USD") =>
  Number(n || 0).toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  });

const BUDGET_LINES: {
  key: BudgetKey;
  label: string;
  color: string;
}[] = [
  { key: "reagents_total", label: "Reagents", color: "#3b5bdb" },
  { key: "consumables_total", label: "Consumables", color: "#0ca678" },
  { key: "equipment_total", label: "Equipment", color: "#f59f00" },
  { key: "labor_total", label: "Labor", color: "#7950f2" },
  { key: "overhead_total", label: "Overhead", color: "#f76707" },
];

export const BudgetPanel: React.FC<BudgetProps> = ({ budget }) => {
  const grand = budget.grand_total || 0;

  return (
    <div>
      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
          gap: 10,
          marginBottom: 20,
        }}
      >
        {BUDGET_LINES.map(({ key, label, color }) => {
          const val = budget[key] || 0;
          const pct = grand > 0 ? Math.round((val / grand) * 100) : 0;

          return (
            <div
              key={key}
              style={{
                padding: "0.875rem",
                borderRadius: 10,
                background: "#fafafa",
                border: "1px solid #eee",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "#888",
                  fontWeight: 600,
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {label}
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: "#1a1a2e",
                  marginBottom: 6,
                }}
              >
                {fmt(val, budget.currency)}
              </div>

              {/* Progress bar */}
              <div style={{ height: 4, background: "#eee", borderRadius: 2 }}>
                <div
                  style={{
                    height: 4,
                    background: color,
                    borderRadius: 2,
                    width: `${pct}%`,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>

              <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
                {pct}%
              </div>
            </div>
          );
        })}
      </div>

      {/* Total */}
      <div
        style={{
          padding: "1rem 1.25rem",
          background: "linear-gradient(135deg, #1a1a2e, #2d3a8c)",
          borderRadius: 12,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            color: "rgba(255,255,255,0.7)",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          Total Estimated Budget
        </span>

        <span style={{ color: "#fff", fontWeight: 800, fontSize: 22 }}>
          {fmt(grand, budget.currency)}
        </span>
      </div>

      {budget.notes && (
        <p
          style={{
            marginTop: 12,
            fontSize: 12.5,
            color: "#888",
            fontStyle: "italic",
          }}
        >
          * {budget.notes}
        </p>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// TIMELINE
// ─────────────────────────────────────────────

interface TimelineProps {
  weeks: TimelineWeek[];
}

const PHASE_COLORS = [
  "#3b5bdb",
  "#0ca678",
  "#f59f00",
  "#f76707",
  "#7950f2",
  "#e03131",
  "#1098ad",
];

export const TimelinePanel: React.FC<TimelineProps> = ({ weeks }) => (
  <div style={{ position: "relative", paddingLeft: 32 }}>
    {/* Vertical line */}
    <div
      style={{
        position: "absolute",
        left: 11,
        top: 0,
        bottom: 0,
        width: 2,
        background: "linear-gradient(to bottom, #3b5bdb, #e0e0e0)",
        borderRadius: 2,
      }}
    />

    {weeks.map((week, i) => {
      const color = PHASE_COLORS[i % PHASE_COLORS.length];

      return (
        <div
          key={`${week.week}-${week.phase}`}
          style={{ position: "relative", marginBottom: 24 }}
        >
          {/* Dot */}
          <div
            style={{
              position: "absolute",
              left: -32,
              top: 3,
              width: 22,
              height: 22,
              borderRadius: "50%",
              background: color,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 800,
              border: "3px solid #fff",
              boxShadow: `0 0 0 2px ${color}`,
            }}
          >
            {week.week}
          </div>

          <div
            style={{
              background: "#fafafa",
              border: "1px solid #eee",
              borderLeft: `3px solid ${color}`,
              borderRadius: "0 10px 10px 0",
              padding: "0.875rem 1rem",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 8,
              }}
            >
              <strong style={{ color: "#1a1a2e", fontSize: 14 }}>
                {week.phase}
              </strong>

              <span
                style={{
                  fontSize: 11,
                  padding: "2px 8px",
                  borderRadius: 20,
                  background: `${color}22`,
                  color,
                  fontWeight: 700,
                }}
              >
                Week {week.week}
              </span>
            </div>

            <ul style={{ margin: "0 0 8px", paddingLeft: 18 }}>
              {(week.tasks ?? []).map((t, j) => (
                <li
                  key={j}
                  style={{
                    fontSize: 13,
                    color: "#444",
                    marginBottom: 3,
                    lineHeight: 1.5,
                  }}
                >
                  {t}
                </li>
              ))}
            </ul>

            {week.dependencies && (
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                <strong>Depends on:</strong> {week.dependencies}
              </div>
            )}

            {week.deliverable && (
              <div
                style={{
                  fontSize: 12,
                  padding: "4px 10px",
                  background: "#e8f5e9",
                  borderRadius: 6,
                  color: "#1e7e34",
                  display: "inline-block",
                  fontWeight: 600,
                }}
              >
                ✓ {week.deliverable}
              </div>
            )}
          </div>
        </div>
      );
    })}
  </div>
);