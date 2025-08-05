import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import passImg from "../../public/pass.png";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      {message && <div style={{ color: "red", marginBottom: 12, textAlign: "center" }}>{message}</div>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: "relative", marginBottom: 16 }}>
            <input
              ref={useRef(null)}
              type={showPassword ? "text" : "password"}
              placeholder="New password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: "100%", padding: "12px 40px 12px 12px", fontSize: "16px", border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              autoComplete="new-password"
              inputMode="text"
            />
            <button
              type="button"
              onTouchStart={e => e.preventDefault()}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: 18,
                color: "#666",
                background: "none",
                border: "none",
                padding: 4,
                zIndex: 2
              }}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
          <div style={{ position: "relative" }}>
            <input
              ref={useRef(null)}
              type={showConfirm ? "text" : "password"}
              placeholder="Confirm password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              style={{ width: "100%", padding: "12px 40px 12px 12px", fontSize: "16px", border: "1px solid #ddd", borderRadius: 4, boxSizing: "border-box" }}
              autoComplete="new-password"
              inputMode="text"
            />
            <button
              type="button"
              onTouchStart={e => e.preventDefault()}
              onMouseDown={e => e.preventDefault()}
              onClick={() => setShowConfirm(!showConfirm)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                cursor: "pointer",
                fontSize: 18,
                color: "#666",
                background: "none",
                border: "none",
                padding: 4,
                zIndex: 2
              }}
              aria-label={showConfirm ? "Hide password" : "Show password"}
            >
              {showConfirm ? "👁️" : "👁️‍🗨️"}
            </button>
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            fontSize: 16,
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: loading ? "not-allowed" : "pointer",
            marginTop: 8
          }}
        >
          {loading ? "Resetting..." : "Reset Password"}
        </button>
      </form>
    </div>
  );
}
