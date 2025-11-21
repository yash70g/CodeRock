import React from "react";

export default function RightsReservedFooter() {
  return (
    <>
      {/* Inline CSS (no external file) */}
      <style>{`
        .cr-footer {
          width: 100%;
          padding: 22px 0;
          margin-top: 80px;
          background: rgba(0, 0, 0, 0.35);
          backdrop-filter: blur(14px);
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 -4px 18px rgba(0,0,0,0.35);
          text-align: center;
          color: #cbd5e1;
          font-size: 14px;
          letter-spacing: 0.6px;
          position: relative;
        }

        .cr-footer-accent {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 560px;
          height: 5px;
          background: linear-gradient(90deg, transparent, #22c55e, transparent);
          opacity: 0.8;
        }

        .cr-footer span {
          font-weight: 600;
          color: #fff;
        }

        .cr-footer:hover .cr-footer-accent {
          opacity: 1;
          filter: drop-shadow(0 0 6px #22c55e);
          transition: 0.3s ease;
        }
      `}</style>

      <footer className="cr-footer">
        <div className="cr-footer-accent"></div>

        © 2025 <span>CodeRoom</span>. All rights reserved.
      </footer>
    </>
  );
}
