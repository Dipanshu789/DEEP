import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { Shield, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { setCurrentUser } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

const signupSchema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  role: z.enum(["user", "admin"]),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginForm = z.infer<typeof loginSchema>;
type SignupForm = z.infer<typeof signupSchema>;

export default function WelcomePage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "", role: "user" },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginForm) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      toast({
        title: "Welcome back!",
        description: "Login successful",
      });
      setLocation("/role-selection");
    },
    onError: (error) => {
      toast({
        title: "Login failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const signupMutation = useMutation({
    mutationFn: async (data: Omit<SignupForm, "confirmPassword">) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (user) => {
      setCurrentUser(user);
      toast({
        title: "Account created!",
        description: "Registration successful",
      });
      setLocation("/role-selection");
    },
    onError: (error) => {
      toast({
        title: "Registration failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginForm) => {
    loginMutation.mutate(data);
  };

  const onSignupSubmit = (data: SignupForm) => {
    const { confirmPassword, ...signupData } = data;
    signupMutation.mutate(signupData);
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-fade-in">
        {/* Logo Section */}
        <div className="text-center mb-12">
          <div className="w-24 h-24 bg-gradient-to-br from-primary to-blue-600 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
            <Shield className="text-3xl text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome Back</h1>
          <p className="text-gray-600">Secure attendance tracking for modern teams</p>
        </div>

        {/* Auth Toggle */}
        <div className="glassmorphic rounded-2xl p-1 mb-6">
          <div className="flex relative">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 text-center rounded-xl transition-all duration-300 relative z-10 ${
                isLogin ? "text-primary font-semibold" : "text-gray-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 text-center rounded-xl transition-all duration-300 relative z-10 ${
                !isLogin ? "text-primary font-semibold" : "text-gray-600"
              }`}
            >
              Sign Up
            </button>
            <div 
              className={`absolute top-1 left-1 w-1/2 h-10 bg-white rounded-xl shadow-lg transition-all duration-300 ${
                !isLogin ? "transform translate-x-full" : ""
              }`}
            />
          </div>
        </div>

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
            <div className="neumorphic-inset rounded-2xl p-4">
              <Label className="text-sm text-gray-600 mb-2 block">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                {...loginForm.register("email")}
              />
              {loginForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="neumorphic-inset rounded-2xl p-4">
              <Label className="text-sm text-gray-600 mb-2 block">Password</Label>
              <div className="flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                  {...loginForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {loginForm.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">{loginForm.formState.errors.password.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg"
            >
              {loginMutation.isPending ? "Signing In..." : "Sign In"}
            </Button>

            <div className="text-center">
              <button type="button" className="text-primary text-sm hover:underline">
                Forgot password?
              </button>
            </div>
          </form>
        ) : (
          /* Signup Form */
          <form onSubmit={signupForm.handleSubmit(onSignupSubmit)} className="space-y-4">
            <div className="neumorphic-inset rounded-2xl p-4">
              <Label className="text-sm text-gray-600 mb-2 block">Email Address</Label>
              <Input
                type="email"
                placeholder="Enter your email"
                className="w-full bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                {...signupForm.register("email")}
              />
              {signupForm.formState.errors.email && (
                <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.email.message}</p>
              )}
            </div>
            
            <div className="neumorphic-inset rounded-2xl p-4">
              <Label className="text-sm text-gray-600 mb-2 block">Password</Label>
              <div className="flex items-center">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                  {...signupForm.register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {signupForm.formState.errors.password && (
                <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.password.message}</p>
              )}
            </div>

            <div className="neumorphic-inset rounded-2xl p-4">
              <Label className="text-sm text-gray-600 mb-2 block">Confirm Password</Label>
              <div className="flex items-center">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="flex-1 bg-transparent border-none outline-none text-gray-800 placeholder-gray-400"
                  {...signupForm.register("confirmPassword")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="text-gray-400 hover:text-gray-600 transition-colors ml-2"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {signupForm.formState.errors.confirmPassword && (
                <p className="text-red-500 text-xs mt-1">{signupForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={signupMutation.isPending}
              className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg"
            >
              {signupMutation.isPending ? "Creating Account..." : "Create Account"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
