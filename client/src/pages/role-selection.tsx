import { useLocation } from "wouter";
import { User, Settings, ArrowLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getCurrentUser, updateCurrentUser } from "@/lib/auth";

export default function RoleSelectionPage() {
  const [, setLocation] = useLocation();
  const currentUser = getCurrentUser();

  const selectRole = (role: "user" | "admin") => {
    if (currentUser) {
      updateCurrentUser({ ...currentUser, role });
    }
    setLocation("/face-registration");
  };

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md animate-slide-up">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Choose Your Role</h2>
          <p className="text-gray-600">Select how you'll be using Smart Attendance</p>
        </div>

        <div className="space-y-4">
          {/* User Role Card */}
          <div 
            className="glassmorphic rounded-3xl p-6 border border-glass-border hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => selectRole("user")}
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center">
                <User className="text-2xl text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">I am a User</h3>
                <p className="text-gray-600 text-sm">Mark attendance and view records</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </div>

          {/* Admin Role Card */}
          <div 
            className="glassmorphic rounded-3xl p-6 border border-glass-border hover:shadow-xl transition-all duration-300 cursor-pointer"
            onClick={() => selectRole("admin")}
          >
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center">
                <Settings className="text-2xl text-white" size={24} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">I am an Admin</h3>
                <p className="text-gray-600 text-sm">Manage company and employees</p>
              </div>
              <ChevronRight className="text-gray-400" size={20} />
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Button
            variant="ghost"
            onClick={() => setLocation("/welcome")}
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
