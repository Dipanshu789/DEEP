import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar, Clock, Camera, TrendingUp, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

export default function UserDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const currentUser = getCurrentUser();

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch user's attendance records
  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["/api/attendance/user", currentUser?.id],
    enabled: !!currentUser?.id,
  });

  // Fetch company settings
  const { data: companySettings } = useQuery({
    queryKey: ["/api/company/settings", currentUser?.companyId],
    enabled: !!currentUser?.companyId,
  });

  const today = new Date().toISOString().split('T')[0];
  const todayAttendance = attendanceRecords.find((record: any) => record.date === today);

  const checkIn = async () => {
    try {
      await apiRequest("POST", "/api/attendance/check-in", {
        userId: currentUser?.id,
        companyId: currentUser?.companyId,
        date: today,
        location: "Office", // In real app, get from GPS
        deviceInfo: navigator.userAgent,
        ipAddress: "127.0.0.1", // In real app, get actual IP
      });
      // Refetch attendance data
    } catch (error) {
      console.error("Check-in failed:", error);
    }
  };

  const checkOut = async () => {
    try {
      await apiRequest("POST", "/api/attendance/check-out", {
        attendanceId: todayAttendance?.id,
      });
      // Refetch attendance data
    } catch (error) {
      console.error("Check-out failed:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getWorkingHours = () => {
    if (!companySettings?.workingHours) return { start: "09:00", end: "17:00" };
    return JSON.parse(companySettings.workingHours);
  };

  const workingHours = getWorkingHours();
  const isWorkingHours = () => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= workingHours.start && now <= workingHours.end;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Welcome back, {currentUser?.firstName || currentUser?.email}
          </h1>
          <p className="text-gray-600">Track your attendance and view your records</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">{formatTime(currentTime)}</div>
            <div className="text-sm text-gray-600">{currentTime.toDateString()}</div>
          </div>
          <Button variant="outline" size="icon">
            <LogOut size={16} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Quick Actions */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2" size={20} />
              Quick Actions
            </CardTitle>
            <CardDescription>Mark your attendance for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!todayAttendance ? (
              <Button onClick={checkIn} className="w-full btn-primary text-white py-4 rounded-xl">
                <Camera className="mr-2" size={20} />
                Check In
              </Button>
            ) : !todayAttendance.checkOut ? (
              <div className="space-y-4">
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-green-600 font-semibold">Checked In</div>
                  <div className="text-sm text-green-600">
                    at {new Date(todayAttendance.checkIn).toLocaleTimeString()}
                  </div>
                </div>
                <Button onClick={checkOut} variant="outline" className="w-full py-4 rounded-xl">
                  <LogOut className="mr-2" size={20} />
                  Check Out
                </Button>
              </div>
            ) : (
              <div className="text-center p-4 bg-blue-50 rounded-xl">
                <div className="text-blue-600 font-semibold">Day Complete</div>
                <div className="text-sm text-blue-600">
                  Worked {Math.round((new Date(todayAttendance.checkOut).getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10} hours
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Working Hours</span>
                <span className="font-medium">{workingHours.start} - {workingHours.end}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Status</span>
                <Badge variant={isWorkingHours() ? "default" : "secondary"}>
                  {isWorkingHours() ? "Working Hours" : "Off Hours"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Today's Summary */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2" size={20} />
              Today's Summary
            </CardTitle>
            <CardDescription>Your attendance status for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 glassmorphic rounded-xl">
                <div className="text-2xl font-bold text-primary mb-1">
                  {todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
                <div className="text-sm text-gray-600">Check In</div>
              </div>
              <div className="text-center p-4 glassmorphic rounded-xl">
                <div className="text-2xl font-bold text-primary mb-1">
                  {todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </div>
                <div className="text-sm text-gray-600">Check Out</div>
              </div>
              <div className="text-center p-4 glassmorphic rounded-xl">
                <div className="text-2xl font-bold text-primary mb-1">
                  {todayAttendance?.checkIn && todayAttendance?.checkOut 
                    ? Math.round((new Date(todayAttendance.checkOut).getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10 + 'h'
                    : todayAttendance?.checkIn 
                    ? Math.round((currentTime.getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10 + 'h'
                    : '0h'
                  }
                </div>
                <div className="text-sm text-gray-600">Hours Worked</div>
              </div>
            </div>

            {todayAttendance && (
              <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Status:</span>
                  <Badge variant={todayAttendance.status === 'present' ? 'default' : 'secondary'}>
                    {todayAttendance.status}
                  </Badge>
                </div>
                {todayAttendance.faceVerified && (
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-600">Face Verified:</span>
                    <Badge variant="default">✓ Verified</Badge>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Attendance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2" size={20} />
            Recent Attendance
          </CardTitle>
          <CardDescription>Your attendance history for the past week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {attendanceRecords.slice(0, 7).map((record: any) => (
              <div key={record.id} className="flex items-center justify-between p-3 glassmorphic rounded-xl">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="font-semibold text-sm">{new Date(record.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                    <div className="text-xs text-gray-600">{new Date(record.date).toLocaleDateString([], { weekday: 'short' })}</div>
                  </div>
                  <div>
                    <div className="font-medium">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - 
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {record.checkIn && record.checkOut 
                        ? Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10 + ' hours'
                        : 'Incomplete'
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={record.status === 'present' ? 'default' : 'secondary'}>
                    {record.status}
                  </Badge>
                  {record.faceVerified && (
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Face ✓
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}