import React, { useState, useEffect, useRef } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BottomNavigation } from "@/components/ui/bottom-navigation";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import Attendance from "@/pages/Attendance";
import Team from "@/pages/Team";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/not-found";
import AdminDashboard from "@/pages/AdminDashboard";
import UserDashboard from "@/pages/UserDashboard";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Message from "@/pages/Message";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [location, setLocation] = useLocation();
  const userRole = (user as any)?.role;

  // State for draggable message icon position
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: window.innerHeight - 96, left: window.innerWidth - 96 });
  const draggingRef = useRef(false);
  const offsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const iconRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    // Update position on window resize to keep icon inside viewport
    function handleResize() {
      setPosition(pos => {
        const maxLeft = window.innerWidth - 64;
        const maxTop = window.innerHeight - 64;
        return {
          left: Math.min(pos.left, maxLeft),
          top: Math.min(pos.top, maxTop),
        };
      });
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function handleMouseMove(e: MouseEvent) {
      if (!draggingRef.current) return;
      e.preventDefault();
      const newLeft = e.clientX - offsetRef.current.x;
      const newTop = e.clientY - offsetRef.current.y;
      const maxLeft = window.innerWidth - 64;
      const maxTop = window.innerHeight - 64;
      setPosition({
        left: Math.min(Math.max(0, newLeft), maxLeft),
        top: Math.min(Math.max(0, newTop), maxTop),
      });
    }

    function handleMouseUp() {
      draggingRef.current = false;
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  // Touch event handlers for mobile dragging
  useEffect(() => {
    function handleTouchMove(e: TouchEvent) {
      if (!draggingRef.current) return;
      e.preventDefault();
      const touch = e.touches[0];
      const newLeft = touch.clientX - offsetRef.current.x;
      const newTop = touch.clientY - offsetRef.current.y;
      const maxLeft = window.innerWidth - 64;
      const maxTop = window.innerHeight - 64;
      setPosition({
        left: Math.min(Math.max(0, newLeft), maxLeft),
        top: Math.min(Math.max(0, newTop), maxTop),
      });
    }

    function handleTouchEnd() {
      draggingRef.current = false;
    }

    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    window.addEventListener("touchcancel", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
    };
  }, []);

  function handleMouseDown(e: React.MouseEvent<HTMLAnchorElement>) {
    if (!iconRef.current) return;
    draggingRef.current = true;
    const rect = iconRef.current.getBoundingClientRect();
    offsetRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  }
  function handleTouchStart(e: React.TouchEvent<HTMLAnchorElement>) {
    if (!iconRef.current) return;
    draggingRef.current = true;
    const rect = iconRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    offsetRef.current = {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  // Onboarding: Only show for first-time users
  React.useEffect(() => {
    const seen = localStorage.getItem("hasSeenOnboarding");
    if (!isLoading && !isAuthenticated && !seen && (location === "/" || location === "/landing")) {
      setLocation("/onboarding", { replace: true });
    }
    if (!isLoading && isAuthenticated && user) {
      if (location === "/" || location === "/landing" || location === "/onboarding") {
        if (userRole === "admin") {
          setLocation("/admin-dashboard", { replace: true });
        } else {
          setLocation("/user-dashboard", { replace: true });
        }
      }
    }
  }, [isLoading, isAuthenticated, user, userRole, location, setLocation]);

  // Fix: Use static import for Onboarding page to avoid require error
  const Onboarding = React.lazy(() => import("@/pages/Onboarding"));

  return (
    <div className="relative">
      <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Switch>
          <Route path="/onboarding" component={Onboarding} />
          {isLoading || !isAuthenticated ? (
            <Route path="/" component={Landing} />
          ) : (
            <>
              <Route path="/" component={Home} />
              <Route path="/attendance" component={Attendance} />
              <Route path="/team" component={Team} />
              <Route path="/profile" component={Profile} />
              <Route path="/settings" component={Settings} />
              <Route path="/privacy-policy" component={PrivacyPolicy} />
              <Route path="/admin-dashboard" component={AdminDashboard} />
              <Route path="/user-dashboard" component={UserDashboard} />
              <Route path="/message" component={Message} />
            </>
          )}
          <Route component={NotFound} />
        </Switch>
      </React.Suspense>
      {/* Show bottom navigation only for authenticated users */}
      {!isLoading && isAuthenticated && <BottomNavigation />}
      {/* Floating Message Icon Button - draggable */}
      {!isLoading && isAuthenticated && (
        <a
          href="/message"
          ref={iconRef}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          className="fixed z-50 flex items-center justify-center w-16 h-16 rounded-full bg-[#e3e6ee] shadow-lg hover:bg-[#d1d5db] transition-all"
          style={{
            boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
            top: position.top,
            left: position.left,
            cursor: 'grab',
          }}
          aria-label="Messages"
        >
          {/* Message Icon (msg.png) */}
          <img src="/msg.png" alt="Messages" className="w-full h-full object-cover" />
        </a>
      )}
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
