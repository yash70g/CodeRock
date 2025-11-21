import React from "react";

export default function LandingPageCard({ title, content, btntext, btnlink }) {
  return (
    <div className="col-12 col-md-6 mx-auto">
      <div
        className="card text-white shadow-lg border-0"
        style={{
          background: "linear-gradient(to bottom, rgba(15,23,42,0.9), rgba(15,23,42,0.6))",
          borderRadius: "20px",
        }}
      >
        <div className="card-body p-4">

          <h5 className="card-title mb-3" style={{ fontWeight: "600" }}>
            {title}
          </h5>

          <p className="card-text text-light" style={{ opacity: 0.85 }}>
            {content}
          </p>

          <a
            href={btnlink}
            className="btn btn-success w-100 mt-3 py-2"
            style={{
              fontWeight: "600",
              borderRadius: "12px",
            }}
          >
            {btntext}
          </a>

        </div>
      </div>
    </div>
  );
}
