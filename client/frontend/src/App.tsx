import React, { useState } from "react";
import { useLiteratureQC, useExperimentPlan } from "./hooks/useApi";
import { LiteratureQC } from "./components/LiteratureQC";
import { ExperimentPlanPage } from "./pages/ExperimentPlanPage";

const SAMPLE_INPUTS = [
  {
    label: "Diagnostics",
    text: "A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes, matching laboratory ELISA sensitivity without requiring sample preprocessing.",
  },
  {
    label: "Gut Health",
    text: "Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls, measured by FITC-dextran assay, due to upregulation of tight junction proteins claudin-1 and occludin.",
  },
  {
    label: "Cell Biology",
    text: "Replacing sucrose with trehalose as a cryoprotectant in the freezing medium will increase post-thaw viability of HeLa cells by at least 15 percentage points compared to the standard DMSO protocol, due to trehalose's superior membrane stabilization at low temperatures.",
  },
  {
    label: "Climate",
    text: "Introducing Sporomusa ovata into a bioelectrochemical system at a cathode potential of −400mV vs SHE will fix CO₂ into acetate at a rate of at least 150 mmol/L/day, outperforming current biocatalytic carbon capture benchmarks by at least 20%.",
  },
];

type Stage = "input" | "qc" | "plan";

export default function App() {
  const [hypothesis, setHypothesis] = useState("");
  const [stage, setStage] = useState<Stage>("input");
  const [confirmed, setConfirmed] = useState(false);

  const litQC    = useLiteratureQC();
  const expPlan  = useExperimentPlan();

  const handleRun = async () => {
    if (!hypothesis.trim()) return;
    setStage("qc");
    setConfirmed(false);

    const qcResult = await litQC.check(hypothesis);
    if (!qcResult) return; // error handled in hook
  };

  const handleGeneratePlan = async () => {
    setConfirmed(true);
    setStage("plan");
    await expPlan.generate(hypothesis);
  };

  const handleReset = () => {
    setHypothesis("");
    setStage("input");
    setConfirmed(false);
    litQC.reset();
    expPlan.reset();
  };

  const isRunning = litQC.loading || expPlan.loading;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f4f6fb",
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
    }}>
      {/* Top nav */}
      <nav style={{
        background: "#fff",
        borderBottom: "1px solid #e8e8e8",
        padding: "0 2rem",
        height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 30, height: 30, background: "linear-gradient(135deg, #3b5bdb, #2d3a8c)",
            borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ color: "#fff", fontSize: 14, fontWeight: 800 }}>S</span>
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>SciLab</span>
          <span style={{ fontSize: 12, color: "#888", background: "#f0f4ff", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>
            AI Experiment Planner
          </span>
        </div>
        {stage !== "input" && (
          <button
            onClick={handleReset}
            style={{
              padding: "6px 16px", borderRadius: 8, border: "1.5px solid #e0e0e0",
              background: "#fff", cursor: "pointer", fontSize: 13, color: "#555",
              fontWeight: 600,
            }}
          >
            ← New Experiment
          </button>
        )}
      </nav>

      {/* Main content */}
      <main style={{ maxWidth: 860, margin: "0 auto", padding: "2rem 1rem" }}>

        {/* ── Input stage ── */}
        {stage === "input" && (
          <div style={{ animation: "fadeUp 0.4s ease" }}>
            <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}`}</style>

            {/* Hero */}
            <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
              <h1 style={{
                fontSize: "clamp(26px, 5vw, 38px)",
                fontWeight: 800, color: "#1a1a2e",
                margin: "0 0 0.75rem", letterSpacing: "-0.02em",
                lineHeight: 1.15,
              }}>
                From hypothesis to<br />
                <span style={{ color: "#3b5bdb" }}>executable experiment plan</span>
              </h1>
              <p style={{ color: "#666", fontSize: 16, maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
                Powered by open-source LLMs via Hugging Face. Enter a scientific hypothesis and get a complete, operationally grounded lab plan in minutes.
              </p>
            </div>

            {/* Input card */}
            <div style={{
              background: "#fff", borderRadius: 16, padding: "1.75rem",
              border: "1px solid #e8e8e8", marginBottom: "1.25rem",
              boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            }}>
              <label style={{ fontSize: 13, fontWeight: 700, color: "#555", display: "block", marginBottom: 10 }}>
                Scientific Hypothesis
              </label>
              <textarea
                value={hypothesis}
                onChange={(e) => setHypothesis(e.target.value)}
                placeholder="State your hypothesis — include the intervention, measurable outcome, threshold, and control condition..."
                rows={5}
                style={{
                  width: "100%", padding: "0.875rem 1rem",
                  borderRadius: 10, border: "1.5px solid #e0e0e0",
                  fontSize: 14, lineHeight: 1.65, resize: "vertical",
                  boxSizing: "border-box", fontFamily: "inherit",
                  outline: "none", transition: "border-color 0.2s",
                  color: "#1a1a2e",
                }}
                onFocus={(e) => (e.target.style.borderColor = "#3b5bdb")}
                onBlur={(e) => (e.target.style.borderColor = "#e0e0e0")}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem" }}>
                <span style={{ fontSize: 12, color: "#aaa" }}>{hypothesis.length} / 2000</span>
                <button
                  onClick={handleRun}
                  disabled={!hypothesis.trim() || hypothesis.length > 2000}
                  style={{
                    padding: "0.7rem 2rem", borderRadius: 10, border: "none",
                    background: !hypothesis.trim() ? "#b0bec5" : "linear-gradient(135deg, #3b5bdb, #2d3a8c)",
                    color: "#fff", fontWeight: 700, fontSize: 15,
                    cursor: !hypothesis.trim() ? "not-allowed" : "pointer",
                    boxShadow: hypothesis.trim() ? "0 4px 16px rgba(59,91,219,0.3)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  Run Literature QC →
                </button>
              </div>
            </div>

            {/* Sample inputs */}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, textAlign: "center" }}>
                Try a sample hypothesis
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
                {SAMPLE_INPUTS.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => setHypothesis(s.text)}
                    style={{
                      padding: "0.75rem 1rem", borderRadius: 10,
                      border: "1.5px solid #e0e0e0", background: "#fff",
                      cursor: "pointer", textAlign: "left",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#3b5bdb";
                      (e.currentTarget as HTMLElement).style.background = "#f0f4ff";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.borderColor = "#e0e0e0";
                      (e.currentTarget as HTMLElement).style.background = "#fff";
                    }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#3b5bdb", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4 }}>
                      {s.label}
                    </div>
                    <div style={{ fontSize: 12, color: "#666", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {s.text}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── QC stage ── */}
        {(stage === "qc" || stage === "plan") && (
          <div>
            {/* QC section */}
            <SectionWrapper
              step={1}
              title="Literature Quality Control"
              subtitle="Novelty check against published work"
              collapsed={stage === "plan" && confirmed}
            >
              <LiteratureQC result={litQC.result!} loading={litQC.loading} error={litQC.error} />

              {litQC.result && stage === "qc" && (
                <div style={{ marginTop: "1.5rem", display: "flex", gap: 12, justifyContent: "flex-end" }}>
                  <button onClick={handleReset} style={{
                    padding: "0.65rem 1.25rem", borderRadius: 9, border: "1.5px solid #ddd",
                    background: "#fff", cursor: "pointer", fontSize: 14, color: "#555", fontWeight: 600,
                  }}>
                    Revise Hypothesis
                  </button>
                  <button onClick={handleGeneratePlan} style={{
                    padding: "0.65rem 1.75rem", borderRadius: 9, border: "none",
                    background: "linear-gradient(135deg, #3b5bdb, #2d3a8c)",
                    color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(59,91,219,0.3)",
                  }}>
                    Generate Full Plan →
                  </button>
                </div>
              )}
            </SectionWrapper>

            {/* Plan section */}
            {stage === "plan" && (
              <SectionWrapper
                step={2}
                title="Experiment Plan"
                subtitle="Complete operational plan"
              >
                {expPlan.loading && (
                  <div style={{ textAlign: "center", padding: "3rem 0" }}>
                    <div style={{
                      width: 48, height: 48, border: "3px solid #e0e8ff",
                      borderTop: "3px solid #3b5bdb", borderRadius: "50%",
                      margin: "0 auto 1rem",
                      animation: "spin 0.8s linear infinite",
                    }} />
                    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                    <p style={{ color: "#666", fontSize: 14 }}>Generating your experiment plan via Hugging Face…</p>
                    <p style={{ color: "#aaa", fontSize: 12 }}>This may take 30–90 seconds for open-source models</p>
                  </div>
                )}
                {expPlan.error && (
                  <div style={{
                    padding: "1rem", background: "#fde8e8",
                    borderRadius: 10, color: "#7b1a1a", fontSize: 14,
                  }}>
                    <strong>Error generating plan:</strong> {expPlan.error}
                    <br />
                    <button
                      onClick={handleGeneratePlan}
                      style={{
                        marginTop: 10, padding: "6px 16px", borderRadius: 7,
                        border: "1px solid #e74c3c", background: "#fff",
                        color: "#e74c3c", cursor: "pointer", fontSize: 13, fontWeight: 600,
                      }}
                    >
                      Retry
                    </button>
                  </div>
                )}
                {expPlan.plan && (
                  <ExperimentPlanPage plan={expPlan.plan} hypothesis={hypothesis} />
                )}
              </SectionWrapper>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: "center", padding: "2rem",
        fontSize: 12, color: "#bbb", borderTop: "1px solid #e8e8e8",
        marginTop: "3rem", background: "#fff",
      }}>
        SciLab · Powered by Mistral-7B, Zephyr-7B, Phi-3 via Hugging Face Inference API · Open-source stack
      </footer>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

const SectionWrapper: React.FC<{
  step: number;
  title: string;
  subtitle: string;
  collapsed?: boolean;
  children: React.ReactNode;
}> = ({ step, title, subtitle, collapsed = false, children }) => {
  const [open, setOpen] = useState(true);

  return (
    <div style={{
      background: "#fff", borderRadius: 16,
      border: "1px solid #e8e8e8", marginBottom: "1.25rem",
      boxShadow: "0 2px 16px rgba(0,0,0,0.05)",
      overflow: "hidden",
    }}>
      <div
        onClick={() => setOpen((p) => !p)}
        style={{
          padding: "1rem 1.5rem", display: "flex", alignItems: "center", gap: 14,
          borderBottom: open ? "1px solid #e8e8e8" : "none",
          cursor: "pointer", background: open ? "#fafbff" : "#fff",
          transition: "background 0.2s",
        }}
      >
        <span style={{
          width: 28, height: 28, borderRadius: "50%",
          background: "linear-gradient(135deg, #3b5bdb, #2d3a8c)",
          color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 800, flexShrink: 0,
        }}>{step}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: "#1a1a2e" }}>{title}</div>
          <div style={{ fontSize: 12, color: "#888" }}>{subtitle}</div>
        </div>
        <span style={{ color: "#aaa", fontSize: 18 }}>{open ? "−" : "+"}</span>
      </div>

      {open && (
        <div style={{ padding: "1.5rem" }}>
          {children}
        </div>
      )}
    </div>
  );
};
