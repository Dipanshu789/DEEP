import React from "react";
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

  // Debug: log user object after login
  React.useEffect(() => {
    // Removed logging of sensitive user object for privacy
  }, [user]);

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
