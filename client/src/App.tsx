import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MobileNav } from "@/components/mobile-nav";
import LoadingPage from "@/pages/loading";
import WelcomePage from "@/pages/welcome";
import RoleSelectionPage from "@/pages/role-selection";
import FaceRegistrationPage from "@/pages/face-registration";
import CompanyCodePage from "@/pages/company-code";
import CompanyLoginPage from "@/pages/company-login";
import CompanyRegisterPage from "@/pages/company-register";
import SuccessPage from "@/pages/success";
import UserDashboard from "@/pages/user-dashboard";
import AdminDashboard from "@/pages/admin-dashboard";
import NotFound from "@/pages/not-found";
import { getCurrentUser } from "@/lib/auth";

function Router() {
  const currentUser = getCurrentUser();
  
  // Redirect to appropriate dashboard if user is logged in and registered
  if (currentUser && currentUser.isRegistered && currentUser.companyId) {
    return (
      <Switch>
        <Route path="/dashboard/user" component={UserDashboard} />
        <Route path="/dashboard/admin" component={AdminDashboard} />
        <Route path="/" component={currentUser.role === 'admin' ? AdminDashboard : UserDashboard} />
        <Route path="/welcome" component={WelcomePage} />
        <Route path="/role-selection" component={RoleSelectionPage} />
        <Route path="/face-registration" component={FaceRegistrationPage} />
        <Route path="/company-code" component={CompanyCodePage} />
        <Route path="/company-login" component={CompanyLoginPage} />
        <Route path="/company-register" component={CompanyRegisterPage} />
        <Route path="/success" component={SuccessPage} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={LoadingPage} />
      <Route path="/welcome" component={WelcomePage} />
      <Route path="/role-selection" component={RoleSelectionPage} />
      <Route path="/face-registration" component={FaceRegistrationPage} />
      <Route path="/company-code" component={CompanyCodePage} />
      <Route path="/company-login" component={CompanyLoginPage} />
      <Route path="/company-register" component={CompanyRegisterPage} />
      <Route path="/success" component={SuccessPage} />
      <Route path="/dashboard/user" component={UserDashboard} />
      <Route path="/dashboard/admin" component={AdminDashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="relative">
          <Router />
          <MobileNav />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
