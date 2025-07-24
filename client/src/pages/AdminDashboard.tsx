import adminImg from "./assets/admin.png";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AttendanceLog, User as BaseUser } from "@shared/schema";

// Extend User type to include latitude and longitude for map markers
type User = BaseUser & {
  latitude?: number;
  longitude?: number;
};
import { Clock, UserCheck, UserX, AlertCircle, TrendingUp, Download, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProgressRing from "@/components/ui/progress-ring";
import GoogleMapView from "@/components/GoogleMapView";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useRef, useState, useEffect } from "react";
import io from "socket.io-client";
import React from "react";
import AttendanceDonutChart from "@/components/ui/AttendanceDonutChart";

export default function AdminDashboard() {
  const queryClient = useQueryClient();
  useEffect(() => {
    // Only run once on mount
    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    // Socket connection for attendance updates (no sensitive logging)
    socket.on("connect", () => {
      // Connected
    });
    socket.on("attendanceUpdated", (data: { companyCode: string; userId: string }) => {
      // Invalidate with correct query keys (must match useQuery)
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/company", data.companyCode] });
      queryClient.invalidateQueries({ queryKey: ["/api/company/employees", data.companyCode] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", data.userId] });
    });
    return () => { socket.disconnect(); };
  }, []); // Only on mount
  const { user } = useAuth() as { user?: User };




  // Fetch total members (same as Team page)
  const {
    data: teamMembers = [],
    isLoading: membersLoading,
  } = useQuery({
    queryKey: ["/api/company", user?.companyCode, "users"],
    queryFn: async () => {
      if (!user?.companyCode) return [];
      const res = await fetch(`/api/company/${user.companyCode}/users`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return await res.json();
    },
    enabled: !!user && user?.role === "admin" && !!user.companyCode,
  });


  // Fetch today's attendance logs (same as Team page)
  const {
    data: todayAttendance = [],
    isLoading: attendanceLoading,
  } = useQuery({
    queryKey: ["/api/attendance/company", user?.companyCode],
    queryFn: async () => {
      if (!user?.companyCode) return [];
      const res = await fetch(`/api/attendance/company?companyCode=${user.companyCode}`);
      if (!res.ok) throw new Error("Failed to fetch today's attendance");
      return await res.json();
    },
    enabled: !!user && user?.role === "admin" && !!user.companyCode,
  });


  // Calculate present and absent
  const presentCount = todayAttendance.filter((log: any) => log.status === "present" || log.checkInTime).length;
  const absentCount = Math.max(0, teamMembers.length - presentCount);


  const { data: attendanceLogs = [], isLoading: logsLoading } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance/company", user?.companyCode],
    enabled: !!user && user?.role === "admin" && !!user.companyCode,
  });

  const { data: employees = [] } = useQuery<User[]>({
    queryKey: ["/api/company/employees", user?.companyCode],
    enabled: !!user && user?.role === "admin" && !!user.companyCode,
  });

  // Fetch company info for map center (geofenceLatitude, geofenceLongitude)
  const { data: companyInfo } = useQuery({
    queryKey: ["/api/company", user?.companyCode],
    queryFn: async () => {
      if (!user?.companyCode) return null;
      const res = await fetch(`/api/company/${user.companyCode}`);
      if (!res.ok) throw new Error("Failed to fetch company info");
      return await res.json();
    },
    enabled: !!user && !!user.companyCode,
  });

  const handleLogout = async () => {
    await fetch("/api/logout", { credentials: "include" });
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    window.location.replace("/");
  };

  const today = new Date().toISOString().split('T')[0];
  const todaysLogs = attendanceLogs.filter(log => log.date === today);
  
  const stats = {
    present: todaysLogs.filter(log => log.status === "present" || log.checkInTime).length,
    absent: Math.max(0, employees.length - todaysLogs.length),
    late: todaysLogs.filter(log => {
      if (!log.checkInTime) return false;
      const checkInHour = new Date(log.checkInTime).getHours();
      return checkInHour >= 10; // Consider 10 AM as late
    }).length,
    attendanceRate: employees.length > 0 ? Math.round((todaysLogs.length / employees.length) * 100) : 0,
  };

  // Helper: Format IST time string (from backend) to 12hr time for display
  function formatISTTimeString(istString: string | null | undefined) {
    if (!istString) return "--";
    // istString: "YYYY-MM-DD HH:mm:ss"
    const [datePart, timePart] = istString.split(' ');
    if (!timePart) return "--";
    const [hour, minute, second] = timePart.split(":");
    let h = parseInt(hour, 10);
    const m = minute;
    const s = second;
    const ampm = h >= 12 ? "pm" : "am";
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m}:${s} ${ampm}`;
  }

  // Use the checkInTime from DB directly for recent activity
  const recentActivity = attendanceLogs
    .slice(0, 5)
    .map(log => ({
      employee: employees.find(emp => emp.id === log.userId)?.fullName || "Unknown",
      action: log.checkOutTime ? "Checked out" : "Checked in",
      time: log.checkInTime, // Always use DB checkInTime for display
      type: log.checkOutTime ? "checkout" : "checkin",
    }));

  const [uploading, setUploading] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch profile image on mount and when user.id changes
  useEffect(() => {
    const fetchProfileImage = async () => {
      if (!user?.id) return;
      try {
        const res = await fetch(`/api/profile-image?userId=${user.id}`);
        const data = await res.json();
        if (data?.url) {
          setProfileImageUrl(data.url);
        } else {
          setProfileImageUrl("");
        }
      } catch {
        setProfileImageUrl("");
      }
    };
    fetchProfileImage();
  }, [user?.id]);

  // Handle profile image upload
  // Modern profile image upload: convert to base64 and send as JSON
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user?.id) return;
    const file = e.target.files[0];
    if (file.size > 8 * 1024 * 1024) {
      alert("Image too large. Please select an image smaller than 8MB.");
      return;
    }
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        // Send base64 string to backend
        const res = await fetch("/api/profile-image/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, imageData: base64String }),
        });
        const data = await res.json();
        if (data?.success) {
          // Refetch profile image from backend
          const imgRes = await fetch(`/api/profile-image?userId=${user.id}`);
          const imgData = await imgRes.json();
          if (imgData?.url) setProfileImageUrl(imgData.url);
        } else {
          alert("Upload failed. Try again.");
        }
        setUploading(false);
      };
      reader.onerror = () => {
        alert("Could not read image file.");
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      alert("Upload failed. Try again.");
      setUploading(false);
    }
  };

  function handleExportLogs(event: React.MouseEvent<HTMLButtonElement, MouseEvent>): void {
    event.preventDefault();
    if (!user || !user.companyCode) return;
    const url = `/api/attendance/company/export?companyCode=${user.companyCode}`;
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `attendance_logs_${user.companyCode}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900">
      {/* Modern Capsule Header - fully blurred, no solid background */}
      <header className="w-full flex justify-center items-center py-6 px-4">
        <div className="flex items-center justify-between w-full max-w-3xl shadow-lg rounded-full px-8 py-4 gap-6 backdrop-blur-2xl" style={{ borderRadius: '999px', background: 'rgba(255,255,255,0.05)', WebkitBackdropFilter: 'blur(32px)', backdropFilter: 'blur(32px)' }}>
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 min-w-16 min-h-16 border-4 border-pink-400 shadow-2xl bg-white/80 dark:bg-gray-700/80 transition-all duration-300 overflow-visible backdrop-blur-lg">
              <AvatarImage
                src={profileImageUrl || user?.profileImageUrl || undefined}
                alt={user?.fullName || 'Admin'}
                className="object-cover w-full h-full rounded-full border-2 border-white dark:border-gray-700 shadow-lg"
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
              <AvatarFallback>{user?.fullName?.[0] || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col items-start ml-2">
              <span className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight drop-shadow-sm">{user?.fullName || 'Admin'}</span>
              <span className="text-xs text-indigo-500 dark:text-indigo-300 mt-1 font-semibold tracking-wide">Admin</span>
            </div>
          </div>
          <div className="flex items-center">
            <button
              className="custom-logout-btn Btn flex items-center justify-center w-12 h-12 rounded-full bg-white shadow transition-all duration-300 hover:bg-black"
              onClick={handleLogout}
              style={{ border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden' }}
            >
              <svg viewBox="0 0 512 512" style={{ width: '22px', fill: 'black' }}>
                <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto py-8 px-2 sm:px-6 lg:px-8">
        {/* Dashboard Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <img
            src={adminImg}
            alt="Admin Illustration"
            style={{ width: 320, height: 220, objectFit: "contain", background: "none", borderRadius: 0, boxShadow: "none", marginBottom: 0, marginTop: -32 }}
          />
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight drop-shadow-lg">Dashboard Overview</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium drop-shadow-sm">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Modern Donut Chart Card */}
        <div className="w-full flex flex-col items-center justify-center mb-8">
          <AttendanceDonutChart
            total={teamMembers.length}
            present={presentCount}
            absent={absentCount}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Live Employee Map (Google Maps) */}
          <Card>
            <CardHeader>
              <CardTitle>Live Employee Locations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative rounded-lg h-64 mb-4 overflow-hidden" style={{ minHeight: 256 }}>
                {companyInfo && companyInfo.geofenceLatitude != null && companyInfo.geofenceLongitude != null ? (
                  <GoogleMapView
                    markers={companyInfo && companyInfo.geofenceMarker ? [
                      {
                        lat: companyInfo.geofenceMarker.lat,
                        lng: companyInfo.geofenceMarker.lng,
                        label: companyInfo.geofenceMarker.name
                      }
                    ] : []}
                    center={{ lat: companyInfo.geofenceLatitude, lng: companyInfo.geofenceLongitude }}
                    zoom={15}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    Geofence location not set for this company.
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                    Active ({stats.present})
                  </span>
                  <span className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-2"></div>
                    Offline ({stats.absent})
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className={`p-2 rounded-full mr-3 ${
                      activity.type === "checkin" 
                        ? "bg-green-100" 
                        : "bg-blue-100"
                    }`}>
                      <i className={`fas ${
                        activity.type === "checkin" 
                          ? "fa-sign-in-alt text-green-600" 
                          : "fa-sign-out-alt text-blue-600"
                      } text-sm`}></i>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.employee}</p>
                      <p className="text-xs text-gray-500">
                        {activity.action} at {activity.time ? formatISTTimeString(typeof activity.time === "string" ? activity.time : activity.time.toISOString().replace("T", " ").substring(0, 19)) : "N/A"}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {activity.time ? formatISTTimeString(typeof activity.time === "string" ? activity.time : activity.time.toISOString().replace("T", " ").substring(0, 19)) : ""}
                    </span>
                  </div>
                )) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activity</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Table */}
        <Card className="mt-8">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Today's Attendance</CardTitle>
              <div className="flex space-x-2">
  <Button variant="outline" size="sm" onClick={handleExportLogs}>
    <Download className="h-4 w-4 mr-1" />
    Export
  </Button>
  <Button variant="outline" size="sm">
    <Filter className="h-4 w-4 mr-1" />
    Filter
  </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check In
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Check Out
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                    {todaysLogs.map((log) => {
                      const employee = employees.find(emp => emp.id === log.userId);
                      return (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-300 rounded-full mr-3"></div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">
                                  {employee?.fullName}
                                </div>
                                <div className="text-sm text-gray-500">Employee</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.checkInTime ? formatISTTimeString(typeof log.checkInTime === "string" ? log.checkInTime : log.checkInTime.toISOString().replace("T", " ").substring(0, 19)) : "--"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.checkOutTime ? formatISTTimeString(typeof log.checkOutTime === "string" ? log.checkOutTime : log.checkOutTime.toISOString().replace("T", " ").substring(0, 19)) : "--"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.hoursWorked ? `${log.hoursWorked}h` : "--"}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              log.status === "present" 
                                ? "bg-green-100 text-green-800"
                                : log.status === "complete"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}>
                              {log.status === "present" ? "Present" : 
                               log.status === "complete" ? "Complete" : 
                               "Incomplete"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {todaysLogs.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>No attendance records for today</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
