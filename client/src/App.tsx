import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import LoadingPage from "@/pages/loading";
import WelcomePage from "@/pages/welcome";
import RoleSelectionPage from "@/pages/role-selection";
import FaceRegistrationPage from "@/pages/face-registration";
import CompanyCodePage from "@/pages/company-code";
import CompanyLoginPage from "@/pages/company-login";
import CompanyRegisterPage from "@/pages/company-register";
import SuccessPage from "@/pages/success";
import NotFound from "@/pages/not-found";

function Router() {
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
      <Route component={NotFound} />
    </Switch>
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
