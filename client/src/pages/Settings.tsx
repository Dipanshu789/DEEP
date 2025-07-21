import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Settings as SettingsIcon, 
  Bell, 
  MapPin, 
  Shield, 
  Moon, 
  Sun,
  Smartphone,
  Globe,
  Database
} from "lucide-react";
import { useLocation } from "wouter";

export default function Settings() {
  type User = { id?: string; [key: string]: any };
  const { user, isAuthenticated, isLoading } = useAuth() as { user: User; isAuthenticated: boolean; isLoading: boolean };
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
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
  }, [isAuthenticated, isLoading, toast]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pb-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleNotificationToggle = (enabled: boolean) => {
    if (enabled && "Notification" in window) {
      Notification.requestPermission().then(permission => {
        if (permission === "granted") {
          toast({
            title: "Notifications Enabled",
            description: "You'll receive attendance reminders and updates.",
          });
        } else {
          toast({
            title: "Notifications Denied",
            description: "Please enable notifications in your browser settings.",
            variant: "destructive",
          });
        }
      });
    }
  };

  const handleLocationToggle = (enabled: boolean) => {
    if (enabled && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          toast({
            title: "Location Access Granted",
            description: "Location services enabled for attendance tracking.",
          });
        },
        () => {
          toast({
            title: "Location Access Denied",
            description: "Please enable location services for accurate attendance.",
            variant: "destructive",
          });
        }
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your app preferences
          </p>
        </div>

        {/* Notifications */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Push Notifications</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive attendance reminders and updates
                </p>
              </div>
              <Switch 
                onCheckedChange={handleNotificationToggle}
                defaultChecked={false}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Check-in Reminders</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Daily reminders to check in
                </p>
              </div>
              <Switch defaultChecked={true} />
            </div>
          </CardContent>
        </Card>

        {/* Privacy & Security */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Location Services</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Required for geofence-based attendance
                </p>
              </div>
              <Switch 
                onCheckedChange={handleLocationToggle}
                defaultChecked={false}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Face Recognition</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Biometric authentication for secure check-ins
                </p>
              </div>
              <Switch defaultChecked={true} disabled />
            </div>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Dark Mode</Label>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between light and dark themes
                </p>
              </div>
              <Switch 
                defaultChecked={false}
                onCheckedChange={(checked) => {
                  document.documentElement.classList.toggle('dark', checked);
                  toast({
                    title: checked ? "Dark Mode Enabled" : "Light Mode Enabled",
                    description: "Theme preference updated.",
                  });
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* About */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="w-5 h-5" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Version</span>
                <span className="text-sm font-medium">1.0.0</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Build</span>
                <span className="text-sm font-medium font-mono">2025.06.27</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">User ID</span>
                <span className="text-sm font-medium font-mono">{user?.id || "Unknown"}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button 
                variant="outline" 
                className="w-full" 
                size="sm"
                onClick={() => setLocation("/privacy-policy")}
              >
                <Globe className="w-4 h-4 mr-2" />
                Privacy Policy
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
