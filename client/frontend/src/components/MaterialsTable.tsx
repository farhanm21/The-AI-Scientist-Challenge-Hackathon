import React, { useState } from "react";
import type { Material } from "../utils/api";

interface Props { materials: Material[] }

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  reagent:    { bg: "#e8f0fe", color: "#1a56db" },
  consumable: { bg: "#e6f4ea", color: "#1e7e34" },
  equipment:  { bg: "#fce8b2", color: "#7a4c00" },
  cell_line:  { bg: "#fce4ec", color: "#8b0030" },
  animal:     { bg: "#f3e5f5", color: "#6a1b9a" },
};

const fmt = (n: number) =>
  n != null ? `$${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—";

export const MaterialsTable: React.FC<Props> = ({ materials }) => {
  const [filter, setFilter] = useState<string>("all");
  const categories = ["all", ...Array.from(new Set(materials.map((m) => m.category)))];
  const filtered = filter === "all" ? materials : materials.filter((m) => m.category === filter);
  const total = materials.reduce((s, m) => s + (m.total_cost || 0), 0);

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: "4px 12px", borderRadius: 20, fontSize: 12, fontWeight: 600,
              border: "1.5px solid",
              borderColor: filter === cat ? "#3b5bdb" : "#e0e0e0",
              background: filter === cat ? "#3b5bdb" : "#fff",
              color: filter === cat ? "#fff" : "#555",
              cursor: "pointer", transition: "all 0.15s", textTransform: "capitalize",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: "#f8f9ff" }}>
              {["Item", "Supplier", "Catalog Ref", "Qty", "Unit Cost", "Total"].map((h) => (
                <th key={h} style={{
                  padding: "8px 12px", textAlign: "left", fontWeight: 700,
                  color: "#444", borderBottom: "2px solid #e8e8e8",
                  whiteSpace: "nowrap", fontSize: 12, letterSpacing: "0.04em",
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((m, i) => {
              const catStyle = CATEGORY_COLORS[m.category] ?? { bg: "#f5f5f5", color: "#555" };
              return (
                <tr key={i} style={{ background: i % 2 === 0 ? "#fff" : "#fafafa" }}>
                  <td style={{ padding: "9px 12px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ fontWeight: 600, color: "#1a1a2e", marginBottom: 3 }}>{m.name}</div>
                    <span style={{
                      fontSize: 11, padding: "2px 7px", borderRadius: 20,
                      background: catStyle.bg, color: catStyle.color, fontWeight: 600,
                      textTransform: "capitalize",
                    }}>
                      {m.category?.replace("_", " ")}
                    </span>
                  </td>
                  <td style={{ padding: "9px 12px", color: "#555", borderBottom: "1px solid #f0f0f0" }}>{m.supplier}</td>
                  <td style={{ padding: "9px 12px", fontFamily: "monospace", fontSize: 12, color: "#666", borderBottom: "1px solid #f0f0f0" }}>{m.catalog_ref}</td>
                  <td style={{ padding: "9px 12px", color: "#444", borderBottom: "1px solid #f0f0f0" }}>{m.quantity}</td>
                  <td style={{ padding: "9px 12px", color: "#444", borderBottom: "1px solid #f0f0f0" }}>{fmt(m.unit_cost)}</td>
                  <td style={{ padding: "9px 12px", fontWeight: 700, color: "#1a1a2e", borderBottom: "1px solid #f0f0f0" }}>{fmt(m.total_cost)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0f4ff" }}>
              <td colSpan={5} style={{ padding: "10px 12px", fontWeight: 700, fontSize: 13, color: "#3b5bdb" }}>
                Grand Total (shown items)
              </td>
              <td style={{ padding: "10px 12px", fontWeight: 800, fontSize: 15, color: "#3b5bdb" }}>
                {fmt(total)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
