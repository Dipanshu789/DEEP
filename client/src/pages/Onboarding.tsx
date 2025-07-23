import React, { useCallback } from "react";
import { useLocation } from "wouter";
import { onboardingData } from "./onboardingData";
import { motion, AnimatePresence } from "framer-motion";

const theme = {
  backgroundColor: "#f8e9b0",
  backgroundHighlightColor: "#f7a641",
  textColor: "#1b1b1b",
  textHighlightColor: "#f0f0f0",
};

export default function Onboarding() {
  const [screen, setScreen] = React.useState(0);
  const [, setLocation] = useLocation();

  React.useEffect(() => {
    const seen = localStorage.getItem("hasSeenOnboarding");
    if (seen) {
      setLocation("/landing", { replace: true });
    }
  }, [setLocation]);

  const handleNext = useCallback(() => {
    if (screen < onboardingData.length - 1) {
      setScreen(screen + 1);
    } else {
      localStorage.setItem("hasSeenOnboarding", "true");
      window.location.href = window.location.origin + "/landing";
    }
  }, [screen, setLocation]);

  const { image, title, text } = onboardingData[screen];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.backgroundColor,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 1rem",
      }}
    >
      <div style={{ maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: 32 }}>
        <div style={{ width: "100%", height: 256, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", position: "relative" }}>
          <AnimatePresence mode="wait">
            <motion.img
              key={screen}
              src={image}
              alt="Onboarding"
              initial={{ opacity: 0, scale: 0.85, y: 80 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.85, y: -80 }}
              transition={{ duration: 0.7, type: "spring", bounce: 0.35 }}
              style={{
                width: "80%",
                height: "80%",
                objectFit: "contain",
                borderRadius: 0,
                boxShadow: "none",
                background: "none",
                position: "absolute",
                left: "10%",
                top: 0,
              }}
            />
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={screen + "-text"}
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
            style={{ width: "100%", textAlign: "center" }}
          >
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.5, type: "spring" }}
              style={{
                color: theme.textColor,
                fontSize: 28,
                fontWeight: 700,
                marginBottom: 12,
                letterSpacing: 0.5,
              }}
            >{title}</motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, type: "spring" }}
              style={{
                color: theme.textColor,
                fontSize: 18,
                lineHeight: 1.5,
                marginBottom: 24,
                fontWeight: 500,
              }}
            >{text}</motion.p>
          </motion.div>
        </AnimatePresence>
        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ scale: 1.03 }}
          style={{
            width: "100%",
            height: 56,
            borderRadius: 100,
            background: theme.backgroundHighlightColor,
            color: theme.textHighlightColor,
            fontWeight: 700,
            fontSize: 18,
            border: "none",
            boxShadow: "0 4px 16px rgba(247,166,65,0.15)",
            cursor: "pointer",
            position: "relative",
            overflow: "hidden",
            marginBottom: 8,
            transition: "background 0.2s",
          }}
          onClick={handleNext}
        >
          {screen === onboardingData.length - 1 ? "Get Started" : (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              Next
              <svg width="24" height="24" fill="none" stroke={theme.textHighlightColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6"/>
              </svg>
            </span>
          )}
          {screen === onboardingData.length - 1 && (
            <span style={{ fontWeight: 700 }}>Get Started</span>
          )}
        </motion.button>
        <div style={{ display: "flex", gap: 16, marginTop: 8 }}>
          {onboardingData.map((_, idx) => (
            <motion.span
              key={idx}
              layout
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              style={{
                width: idx === screen ? 32 : 12,
                height: 12,
                borderRadius: 6,
                background: theme.backgroundHighlightColor,
                opacity: idx === screen ? 1 : 0.5,
                transition: "width 0.3s, opacity 0.3s",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

