"use client";

export default function GlobalError({ error, reset }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif", background: "#FFFBEB" }}>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
          }}
        >
          <div style={{ maxWidth: "420px", textAlign: "center" }}>
            <img
              src="/favicon.ico"
              alt="OKMADE"
              style={{ width: 64, height: 64, margin: "0 auto 16px", display: "block" }}
            />
            <h1 style={{ fontSize: 24, fontWeight: "bold", color: "#78350F", margin: "0 0 8px" }}>
              OKMADE is having trouble
            </h1>
            <p style={{ color: "#6B7280", marginBottom: 24 }}>
              We hit a critical error. Please reload the page.
            </p>
            <button
              onClick={() => reset()}
              style={{
                background: "#D97706",
                color: "#fff",
                border: "none",
                padding: "12px 28px",
                borderRadius: 999,
                fontWeight: "bold",
                fontSize: 15,
                cursor: "pointer",
              }}
            >
              Reload
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
