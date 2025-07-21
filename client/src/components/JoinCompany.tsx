import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";


interface JoinCompanyProps {
  userId: string | null;
  onComplete: () => void;
  onBack: () => void;
}


export default function JoinCompany({ userId, onComplete, onBack }: JoinCompanyProps) {
  const [companyCode, setCompanyCode] = useState("");
  const { toast } = useToast();

  const joinCompanyMutation = useMutation({
    mutationFn: async (code: string) => {
      if (!userId) throw new Error("User ID is missing. Please sign up first.");
      return apiRequest("POST", "/api/company/join", {
        userId,
        companyCode: code.toUpperCase(),
      });
    },
    onSuccess: async (data: any) => {
      // Accept both string and uppercase/lowercase for companyCode, fallback to success if company exists
      if (
        (data?.user && (data.user.companyCode || data.user.companycode)) ||
        data?.company
      ) {
        // Force fetch user profile again to ensure latest companyCode is present
        try {
          const res = await fetch("/api/auth/user", { credentials: "include" });
          if (res.ok) {
            await res.json(); // Optionally update state if needed
          }
        } catch (e) { /* ignore */ }
        toast({
          title: "Success",
          description: "Successfully joined company!",
        });
        if (window && window.location) {
          window.location.reload();
        } else {
          onComplete();
        }
      } else {
        // Fallback: try a delayed reload in case of slow DB propagation
        toast({
          title: "Success",
          description: "Successfully joined company! (Profile update may take a moment)",
        });
        setTimeout(() => {
          if (window && window.location) {
            window.location.reload();
          } else {
            onComplete();
          }
        }, 1200);
      }
    },
    onError: (error: any) => {
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
        description: error?.message || "Failed to join company. Please check the code and try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a company code.",
        variant: "destructive",
      });
      return;
    }
    // Await the mutation to ensure completion before proceeding
    await joinCompanyMutation.mutateAsync(companyCode.trim());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full fade-in">
        <Card className="shadow-lg">
          <CardContent className="p-6">
            <div className="text-center mb-6">
              <Users className="mx-auto text-4xl text-primary mb-4 h-12 w-12" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Your Company</h2>
              <p className="text-gray-600">Enter your company code to get started</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="floating-label">
                <input
                  type="text"
                  placeholder=" "
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent uppercase"
                  maxLength={10}
                />
                <label className="text-gray-500">Company Code</label>
              </div>
              
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">Don't have a company code?</p>
                <p className="text-xs text-gray-500">
                  Contact your HR department or administrator to get your unique company access code.
                </p>
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
                  disabled={joinCompanyMutation.isPending}
                  className="flex-1 btn-primary"
                >
                  {joinCompanyMutation.isPending ? "Joining..." : "Join Company"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
