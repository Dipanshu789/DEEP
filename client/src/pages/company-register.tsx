import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { PlusCircle, ArrowLeft, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

const companyRegisterSchema = z.object({
  name: z.string().min(1, "Company name is required"),
  email: z.string().email("Please enter a valid email"),
  employeeCount: z.string().min(1, "Please select employee count"),
  companyCode: z.string().min(3, "Company code must be at least 3 characters"),
  companyPassword: z.string().min(6, "Password must be at least 6 characters"),
});

type CompanyRegisterForm = z.infer<typeof companyRegisterSchema>;

export default function CompanyRegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const form = useForm<CompanyRegisterForm>({
    resolver: zodResolver(companyRegisterSchema),
    defaultValues: {
      name: "",
      email: "",
      employeeCount: "",
      companyCode: "",
      companyPassword: "",
    },
  });

  // Generate company code
  const { data: generatedCode } = useQuery({
    queryKey: ["/api/company/generate-code"],
    enabled: false,
  });

  const generateCodeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/company/generate-code");
      return response.json();
    },
    onSuccess: (data) => {
      form.setValue("companyCode", data.code);
    },
  });

  const companyRegisterMutation = useMutation({
    mutationFn: async (data: CompanyRegisterForm) => {
      if (!currentUser?.id) throw new Error("User not found");
      const response = await apiRequest("POST", "/api/company/register", {
        ...data,
        adminId: currentUser.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Company registered!",
        description: "Your company has been successfully registered",
      });
      setLocation("/company-login");
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyRegisterForm) => {
    companyRegisterMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 flex flex-col p-6 overflow-y-auto">
      <div className="w-full max-w-md mx-auto my-auto animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <PlusCircle className="text-2xl text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Register Company</h2>
          <p className="text-gray-600">Create your company's attendance system</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Company Name</Label>
            <Input
              type="text"
              placeholder="Enter company name"
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
              {...form.register("name")}
            />
            {form.formState.errors.name && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Company Email</Label>
            <Input
              type="email"
              placeholder="company@example.com"
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
              {...form.register("email")}
            />
            {form.formState.errors.email && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Number of Employees</Label>
            <Select onValueChange={(value) => form.setValue("employeeCount", value)}>
              <SelectTrigger className="w-full bg-transparent border-none outline-none text-gray-800">
                <SelectValue placeholder="Select employee count" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-10">1-10</SelectItem>
                <SelectItem value="11-50">11-50</SelectItem>
                <SelectItem value="51-100">51-100</SelectItem>
                <SelectItem value="100+">100+</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.employeeCount && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.employeeCount.message}</p>
            )}
          </div>

          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Create Company Code</Label>
            <div className="flex items-center">
              <Input
                type="text"
                placeholder="Create unique code"
                className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                {...form.register("companyCode")}
              />
              <Button
                type="button"
                variant="link"
                onClick={() => generateCodeMutation.mutate()}
                disabled={generateCodeMutation.isPending}
                className="text-primary text-sm ml-2 hover:underline"
              >
                {generateCodeMutation.isPending ? "..." : "Generate"}
              </Button>
            </div>
            {form.formState.errors.companyCode && (
              <p className="text-red-500 text-xs mt-1">{form.formState.errors.companyCode.message}</p>
            )}
          </div>

          <div className="neumorphic-inset rounded-2xl p-4">
            <Label className="text-sm text-gray-600 mb-2 block">Create Company Password</Label>
            <div className="flex items-center">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Create secure password"
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
            disabled={companyRegisterMutation.isPending}
            className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg"
          >
            {companyRegisterMutation.isPending ? "Registering..." : "Register Company"}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/company-login")}
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="mr-2" size={16} />
            Back to login
          </Button>
        </div>
      </div>
    </div>
  );
}
