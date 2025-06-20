import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Calendar, Camera, LogOut, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function UserDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const currentUser = getCurrentUser();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: attendanceRecords = [] } = useQuery({
    queryKey: ["/api/attendance/user"],
    enabled: !!currentUser,
  });

  const { data: companySettings = {} } = useQuery({
    queryKey: ["/api/company/settings"],
    enabled: !!currentUser?.companyId,
  });

  const checkInMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/attendance/checkin`, {
        method: "POST",
        body: JSON.stringify({
          location: "Office", // GPS location would be captured here
          deviceInfo: navigator.userAgent,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user"] });
      toast({
        title: "Checked In Successfully",
        description: "Your attendance has been recorded",
      });
    },
  });

  const checkOutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest(`/api/attendance/checkout`, {
        method: "POST",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user"] });
      toast({
        title: "Checked Out Successfully",
        description: "Have a great day!",
      });
    },
  });

  const today = new Date().toDateString();
  const todayAttendance = Array.isArray(attendanceRecords) 
    ? attendanceRecords.find((record: any) => new Date(record.date).toDateString() === today)
    : null;

  const workingHours = companySettings.workingHours || { start: "09:00", end: "17:00" };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isWorkingHours = () => {
    const now = currentTime.toTimeString().slice(0, 5);
    return now >= workingHours.start && now <= workingHours.end;
  };

  const checkIn = () => checkInMutation.mutate();
  const checkOut = () => checkOutMutation.mutate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Mobile Header */}
      <div className="mobile-header p-4 md:p-6">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <h1 className="text-xl md:text-3xl font-bold text-gray-800 truncate">
              Welcome back, {currentUser?.firstName || currentUser?.email}
            </h1>
            <p className="text-sm md:text-base text-gray-600 hidden sm:block">Track your attendance and view your records</p>
          </div>
          <div className="flex items-center space-x-2 md:space-x-4">
            <div className="text-right">
              <div className="text-lg md:text-2xl font-bold text-primary">{formatTime(currentTime)}</div>
              <div className="text-xs md:text-sm text-gray-600 hidden sm:block">{currentTime.toDateString()}</div>
            </div>
            <Button variant="outline" size="icon" className="touch-target">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-optimized container */}
      <div className="px-3 md:px-6 pb-20 md:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8">
          {/* Quick Actions */}
          <Card className="lg:col-span-1 mobile-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Clock className="mr-2" size={18} />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-sm">Mark your attendance for today</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!todayAttendance ? (
                <Button onClick={checkIn} className="w-full btn-primary text-white py-4 rounded-xl touch-target">
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
                  <Button onClick={checkOut} variant="outline" className="w-full py-4 rounded-xl touch-target">
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
          <Card className="lg:col-span-2 mobile-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="mr-2" size={18} />
                Today's Summary
              </CardTitle>
              <CardDescription className="text-sm">Your attendance status for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                <div className="text-center p-3 md:p-4 glassmorphic rounded-xl">
                  <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                    {todayAttendance?.checkIn ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Check In</div>
                </div>
                <div className="text-center p-3 md:p-4 glassmorphic rounded-xl">
                  <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                    {todayAttendance?.checkOut ? new Date(todayAttendance.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Check Out</div>
                </div>
                <div className="text-center p-3 md:p-4 glassmorphic rounded-xl">
                  <div className="text-xl md:text-2xl font-bold text-primary mb-1">
                    {todayAttendance?.checkIn && todayAttendance?.checkOut 
                      ? Math.round((new Date(todayAttendance.checkOut).getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10 + 'h'
                      : todayAttendance?.checkIn 
                      ? Math.round((currentTime.getTime() - new Date(todayAttendance.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10 + 'h'
                      : '0h'
                    }
                  </div>
                  <div className="text-xs md:text-sm text-gray-600">Hours Worked</div>
                </div>
              </div>

              {todayAttendance && (
                <div className="mt-4 md:mt-6 p-3 md:p-4 bg-gray-50 rounded-xl">
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
        <Card className="mobile-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <TrendingUp className="mr-2" size={18} />
              Recent Attendance
            </CardTitle>
            <CardDescription className="text-sm">Your attendance history for the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.isArray(attendanceRecords) && attendanceRecords.slice(0, 7).map((record: any) => (
                <div key={record.id} className="flex items-center justify-between p-3 glassmorphic rounded-xl swipeable-card">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className="text-center min-w-[50px]">
                      <div className="font-semibold text-sm">{new Date(record.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</div>
                      <div className="text-xs text-gray-600">{new Date(record.date).toLocaleDateString([], { weekday: 'short' })}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm md:text-base truncate">
                        {record.checkIn ? new Date(record.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'} - 
                        {record.checkOut ? new Date(record.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                      </div>
                      <div className="text-xs md:text-sm text-gray-600">
                        {record.checkIn && record.checkOut 
                          ? Math.round((new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60) * 10) / 10 + ' hours'
                          : 'Incomplete'
                        }
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row items-end md:items-center space-y-1 md:space-y-0 md:space-x-2">
                    <Badge variant={record.status === 'present' ? 'default' : 'secondary'} className="text-xs">
                      {record.status}
                    </Badge>
                    {record.faceVerified && (
                      <Badge variant="outline" className="text-green-600 border-green-600 text-xs hidden md:inline-flex">
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
    </div>
  );
}