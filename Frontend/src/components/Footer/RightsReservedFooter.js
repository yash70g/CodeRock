import React from "react";

export default function RightsReservedFooter() {
  return (
    <footer
      className="w-100 py-3 mt-5 border-top"
      style={{
        background: "linear-gradient(to bottom, #0f172a, #0f172acc)",
        color: "#cbd5e1",
        borderColor: "#1e293b",
      }}
    >
      <div className="text-center" style={{ fontSize: "14px", letterSpacing: "0.5px" }}>
        © 2025 <span style={{ fontWeight: 600, color: "white" }}>CodeRock</span>. All rights reserved.
      </div>
    </footer>
  );
}
