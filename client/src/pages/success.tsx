import { Check, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth";

export default function SuccessPage() {
  const currentUser = getCurrentUser();

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md text-center animate-slide-up">
        <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-gentle">
          <Check className="text-3xl text-white" size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">All Set!</h2>
        <p className="text-gray-600 mb-8">
          Your account has been successfully configured. You can now start using Smart Attendance.
        </p>
        
        <div className="glassmorphic rounded-3xl p-6 border border-glass-border mb-8">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-semibold text-gray-800">Ready to use</p>
            </div>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse-soft"></div>
          </div>
          {currentUser && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="text-left">
                <p className="text-sm text-gray-600">Role</p>
                <p className="font-semibold text-gray-800 capitalize">{currentUser.role}</p>
              </div>
            </div>
          )}
        </div>

        <Button className="w-full btn-primary text-white py-4 rounded-2xl font-semibold shadow-lg">
          <Rocket className="mr-2" size={20} />
          Get Started
        </Button>
      </div>
    </div>
  );
}
