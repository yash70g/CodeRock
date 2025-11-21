import React from "react";

export default function PlainNavbar() {
  return (
    <>
      <style>{`
        .cr-nav {
          position: sticky;
          top: 0;
          z-index: 9999;
          backdrop-filter: blur(14px);
          background: rgba(0, 0, 0, 0.35);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.35);
        }

        .cr-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cr-logo-box {
          width: 90px;
          height: 42px;
          border-radius: 10px;
          background: linear-gradient(135deg, #009dffff, #4ade80);
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: monospace;
          color: #000;
          font-weight: 900;
          font-size: 18px;
          box-shadow: 0 0 18px rgba(65, 176, 255, 0.5);
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .cr-logo-box:hover {
          transform: scale(1.08);
          box-shadow: 0 0 26px rgba(71, 108, 255, 0.75);
        }

        .cr-title {
          color: #e5e7eb;
          font-size: 20px;
          font-weight: 600;
          letter-spacing: 0.4px;
          transition: opacity 0.3s ease;
        }

        .cr-title:hover {
          opacity: 0.85;
        }

        .cr-shadow-layer {
          position: absolute;
          inset: 0;
          z-index: -1;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            rgba(91, 83, 249, 0.06),  
            rgba(0,0,0,0.0),
            rgba(58, 164, 245, 0.06)
          );
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .cr-nav:hover .cr-shadow-layer {
          opacity: 1;
        }
      `}</style>

      {/* Navbar */}
      <header className="cr-nav">
        <div className="cr-shadow-layer"></div>

        <div className="cr-container">
          <a href="/" style={{ textDecoration: "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "30px" }}>
              <div className="cr-logo-box">CodeRoom</div>
              {/* <span className="cr-title">CodeRoom</span> */}
              <span className="cr-title">Home</span>
            </div>
          </a>
        </div>
      </header>
    </>
  );
}
