import React, { useState } from "react";
import type { ExperimentPlan } from "../utils/api";
import { ProtocolSection } from "../components/ProtocolSection";
import { MaterialsTable } from "../components/MaterialsTable";
import { BudgetPanel, TimelinePanel } from "../components/BudgetTimeline";
import { ValidationPanel, RisksPanel } from "../components/ValidationRisks";
import { FeedbackModal } from "../components/FeedbackModel";

interface Props {
  plan: ExperimentPlan;
  hypothesis: string;
}

type TabId = "design" | "protocol" | "materials" | "budget" | "timeline" | "validation" | "risks";

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: "design",     label: "Design",     icon: "⬡" },
  { id: "protocol",   label: "Protocol",   icon: "≡" },
  { id: "materials",  label: "Materials",  icon: "⊞" },
  { id: "budget",     label: "Budget",     icon: "$" },
  { id: "timeline",   label: "Timeline",   icon: "▶" },
  { id: "validation", label: "Validation", icon: "✓" },
  { id: "risks",      label: "Risks",      icon: "⚠" },
];

export const ExperimentPlanPage: React.FC<Props> = ({ plan, hypothesis }) => {
  const [activeTab, setActiveTab] = useState<TabId>("design");
  const [feedbackCtx, setFeedbackCtx] = useState<{ section: string; original: string } | null>(null);

  const openFeedback = (section: string, original: string) =>
    setFeedbackCtx({ section, original });

  return (
    <div style={{ animation: "fadeUp 0.4s ease" }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}`}</style>

      {/* Hypothesis banner */}
      <div style={{
        padding: "1rem 1.25rem",
        background: "linear-gradient(135deg, #1a1a2e 0%, #2d3a8c 100%)",
        borderRadius: 12, marginBottom: "1.25rem",
      }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>
          Hypothesis
        </div>
        <p style={{ margin: 0, color: "#fff", fontSize: 14, lineHeight: 1.6 }}>{plan.hypothesis}</p>
        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
          Model: {plan.model_used?.split("/").pop()}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: "1.25rem", overflowX: "auto", paddingBottom: 4 }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "6px 14px", borderRadius: 8, border: "1.5px solid",
              borderColor: activeTab === tab.id ? "#3b5bdb" : "#e0e0e0",
              background: activeTab === tab.id ? "#3b5bdb" : "#fff",
              color: activeTab === tab.id ? "#fff" : "#555",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              whiteSpace: "nowrap", transition: "all 0.15s",
              display: "flex", alignItems: "center", gap: 6,
            }}
          >
            <span style={{ fontSize: 14 }}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{ minHeight: 200 }}>
        {activeTab === "design" && (
          <div style={{ display: "grid", gap: 14 }}>
            {/* Type + sample size */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <InfoCard label="Experiment Type" value={plan.experimental_design?.type} accent="#3b5bdb" />
              <InfoCard label="Sample Size" value={plan.experimental_design?.sample_size} accent="#0ca678" />
            </div>

            {/* Groups */}
            <SectionCard title="Experimental Groups" onFeedback={() => openFeedback("Experimental Groups", plan.experimental_design?.groups?.join("\n"))}>
              {plan.experimental_design?.groups?.map((g, i) => (
                <div key={i} style={{
                  padding: "0.625rem 0.875rem", borderRadius: 8,
                  background: i === 0 ? "#e8f5e9" : "#e8f0fe",
                  color: i === 0 ? "#1e7e34" : "#1a56db",
                  fontSize: 13.5, marginBottom: 6, fontWeight: 500,
                }}>
                  {g}
                </div>
              ))}
            </SectionCard>

            {/* Variables */}
            <SectionCard title="Key Variables">
              <div style={{ display: "grid", gap: 8 }}>
                {[
                  { label: "Independent", value: plan.experimental_design?.key_variables?.independent, color: "#3b5bdb" },
                  { label: "Dependent", value: plan.experimental_design?.key_variables?.dependent, color: "#0ca678" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{
                      minWidth: 90, fontSize: 11, fontWeight: 700, color,
                      textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 2,
                    }}>{label}</span>
                    <span style={{ fontSize: 13.5, color: "#333", lineHeight: 1.5 }}>{value}</span>
                  </div>
                ))}
                <div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", display: "block", marginBottom: 6 }}>Controlled</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {plan.experimental_design?.key_variables?.controlled?.map((v, i) => (
                      <span key={i} style={{ padding: "3px 10px", background: "#f5f5f5", borderRadius: 20, fontSize: 12.5, color: "#555" }}>{v}</span>
                    ))}
                  </div>
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {activeTab === "protocol" && (
          <ProtocolSection
            steps={plan.protocol || []}
            onFeedback={(step) => openFeedback(`Protocol Step ${step.step}`, step.description)}
          />
        )}

        {activeTab === "materials" && (
          <MaterialsTable materials={plan.materials || []} />
        )}

        {activeTab === "budget" && (
          <BudgetPanel budget={plan.budget} />
        )}

        {activeTab === "timeline" && (
          <TimelinePanel weeks={plan.timeline || []} />
        )}

        {activeTab === "validation" && (
          <ValidationPanel validation={plan.validation} />
        )}

        {activeTab === "risks" && (
          <RisksPanel risks={plan.risks || []} />
        )}
      </div>

      {/* Feedback modal */}
      {feedbackCtx && (
        <FeedbackModal
          hypothesis={hypothesis}
          experimentType={plan.experimental_design?.type || ""}
          section={feedbackCtx.section}
          original={feedbackCtx.original}
          onClose={() => setFeedbackCtx(null)}
        />
      )}
    </div>
  );
};

// ─── Small sub-components ────────────────────────────────────────────────────

const InfoCard: React.FC<{ label: string; value: string; accent: string }> = ({ label, value, accent }) => (
  <div style={{
    padding: "1rem", background: "#fafafa",
    border: `1px solid ${accent}33`, borderRadius: 10,
    borderLeft: `4px solid ${accent}`,
  }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a2e", textTransform: "capitalize" }}>{value}</div>
  </div>
);

const SectionCard: React.FC<{
  title: string;
  children: React.ReactNode;
  onFeedback?: () => void;
}> = ({ title, children, onFeedback }) => (
  <div style={{ background: "#fafafa", border: "1px solid #eee", borderRadius: 10, padding: "1rem" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
      {onFeedback && (
        <button onClick={onFeedback} style={{
          fontSize: 11, color: "#3b5bdb", background: "none", border: "none",
          cursor: "pointer", padding: 0, textDecoration: "underline",
        }}>Review</button>
      )}
    </div>
    {children}
  </div>
);
