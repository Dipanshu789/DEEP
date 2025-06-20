import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { z } from "zod";
import { Building, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { getCurrentUser, updateCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

const companyCodeSchema = z.object({
  companyCode: z.string().min(1, "Company code is required").toUpperCase(),
});

type CompanyCodeForm = z.infer<typeof companyCodeSchema>;

export default function CompanyCodePage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const currentUser = getCurrentUser();

  const form = useForm<CompanyCodeForm>({
    resolver: zodResolver(companyCodeSchema),
    defaultValues: { companyCode: "" },
  });

  const joinCompanyMutation = useMutation({
    mutationFn: async (data: CompanyCodeForm) => {
      if (!currentUser?.id) throw new Error("User not found");
      const response = await apiRequest("POST", `/api/company/join?userId=${currentUser.id}`, data);
      return response.json();
    },
    onSuccess: (data) => {
      if (currentUser) {
        updateCurrentUser({ ...currentUser, companyId: data.company.id });
      }
      toast({
        title: "Success!",
        description: `Successfully joined ${data.company.name}`,
      });
      setLocation("/success");
    },
    onError: (error) => {
      toast({
        title: "Failed to join company",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: CompanyCodeForm) => {
    joinCompanyMutation.mutate(data);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <Building className="text-2xl text-white" size={24} />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Join Your Company</h2>
          <p className="text-gray-600">Enter the company code provided by your admin</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="neumorphic-inset rounded-2xl p-6">
            <Label className="text-sm text-gray-600 mb-3 block">Company Code</Label>
            <Input
              type="text"
              placeholder="Enter company code"
              className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400 text-lg tracking-widest text-center uppercase"
              style={{ letterSpacing: "0.2em" }}
              {...form.register("companyCode")}
            />
            {form.formState.errors.companyCode && (
              <p className="text-red-500 text-xs mt-2">{form.formState.errors.companyCode.message}</p>
            )}
          </div>

          <Button
            type="submit"
            disabled={joinCompanyMutation.isPending}
            className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg"
          >
            {joinCompanyMutation.isPending ? "Joining Company..." : "Join Company"}
          </Button>

          <div className="text-center">
            <p className="text-gray-500 text-sm">Don't have a company code?</p>
            <Button variant="link" className="text-primary text-sm hover:underline p-0">
              Contact your admin
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
