import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Clock, 
  Users, 
  CheckCircle, 
  Calendar,
  Building2,
  ChevronRight,
  User
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { user, isLoading: authLoading } = useAuth();

  // Fetch active attendance
  const { data: activeAttendance } = useQuery({
    queryKey: ["/api/attendance/active"],
    enabled: !!user,
  });

  // Fetch company info for admin users
  const { data: companyInfo } = useQuery({
    queryKey: ["/api/company/admin/me"],
    enabled: !!user && (user as any)?.role === "admin",
  });

  // Fetch team members for admin users
  const { data: teamMembers } = useQuery({
    queryKey: ["/api/company/members"],
    enabled: !!user && (user as any)?.role === "admin",
  });

  // Fetch today's attendance for admin
  const { data: todayAttendance } = useQuery({
    queryKey: ["/api/attendance/company"],
    enabled: !!user && (user as any)?.role === "admin",
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
        <div className="container mx-auto px-4 py-6 max-w-md">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-32" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pb-16">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">Please complete your profile setup.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getUserName = () => {
    if ((user as any)?.firstName && (user as any)?.lastName) {
      return `${(user as any).firstName} ${(user as any).lastName}`;
    }
    if ((user as any)?.email) {
      return (user as any).email.split("@")[0];
    }
    return "User";
  };

  const isAdmin = (user as any)?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header Section */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {getGreeting()}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {getUserName()}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={isAdmin ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}>
              {isAdmin ? "Admin" : "Employee"}
            </Badge>
            {(user as any)?.companyCode && (
              <Badge variant="outline" className="font-mono text-xs">
                {(user as any).companyCode}
              </Badge>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Link href="/attendance">
            <Card className="cursor-pointer hover:shadow-md transition-shadow">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  Attendance
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {activeAttendance ? "Check Out" : "Check In"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {isAdmin ? (
            <Link href="/team">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <Users className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Team
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {(teamMembers as any)?.length || 0} members
                  </p>
                </CardContent>
              </Card>
            </Link>
          ) : (
            <Link href="/profile">
              <Card className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4 text-center">
                  <User className="w-8 h-8 text-orange-600 dark:text-orange-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Profile
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    My Details
                  </p>
                </CardContent>
              </Card>
            </Link>
          )}
        </div>

        {/* Status Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className={`w-5 h-5 ${activeAttendance ? 'text-green-600' : 'text-gray-400'}`} />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeAttendance ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    Checked In
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Since</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date((activeAttendance as any).checkInTime).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Duration</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {Math.floor((Date.now() - new Date((activeAttendance as any).checkInTime).getTime()) / (1000 * 60))} min
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Not checked in</span>
                </div>
                <Link href="/attendance">
                  <Button size="sm" className="mt-2">
                    Check In Now
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Admin Dashboard Cards */}
        {isAdmin && (
          <>
            {/* Company Overview */}
            {companyInfo && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    Company Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Company</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(companyInfo as any).name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Total Employees</p>
                      <p className="font-medium text-gray-900 dark:text-white">{(teamMembers as any)?.length || 0}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Summary */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Today's Summary
                  </div>
                  <Link href="/team">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {(todayAttendance as any)?.filter((record: any) => record.status !== null).length || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Present</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {((teamMembers as any)?.length || 0) - ((todayAttendance as any)?.filter((record: any) => record.status !== null).length || 0)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Absent</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {(teamMembers as any)?.length || 0}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Quick Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Quick Settings</span>
              <Link href="/settings">
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/settings">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <span className="text-sm text-gray-900 dark:text-white">App Preferences</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
              <Link href="/profile">
                <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                  <span className="text-sm text-gray-900 dark:text-white">Profile Settings</span>
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
