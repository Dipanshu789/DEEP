import { useState } from "react";
import CompanyLocationMap from "./CompanyLocationMap";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Building } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface CompanyRegistrationProps {
  onComplete: () => void;
  onBack: () => void;
}

export default function CompanyRegistration({ onComplete, onBack }: CompanyRegistrationProps) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    employeeCount: "",
    companyCode: `COMP${Math.random().toString(36).substr(2, 5).toUpperCase()}`,
    password: "",
    location: undefined as undefined | { lat: number; lng: number },
  });
  const { toast } = useToast();

  const createCompanyMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      return apiRequest("POST", "/api/company", {
        ...data,
        employeeCount: parseInt(data.employeeCount),
        passwordHash: data.password, // Will be hashed on the server
        latitude: data.location?.lat,
        longitude: data.location?.lng,
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Company registered successfully!",
      });
      onComplete();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to register company. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.employeeCount || !formData.password) {
      toast({
        title: "Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }
    // Ensure companyCode is always sent as a string and not undefined
    createCompanyMutation.mutate({
      ...formData,
      companyCode: formData.companyCode || `COMP${Math.random().toString(36).substr(2, 5).toUpperCase()}`
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full fade-in">
        <Card className="shadow-lg">
      <CardContent className="p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Select Company Location</label>
          <CompanyLocationMap
            value={formData.location}
            onChange={coords => setFormData(f => ({ ...f, location: coords }))}
          />
        </div>
            <div className="text-center mb-6">
              <Building className="mx-auto text-4xl text-primary mb-4 h-12 w-12" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Register Your Company</h2>
              <p className="text-gray-600">Set up your organization details</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="floating-label">
                <input
                  type="text"
                  placeholder=" "
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <label className="text-gray-500">Company Name</label>
              </div>

              <div className="floating-label">
                <input
                  type="email"
                  placeholder=" "
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <label className="text-gray-500">Company Email</label>
              </div>

              <div className="floating-label">
                <input
                  type="number"
                  placeholder=" "
                  value={formData.employeeCount}
                  onChange={(e) => setFormData(prev => ({ ...prev, employeeCount: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <label className="text-gray-500">Employee Count</label>
              </div>

              <div className="floating-label">
                <input
                  type="text"
                  placeholder=" "
                  value={formData.companyCode}
                  readOnly
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-gray-50"
                />
                <label className="text-gray-500">Company Code (Auto-generated)</label>
              </div>

              <div className="floating-label">
                <input
                  type="password"
                  placeholder=" "
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <label className="text-gray-500">Company Access Password</label>
              </div>

              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onBack}
                  className="flex-1"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  disabled={createCompanyMutation.isPending}
                  className="flex-1 btn-primary"
                >
                  {createCompanyMutation.isPending ? "Creating..." : "Continue to Location Setup"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
