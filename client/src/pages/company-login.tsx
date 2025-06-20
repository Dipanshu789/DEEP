import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Shield, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, updateCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

const companyLoginSchema = z.object({
  companyCode: z.string().min(1, "Company code is required"),
  companyPassword: z.string().min(1, "Company password is required"),
});

type CompanyLoginForm = z.infer<typeof companyLoginSchema>;

export default function CompanyLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const form = useForm<CompanyLoginForm>({
    resolver: zodResolver(companyLoginSchema),
    defaultValues: { companyCode: "", companyPassword: "" },
  });

  const companyLoginMutation = useMutation({
    mutationFn: async (data: CompanyLoginForm) => {
      const response = await apiRequest("POST", "/api/company/login", data);
      return response.json();
    },
    onSuccess: (company) => {
      if (currentUser) {
        updateCurrentUser({ ...currentUser, companyId: company.id });
      }
      toast({
        title: "Success!",
        description: `Logged into ${company.name}`,
      });
      setLocation("/success");
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyLoginForm) => {
    companyLoginMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Shield className="text-2xl text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Company Login</h2>
          <p className="text-gray-600">Access your company's attendance system</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Company Code</Label>
            <Input
              type="text"
              placeholder="Enter company code"
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
              {...form.register("companyCode")}
            />
            {form.formState.errors.companyCode && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyCode.message}</p>
            )}
          </div>
          
          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Company Password</Label>
            <div className="flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Enter company password"
                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                {...form.register("companyPassword")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {form.formState.errors.companyPassword && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyPassword.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={companyLoginMutation.isPending}
            className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg"
          >
            {companyLoginMutation.isPending ? "Logging in..." : "Login to Company"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="link"
              onClick={() => setLocation("/company-register")}
              className="text-primary text-sm hover:underline"
            >
              New Admin? Register Company
            </Button>
          </div>
        </form>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/face-registration")}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back
          </Button>
        </div>
      </div>
    </div>
  );
}
