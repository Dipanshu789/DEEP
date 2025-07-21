import { Home, Settings, Clock, Users, UserCheck, MessageCircle } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface AuthUser {
  role?: string;
  // add other properties if needed
}

interface BottomNavItem {
  icon: React.ComponentType<any>;
  label: string;
  href: string;
  adminOnly?: boolean;
}

const navigationItems: BottomNavItem[] = [
  {
    icon: Home,
    label: "Home",
    href: "/",
  },
  {
    icon: Clock,
    label: "Attendance",
    href: "/attendance",
  },
  // Message icon inserted between Attendance and Profile
  {
    icon: MessageCircle,
    label: "Messages",
    href: "/message",
  },
  {
    icon: Users,
    label: "Team",
    href: "/team",
    adminOnly: true,
  },
  {
    icon: UserCheck,
    label: "Profile",
    href: "/profile",
  },
  {
    icon: Settings,
    label: "Settings",
    href: "/settings",
  },
];

export function BottomNavigation() {
  const [location] = useLocation();
  const { user } = useAuth() as { user?: AuthUser };

  const filteredItems = navigationItems.filter(item => 
    !item.adminOnly || (user?.role === "admin")
  );

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 safe-area-pb z-50">
      <div className="flex justify-around items-center py-2 px-4 max-w-md mx-auto">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;
          
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div className={cn(
                "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-colors",
                isActive 
                  ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20" 
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}>
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}