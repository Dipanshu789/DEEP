import { Link, useLocation } from "wouter";
import { Home, Users, Building2, BarChart3, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";

export function MobileNav() {
  const [location] = useLocation();
  const currentUser = getCurrentUser();

  if (!currentUser) return null;

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'super_admin';

  const navItems = [
    {
      href: "/",
      icon: Home,
      label: "Home",
      show: true
    },
    {
      href: "/employees",
      icon: Users,
      label: "Team",
      show: isAdmin
    },
    {
      href: "/departments",
      icon: Building2,
      label: "Depts",
      show: isAdmin
    },
    {
      href: "/analytics",
      icon: BarChart3,
      label: "Stats",
      show: isAdmin
    },
    {
      href: "/settings",
      icon: Settings,
      label: "Settings",
      show: true
    }
  ].filter(item => item.show);

  return (
    <div className="mobile-nav md:hidden">
      <div className="flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || 
            (item.href !== "/" && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-primary bg-primary/10' 
                  : 'text-gray-600 hover:text-primary hover:bg-gray-100'
              }`}>
                <Icon size={20} />
                <span className="text-xs font-medium">{item.label}</span>
                {isActive && (
                  <div className="w-1 h-1 bg-primary rounded-full"></div>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}