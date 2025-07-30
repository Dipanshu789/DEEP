
import React, { useState } from "react";
import { useLocation } from "wouter";
import passImg from "../../public/pass.png";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [location] = useLocation();

  // Extract token from URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get("token");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirm) {
      setMessage("Please fill in both fields.");
      return;
    }
    if (password !== confirm) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage("Password reset successful! You can now log in.");
      } else {
        setMessage(data.message || "Failed to reset password.");
      }
    } catch (err) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div style={{ padding: 32 }}><h2>Invalid or missing token.</h2></div>;
  }

  return (
    <div style={{ maxWidth: 400, margin: "64px auto", padding: 24, border: "1px solid #eee", borderRadius: 8, background: "none" }}>
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", marginBottom: 24 }}>
        <img
          src={passImg}
          alt="Reset Password"
          style={{
            width: "100%",
            maxWidth: 220,
            height: "auto",
            display: "block",
            objectFit: "contain",
            background: "none",
            border: "none",
            boxShadow: "none"
          }}
        />
      </div>
      <h2 style={{ textAlign: "center" }}>Reset Password</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", marginBottom: 8 }}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: 8, paddingRight: 44, transition: 'box-shadow 0.2s' }}
              autoComplete="new-password"
              inputMode="text"
              spellCheck={false}
            />
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowConfirm(v => !v)}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%) scale(1)",
                cursor: "pointer",
                userSelect: "none",
                fontSize: 22,
                color: showConfirm ? "#007bff" : "#888",
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                zIndex: 10,
                pointerEvents: "auto",
                transition: "color 0.2s, transform 0.2s"
              }}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ width: "100%", padding: 8, paddingRight: 44, transition: 'box-shadow 0.2s' }}
              autoComplete="new-password"
              inputMode="text"
              spellCheck={false}
            />
            <button
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowConfirm(v => !v)}
              style={{
                position: "absolute",
                right: 8,
                top: "50%",
                transform: "translateY(-50%) scale(1)",
                cursor: "pointer",
                userSelect: "none",
                fontSize: 22,
                color: showConfirm ? "#007bff" : "#888",
                background: "none",
                border: "none",
                padding: 0,
                margin: 0,
                zIndex: 10,
                pointerEvents: "auto",
                transition: "color 0.2s, transform 0.2s"
              }}
              tabIndex={-1}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} style={{ width: "100%", padding: 10 }}>
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
      {message && <div style={{ marginTop: 16, color: message.includes("success") ? "green" : "red" }}>{message}</div>}
    </div>
  );
}
