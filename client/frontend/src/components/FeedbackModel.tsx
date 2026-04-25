import React, { useState } from "react";
import { useFeedback } from "../hooks/useApi";

interface Props {
  hypothesis: string;
  experimentType: string;
  section: string;
  original: string;
  onClose: () => void;
}

export const FeedbackModal: React.FC<Props> = ({ hypothesis, experimentType, section, original, onClose }) => {
  const [rating, setRating] = useState<number>(3);
  const [correction, setCorrection] = useState("");
  const { submit, saving, saved, error } = useFeedback();

  const handleSubmit = async () => {
    await submit({ hypothesis, experiment_type: experimentType, section, rating, correction, original });
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000, padding: "1rem",
    }}>
      <div style={{
        background: "#fff", borderRadius: 16, padding: "1.75rem",
        maxWidth: 520, width: "100%", boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
        animation: "scaleIn 0.2s ease",
      }}>
        <style>{`@keyframes scaleIn{from{opacity:0;transform:scale(0.95)}to{opacity:1;transform:none}}`}</style>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <h3 style={{ margin: 0, fontSize: 17, color: "#1a1a2e" }}>Scientist Review</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}>✕</button>
        </div>

        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#888", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
            Section: {section}
          </div>
          <div style={{ fontSize: 13, color: "#555", background: "#f8f9ff", padding: "0.75rem", borderRadius: 8, lineHeight: 1.5, maxHeight: 80, overflow: "hidden" }}>
            {original.slice(0, 200)}...
          </div>
        </div>

        {/* Star rating */}
        <div style={{ marginBottom: "1rem" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#444", marginBottom: 8 }}>Quality Rating</div>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  fontSize: 24, background: "none", border: "none", cursor: "pointer",
                  color: star <= rating ? "#f59f00" : "#ddd",
                  transition: "color 0.1s",
                }}
              >★</button>
            ))}
          </div>
        </div>

        {/* Correction */}
        <div style={{ marginBottom: "1.25rem" }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "#444", display: "block", marginBottom: 8 }}>
            Correction / Annotation
          </label>
          <textarea
            value={correction}
            onChange={(e) => setCorrection(e.target.value)}
            placeholder="Describe what's wrong and how it should be corrected..."
            rows={4}
            style={{
              width: "100%", padding: "0.75rem", borderRadius: 8,
              border: "1.5px solid #e0e0e0", fontSize: 13, lineHeight: 1.5,
              resize: "vertical", boxSizing: "border-box", fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        {error && (
          <div style={{ padding: "0.625rem", background: "#fde8e8", borderRadius: 7, fontSize: 13, color: "#7b1a1a", marginBottom: 12 }}>
            {error}
          </div>
        )}

        {saved ? (
          <div style={{ padding: "0.75rem", background: "#e6f7ee", borderRadius: 8, textAlign: "center", color: "#155d27", fontWeight: 600 }}>
            ✓ Feedback saved — thank you!
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={onClose} style={{
              padding: "0.6rem 1.25rem", borderRadius: 8, border: "1.5px solid #ddd",
              background: "#fff", cursor: "pointer", fontSize: 14, color: "#555",
            }}>
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !correction.trim()}
              style={{
                padding: "0.6rem 1.5rem", borderRadius: 8, border: "none",
                background: saving || !correction.trim() ? "#b0bec5" : "#3b5bdb",
                color: "#fff", cursor: saving || !correction.trim() ? "not-allowed" : "pointer",
                fontSize: 14, fontWeight: 600,
              }}
            >
              {saving ? "Saving..." : "Submit Review"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
