import { useState, useEffect } from "react";
import WelcomeIllustration from "./assets/welcome-illustration.png";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SplashScreen from "@/components/SplashScreen";
import FaceCaptureModal from "@/components/FaceCaptureModal";
import CompanyRegistration from "@/components/CompanyRegistration";
import GeofenceSetup from "@/components/GeofenceSetup";
import JoinCompany from "@/components/JoinCompany";
import { Clock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

type LandingStep = "splash" | "welcome" | "face-capture" | "company-registration" | "geofence-setup" | "join-company";
type UserRole = "admin" | "user" | null;

export default function Landing() {
  const [currentStep, setCurrentStep] = useState<LandingStep>("splash");
  const [activeTab, setActiveTab] = useState<"login" | "signup">("login");
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "admin" | "user"
  });
  const [createdUserId, setCreatedUserId] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);
  const [, setLocation] = useLocation();
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);

  // On mount, check if already logged in and redirect
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/user", { credentials: "include" });
        if (res.ok) {
          const user = await res.json();
          if (user.role === "admin") setLocation("/admin-dashboard");
          else if (user.role === "user") setLocation("/user-dashboard");
        }
      } catch {}
    }
    checkUser();
  }, [setLocation]);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      // Always use relative URL for proxy and session support
      await apiRequest("POST", "/api/login", {
        email: loginEmail,
        password: loginPassword,
      });
      // Fetch user and redirect based on role
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.ok) {
        const user = await res.json();
        if (user.role === "admin") setLocation("/admin-dashboard");
        else if (user.role === "user") setLocation("/user-dashboard");
        else window.location.reload();
      } else {
        window.location.reload();
      }
    } catch (err: any) {
      let msg = err.message || "Login failed";
      try {
        const match = msg.match(/\{.*\}/);
        if (match) {
          const json = JSON.parse(match[0]);
          if (json.message) msg = json.message;
        }
      } catch {}
      setLoginError(msg);
    }
  };

  const handleSignupSubmit = async () => {
    setUserRole(userData.role);
    setSignupError(null);
    try {
      // Call backend to create user
      const res = await apiRequest("POST", "/api/user/signup", {
        email: userData.email,
        fullName: userData.name,
        password: userData.password, // <-- send as password (not passwordHash)
        role: userData.role,
      });
      const user = await res.json();
      // Use userId from backend if present, else fallback to id
      setCreatedUserId(user.userId || user.id);
      setCurrentStep("face-capture");
    } catch (err: any) {
      setSignupError(err.message || "Signup failed");
    }
  };

  const handleFaceCapture = () => {
    if (userRole === "admin") {
      setCurrentStep("company-registration");
    } else {
      setCurrentStep("join-company");
    }
  };

  if (currentStep === "splash") {
    return <SplashScreen onComplete={() => setCurrentStep("welcome")} />;
  }

  if (currentStep === "face-capture") {
    if (!createdUserId) {
      // Defensive: should not happen, but fallback
      return <div className="p-8 text-center">User not created. Please try signing up again.</div>;
    }
    return (
      <FaceCaptureModal
        userData={userData}
        userId={createdUserId}
        onComplete={handleFaceCapture}
        onCancel={() => setCurrentStep("welcome")}
      />
    );
  }

  if (currentStep === "company-registration") {
    return (
      <CompanyRegistration
        onComplete={() => setCurrentStep("geofence-setup")}
        onBack={() => setCurrentStep("welcome")}
      />
    );
  }

  if (currentStep === "geofence-setup") {
    return (
      <GeofenceSetup
        onComplete={() => window.location.reload()}
        onBack={() => setCurrentStep("company-registration")}
      />
    );
  }

  if (currentStep === "join-company") {
    return (
      <JoinCompany
        userId={createdUserId}
        onComplete={() => window.location.reload()}
        onBack={() => setCurrentStep("welcome")}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-2 bg-gray-50">
      <div className="max-w-2xl w-full fade-in flex flex-col md:flex-row items-center justify-center gap-6 md:gap-8">
        {/* Illustration */}
        <div className="w-full md:w-auto md:flex-1 flex justify-center mb-6 md:mb-0">
          <img
            src={WelcomeIllustration}
            alt="Welcome Illustration"
            className="w-4/5 max-w-xs md:w-full mx-auto object-contain"
            style={{ background: 'none', borderRadius: 0, boxShadow: 'none' }}
          />
        </div>
        {/* Main Card */}
        <div className="flex-1 w-full max-w-md mx-auto">
          {/* Logo Header */}
          <div className="text-center mb-8">
            <Clock className="mx-auto text-5xl text-primary mb-4 h-12 w-12" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Management</h1>
            <p className="text-gray-600">Secure Management</p>
          </div>

          {/* Tab Navigation */}
          <Card className="shadow-lg">
            <CardContent className="p-4 md:p-6">
              <div className="flex mb-6 bg-gray-100 rounded-lg p-1 flex-col xs:flex-row md:flex-row gap-2 md:gap-0">
                <button
                  onClick={() => setActiveTab("login")}
                  className={`flex-1 py-2 px-4 rounded-md text-center font-medium transition-all ${
                    activeTab === "login"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveTab("signup")}
                  className={`flex-1 py-2 px-4 rounded-md text-center font-medium transition-all ${
                    activeTab === "signup"
                      ? "bg-white text-primary shadow-sm"
                      : "text-gray-600 hover:text-gray-800"
                  }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Login Form */}
              {activeTab === "login" && (
                <div className="space-y-4">
                  <div className="floating-label">
                    <input
                      type="email"
                      placeholder=" "
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <label className="text-gray-500">Email Address</label>
                  </div>
                  <div className="floating-label">
                    <input
                      type="password"
                      placeholder=" "
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <label className="text-gray-500">Password</label>
                  </div>
                  {loginError && <div className="text-red-500 text-center mb-2">{loginError}</div>}
                  <Button
                    onClick={handleLogin}
                    className="w-full btn-primary py-3 font-medium"
                  >
                    Login
                  </Button>
                </div>
              )}

              {/* Signup Form */}
              {activeTab === "signup" && (
                <div className="space-y-4">
                  <div className="floating-label">
                    <input
                      type="text"
                      placeholder=" "
                      value={userData.name}
                      onChange={(e) => setUserData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <label className="text-gray-500">Full Name</label>
                  </div>
                  <div className="floating-label">
                    <input
                      type="email"
                      placeholder=" "
                      value={userData.email}
                      onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <label className="text-gray-500">Email Address</label>
                  </div>
                  <div className="floating-label">
                    <input
                      type="password"
                      placeholder=" "
                      value={userData.password}
                      onChange={(e) => setUserData(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                    <label className="text-gray-500">Password</label>
                  </div>

                  {/* Role Selection */}
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Account Type</label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="role"
                          value="user"
                          checked={userData.role === "user"}
                          onChange={(e) => setUserData(prev => ({ ...prev, role: e.target.value as "admin" | "user" }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-gray-700">Employee</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="role"
                          value="admin"
                          checked={userData.role === "admin"}
                          onChange={(e) => setUserData(prev => ({ ...prev, role: e.target.value as "admin" | "user" }))}
                          className="text-primary focus:ring-primary"
                        />
                        <span className="ml-2 text-gray-700">Admin</span>
                      </label>
                    </div>
                  </div>

                  {/* Show signup error if any */}
                  {signupError && <div className="text-red-500 text-center mb-2">{signupError}</div>}

                  <Button
                    onClick={handleSignupSubmit}
                    className="w-full btn-secondary py-3 font-medium"
                  >
                    Proceed to Face Registration
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
