import { useState, useEffect } from "react";
import userImg from "./assets/user.png";
import io from "socket.io-client";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceLog, Company } from "@shared/schema";
import { Clock, Eye, MapPin, Satellite, Play, Square, CalendarDays } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CheckInProcessModal from "@/components/CheckInProcessModal";
import { isUnauthorizedError } from "@/lib/authUtils";
import { useNavigate } from "react-router-dom";

const StyledWrapper = styled.div`
.inbox-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: none;
  box-shadow: 0px 0px 20px rgba(0, 0, 0, 0.082);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background-color: #464646;
  cursor: pointer;
  transition: all 0.3s;
}
.inbox-btn svg path {
  fill: white;
}
.inbox-btn svg {
  height: 17px;
  transition: all 0.3s;
}
.msg-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background-color: rgb(255, 255, 255);
  border-radius: 50%;
  font-size: 0.7em;
  color: rgb(0, 0, 0);
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.inbox-btn:hover {
  transform: scale(1.1);
}
`;

export default function UserDashboard() {
  const queryClient = useQueryClient();
  // Safe navigation function: uses useNavigate if available, else falls back to window.location.href
  let navigate: (path: string) => void;
  try {
    const nav = useNavigate();
    navigate = (path: string) => nav(path);
  } catch (err) {
    navigate = (path: string) => { window.location.href = path; };
  }
  useEffect(() => {
    // Only run once on mount
    const socket = io("http://localhost:5000", { transports: ["websocket"] });
    // Socket.IO connecting (no sensitive logging)
    socket.on("connect", () => {
      // Socket.IO connected
    });
    socket.on("attendanceUpdated", (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/company", data.companyCode] });
      queryClient.invalidateQueries({ queryKey: ["/api/company", data.companyCode, "users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", data.userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/active"] });
    });
    return () => { socket.disconnect(); };
  }, []); // Only on mount
  // Profile photo upload state
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Define a User type with at least firstName and companyCode (add more fields as needed)
  type User = {
    id?: string;
    firstName?: string;
    lastName?: string;
    companyCode?: string;
    // add other fields as needed
  };

  const { user } = useAuth() as { user: User };

  // Fetch full user details (including full name) from backend
  const { data: userDetails } = useQuery({
    queryKey: ["/api/user/details", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null;
      const res = await apiRequest("GET", `/api/user/details?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch user details");
      return await res.json();
    },
  });
  const { toast } = useToast();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isCheckInModalOpen, setIsCheckInModalOpen] = useState(false);
  // 3-step check-in state
  const [checkInStep, setCheckInStep] = useState(1);
  const [faceVerified, setFaceVerified] = useState(false);
  const [locationVerified, setLocationVerified] = useState(false);
  const [trackingStarted, setTrackingStarted] = useState(false);

  // Fetch profile image if available
  useEffect(() => {
    async function fetchProfileImage() {
      if (user?.id) {
        try {
          const res = await apiRequest("GET", `/api/profile-image?userId=${user.id}`);
          const data = await res.json();
          if (data?.url) setProfileImage(data.url);
        } catch {}
      }
    }
    fetchProfileImage();
  }, [user?.id]);

  // Handle profile image upload (convert to base64 and send to backend)
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    // Limit: 8MB (base64 will be larger than file size)
    if (file.size > 8 * 1024 * 1024) {
      toast({ title: "Image Too Large", description: "Please select an image smaller than 8MB.", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      // Convert image file to base64 string
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1]; // Remove data URL prefix
        // Send base64 string to backend
        const res = await fetch("/api/profile-image/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.id, imageData: base64String }),
        });
        const data = await res.json();
        if (data?.success) {
          // Refetch profile image from backend
          const imgRes = await apiRequest("GET", `/api/profile-image?userId=${user.id}`);
          const imgData = await imgRes.json();
          if (imgData?.url) setProfileImage(imgData.url);
          toast({ title: "Profile Updated", description: "Profile photo uploaded!" });
        } else {
          toast({ title: "Upload Failed", description: "Could not upload profile photo.", variant: "destructive" });
        }
        setUploading(false);
      };
      reader.onerror = () => {
        toast({ title: "Upload Failed", description: "Could not read image file.", variant: "destructive" });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      toast({ title: "Upload Failed", description: "Could not upload profile photo.", variant: "destructive" });
      setUploading(false);
    }
  };

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: company } = useQuery({
    queryKey: ["company-details", user?.companyCode],
    enabled: !!user?.companyCode,
    queryFn: async () => {
      if (!user?.companyCode) return null;
      const res = await apiRequest("GET", `/api/company/${user.companyCode}`);
      if (!res.ok) throw new Error("Company not found");
      return res.json();
    },
  });

  // Always fetch today's attendance using the canonical endpoint
  const { data: todaysAttendanceArr = [] } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance/user", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return [];
      const res = await apiRequest("GET", `/api/attendance/user?userId=${user.id}`);
      if (!res.ok) throw new Error("Failed to fetch today's attendance");
      return await res.json();
    },
  });

  // For compatibility with existing code, treat first element as today's log
  const todayDateStr = new Date().toISOString().split('T')[0];
  const todaysAttendance = Array.isArray(todaysAttendanceArr) && todaysAttendanceArr.length > 0
    ? todaysAttendanceArr.find(log => log.date === todayDateStr)
    : undefined;

  const { data: activeAttendance } = useQuery<AttendanceLog>({
    queryKey: ["/api/attendance/active"],
  });

  const { data: recentAttendance = [] } = useQuery<AttendanceLog[]>({
    queryKey: ["/api/attendance/user", user?.id],
    enabled: !!user?.id,
  });

  // --- Calculate if user can check out (>= 7h 33m worked) ---
  function parseWorkedMs(hoursWorked: string | undefined, checkInTime?: string, checkOutTime?: string): number {
    if (!hoursWorked || !/\d/.test(hoursWorked)) {
      if (checkInTime && !checkOutTime) {
        const checkIn = new Date(checkInTime);
        const now = new Date();
        return now.getTime() - checkIn.getTime();
      }
      return 0;
    }
    const regex = /(?:(\d+(?:\.\d+)?)h)?\s*(?:(\d+)m)?\s*(?:(\d+)s)?/i;
    const match = hoursWorked.match(regex);
    if (match) {
      const h = match[1] ? parseFloat(match[1]) : 0;
      const m = match[2] ? parseInt(match[2]) : 0;
      const s = match[3] ? parseInt(match[3]) : 0;
      return (h * 3600 + m * 60 + s) * 1000;
    }
    const floatMatch = hoursWorked.match(/([\d.]+)/);
    if (floatMatch) {
      const hours = parseFloat(floatMatch[1]);
      return hours * 3600 * 1000;
    }
    return 0;
  }

  let workedMs = parseWorkedMs(
    todaysAttendance?.hoursWorked ?? undefined,
    todaysAttendance?.checkInTime ? (typeof todaysAttendance.checkInTime === "string" ? todaysAttendance.checkInTime : todaysAttendance.checkInTime?.toISOString()) : undefined,
    todaysAttendance?.checkOutTime ? (typeof todaysAttendance.checkOutTime === "string" ? todaysAttendance.checkOutTime : todaysAttendance.checkOutTime?.toISOString()) : undefined
  );

  // --- Check-In and Check-Out Button Logic ---
  const hasCheckedInToday = !!todaysAttendance && !!todaysAttendance.checkInTime;
  const hasCheckedOutToday = !!todaysAttendance && !!todaysAttendance.checkOutTime;

  // Only allow check-in between 9:00 and 11:00 IST
  function isCheckInAllowedIST() {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utc + istOffset);
    const hour = istDate.getHours();
    const minute = istDate.getMinutes();
    // Allow check-in from 9:00 to 11:30 AM IST
    return (hour > 9 || (hour === 9 && minute >= 0)) && (hour < 11 || (hour === 11 && minute <= 30));
  }
  const canCheckInNow = isCheckInAllowedIST();

  // 3-step Check-In handler
  const handleCheckIn = async (faceDescriptor?: any) => {
    setIsCheckInModalOpen(true);
    setCheckInStep(1);
    setFaceVerified(false);
    setLocationVerified(false);
    setTrackingStarted(false);
    try {
      // Step 1: Face Verification (simulate/capture)
      if (!faceDescriptor) {
        toast({ title: "Face Verification", description: "Please verify your face.", variant: "default" });
        return;
      }
      setFaceVerified(true);
      setCheckInStep(2);
      // Step 2: Geofence/location check
      const position = await getCurrentPosition();
      setLocationVerified(true);
      setCheckInStep(3);
      // Step 3: Tracking (call backend)
      const res = await apiRequest("POST", "/api/attendance/checkin", {
        userId: user?.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        faceDescriptor,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Check-in failed");
      setTrackingStarted(true);
      setCheckInStep(4);
      toast({ title: "Checked In", description: "Check-in successful!" });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/active"] });
      setTimeout(() => setIsCheckInModalOpen(false), 1200);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      setIsCheckInModalOpen(false);
    }
  };

  // Check-Out handler
  const handleCheckOut = async () => {
    try {
      const position = await getCurrentPosition();
      // Calculate hours worked string
      let hoursWorkedStr = (() => {
        if (todaysAttendance?.hoursWorked && /\d/.test(todaysAttendance.hoursWorked)) {
          return todaysAttendance.hoursWorked;
        } else if (todaysAttendance?.checkInTime && !todaysAttendance?.checkOutTime) {
          const checkIn = new Date(todaysAttendance.checkInTime);
          const now = new Date();
          const ms = now.getTime() - checkIn.getTime();
          const h = Math.floor(ms / (1000 * 60 * 60));
          const m = Math.floor((ms / (1000 * 60)) % 60);
          return `${h}h ${m}m`;
        } else {
          return "0h 0m";
        }
      })();
      const res = await apiRequest("POST", "/api/attendance/checkout", {
        userId: user?.id,
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        hoursWorked: hoursWorkedStr,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Check-out failed");
      toast({ title: "Checked Out", description: "Check-out successful!" });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/active"] });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  // Track backend eligibility for checkout
  const [canCheckOutBackend, setCanCheckOutBackend] = useState(true);
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      const position = await getCurrentPosition();
      // Save checkout time as IST (UTC+5:30)
      const now = new Date();
      // Convert to IST
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const istOffset = 5.5 * 60 * 60000;
      const istDate = new Date(utc + istOffset);
      // Send IST time to backend, along with today's attendance details
      const res = await apiRequest("POST", "/api/attendance/checkout", {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        checkOutTime: istDate.toISOString(),
        attendanceId: todaysAttendance?.id,
        checkInTime: todaysAttendance?.checkInTime,
        hoursWorked: (() => {
          if (todaysAttendance?.hoursWorked && /\d/.test(todaysAttendance.hoursWorked)) {
            return todaysAttendance.hoursWorked;
          } else if (todaysAttendance?.checkInTime && !todaysAttendance?.checkOutTime) {
            // Calculate live
            const checkIn = new Date(todaysAttendance.checkInTime);
            const now = new Date();
            const ms = now.getTime() - checkIn.getTime();
            const h = Math.floor(ms / (1000 * 60 * 60));
            const m = Math.floor((ms / (1000 * 60)) % 60);
            return `${h}h ${m}m`;
          } else {
            return "0h 0m";
          }
        })(),
      });
      const data = await res.json();
      if (!res.ok) {
        // If backend says not enough hours, show toast and set backend eligibility
        if (data?.error && data?.hoursWorked !== undefined) {
          setCanCheckOutBackend(false);
          throw new Error(`You need at least 7h 33m to check out. Current: ${data.hoursWorked}`);
        }
        throw new Error(data?.error || "Checkout failed");
      }
      setCanCheckOutBackend(true);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", user?.id] });
      toast({
        title: "Success",
        description: "Checked out successfully!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getCurrentPosition = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
    });
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { credentials: "include" });
    queryClient.removeQueries({ queryKey: ["/api/auth/user"] });
    window.location.replace("/");
  };

  const getStatusInfo = () => {
    if (activeAttendance?.isTracking) {
      return {
        text: "Checked In",
        className: "status-checked-in",
        dotClass: "bg-green-500",
        location: "You are successfully checked in!",
      };
    } else if (todaysAttendance?.checkOutTime) {
      return {
        text: "Checked Out",
        className: "status-checked-out",
        dotClass: "bg-blue-500",
        location: "Session Complete",
      };
    } else {
      return {
        text: "Not Checked In",
        className: "status-not-checked-in",
        dotClass: "bg-gray-400",
        location: "Ready to Check In",
      };
    }
  };

  // --- Check if user has already checked in today ---
  // const hasCheckedInToday = !!todaysAttendance && !!todaysAttendance.checkInTime;

  // --- Status Info: update immediately after check-in ---
  const status = (() => {
    if (activeAttendance?.isTracking || hasCheckedInToday) {
      return {
        text: "Checked In",
        className: "status-checked-in",
        dotClass: "bg-green-500",
        location: "You are successfully checked in!",
      };
    } else if (todaysAttendance?.checkOutTime) {
      return {
        text: "Checked Out",
        className: "status-checked-out",
        dotClass: "bg-blue-500",
        location: "Session Complete",
      };
    } else {
      return {
        text: "Not Checked In",
        className: "status-not-checked-in",
        dotClass: "bg-gray-400",
        location: "Ready to Check In",
      };
    }
  })();

return (
    <div className="min-h-screen w-full flex flex-col bg-[#F7F7F7] dark:bg-[#181A20]" style={{ transition: 'background 0.3s' }}>
      {/* Modern Capsule Navigation Header - Compact Capsule */}
      <header className="w-full flex justify-center items-center py-2 px-2 sm:py-4 sm:px-4">
        <div
          className="flex flex-row items-center justify-between w-full max-w-sm bg-white/95 dark:bg-[#232946]/95 backdrop-blur-lg shadow-lg rounded-full px-4 sm:px-6 py-2 gap-3 border border-gray-200 dark:border-[#232946]"
          style={{ borderRadius: '999px', transition: 'background 0.3s, border 0.3s', minHeight: 56, boxShadow: '0 4px 16px rgba(44,62,80,0.10)' }}
        >
          <div className="flex items-center gap-3 w-auto">
            <div className="relative w-12 h-12">
              <img
                src={profileImage || "/assets/client.png"}
                alt="Profile"
                className="w-full h-full object-cover rounded-full border-2 border-primary bg-gradient-to-br from-purple-300 to-pink-300 shadow"
              />
            </div>
            <div className="flex flex-col items-start ml-1">
              <span className="text-base font-semibold text-gray-800 dark:text-white leading-tight">
                {userDetails && typeof userDetails.fullName === "string" && userDetails.fullName.trim() !== "" ? userDetails.fullName : "User"}
              </span>
              {userDetails?.role === "admin" && (
                <span className="text-xs text-blue-600 dark:text-blue-300 font-medium mt-0.5">Admin</span>
              )}
            </div>
          </div>
          {/* Modern Capsule Logout Button (compact) */}
          <button
            className="custom-logout-btn Btn flex items-center justify-center w-10 h-10 rounded-full bg-white dark:bg-[#232946] shadow transition-all duration-300 hover:bg-black hover:text-white dark:hover:bg-pink-600 dark:hover:text-white"
            style={{ border: 'none', cursor: 'pointer', position: 'relative', overflow: 'hidden', borderRadius: '999px', minWidth: 40, minHeight: 40, fontWeight: 600, fontSize: '1em', boxShadow: '0 2px 8px rgba(44, 62, 80, 0.12)', color: 'inherit', outline: 'none' }}
            onClick={handleLogout}
          >
            <svg viewBox="0 0 512 512" style={{ width: '18px', fill: 'currentColor', filter: 'drop-shadow(0 0 4px #232946)' }} className="dark:fill-white dark:drop-shadow-lg">
              <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
            </svg>
          </button>
        </div>
      </header>

      <div className="w-full max-w-4xl mx-auto py-4 px-2 sm:px-4 lg:px-8">
      {/* Profile Card - Glassmorphism (profile photo below company/admin info, no white bg) */}
      <div className="flex flex-col items-center justify-center mb-8 sm:mb-10">
        <div className="mb-2 text-center">
          <span className="text-gray-500 dark:text-gray-400">Company: </span>
          <span className="font-semibold text-primary dark:text-pink-400">{company?.name || "Company"}</span>
          {company?.admin && (
            <>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-500 dark:text-gray-400">Admin: </span>
              <span className="font-semibold text-blue-600 dark:text-blue-300">{company.admin.name}</span>
            </>
          )}
        </div>
        {/* User image below company/admin info, bigger and not circular */}
        <img
          src={userImg}
          alt="User"
          className="w-40 h-40 sm:w-60 sm:h-67 object-contain mb-4 rounded-xl shadow-lg dark:shadow-blue-900 dark:bg-[#232946]"
          style={{ background: 'none', borderRadius: 0, boxShadow: 'none' }}
        />
        {uploading && <span className="text-primary text-sm">Uploading...</span>}
      </div>
        {/* Welcome Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 mb-2 animate-slide-up">Welcome Back!</h1>
          <p className="text-lg text-gray-700 dark:text-gray-300 font-medium animate-fade-in">
            {currentTime.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
          {/* Check-in timing message */}
          <div className="mt-2 flex items-center justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold shadow-sm border border-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" className="inline-block mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              Check-in allowed: <span className="font-bold ml-1">9:00 AM – 11:30 AM IST</span>
            </span>
          </div>
        </div>

        {/* Status Card */}
        <Card className="shadow-lg mb-6 sm:mb-8 bg-white/80 dark:bg-[#232946] rounded-2xl border border-gray-200 dark:border-[#232946]">
        <CardContent className="p-6 glass-card">
            <div className="text-center">
              <div className={`status-indicator ${status.className} mb-4`}>
                <div className={`w-2 h-2 ${status.dotClass} rounded-full mr-2`}></div>
                <span>{status.text}</span>
              </div>
              <div className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
                {currentTime.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </div>
              <div className="text-gray-600">{status.location}</div>
            </div>
          </CardContent>
        </Card>

        {/* Check-In/Check-Out Buttons Horizontal Capsule Card */}
        <Card className="shadow-lg mb-6 sm:mb-8 bg-white/80 dark:bg-[#232946] rounded-full border border-gray-200 dark:border-[#232946]" style={{ maxWidth: 420, marginLeft: 'auto', marginRight: 'auto', boxShadow: '0 2px 12px rgba(44,62,80,0.12)' }}>
          <CardContent className="p-4 glass-card">
            <div className="flex flex-row gap-2 justify-start items-center w-full" style={{ paddingLeft: 12 }}>
              <Button
                onClick={() => handleCheckIn(/* pass faceDescriptor here from modal/camera */)}
                disabled={hasCheckedInToday || !canCheckInNow}
                className="btn-secondary px-6 py-3 text-base font-semibold shadow-md rounded-full"
                style={{ borderRadius: '999px', minWidth: 120, boxShadow: '0 2px 8px rgba(44,62,80,0.10)' }}
                title={!canCheckInNow ? "Check-in allowed only between 9:00 AM and 11:30 AM IST" : undefined}
              >
                <Play className="mr-2 h-5 w-5" />
                Check In
              </Button>
              <Button
                onClick={handleCheckOut}
                disabled={!hasCheckedInToday || hasCheckedOutToday}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 text-base font-semibold shadow-md rounded-full"
                style={{ borderRadius: '999px', minWidth: 120, boxShadow: '0 2px 8px rgba(44,62,80,0.10)' }}
              >
                <Square className="mr-2 h-5 w-5" />
                Check Out
              </Button>
            </div>
          </CardContent>
        </Card>
      {/* 3-Step Check-In Modal/Stepper */}
      {isCheckInModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-[#232946] rounded-2xl shadow-lg p-6 w-full max-w-xs mx-auto">
            <h2 className="text-lg font-bold mb-4 text-center">3-Step Check-In</h2>
            <div className="space-y-4">
              <div className={`flex items-center gap-2 ${checkInStep >= 1 ? 'opacity-100' : 'opacity-60'}`}>
                <Eye className="h-5 w-5 text-primary" />
                <span>Face Verification {faceVerified ? '✅' : ''}</span>
              </div>
              <div className={`flex items-center gap-2 ${checkInStep >= 2 ? 'opacity-100' : 'opacity-60'}`}>
                <MapPin className="h-5 w-5 text-accent" />
                <span>Geofence Check {locationVerified ? '✅' : ''}</span>
              </div>
              <div className={`flex items-center gap-2 ${checkInStep >= 3 ? 'opacity-100' : 'opacity-60'}`}>
                <Satellite className="h-5 w-5 text-blue-500" />
                <span>Tracking {trackingStarted ? '✅' : ''}</span>
              </div>
            </div>
            <div className="mt-6 text-center">
              {checkInStep < 4 ? (
                <span className="text-sm text-gray-500">Processing step {checkInStep}...</span>
              ) : (
                <span className="text-green-600 font-semibold">Check-In Complete!</span>
              )}
            </div>
          </div>
        </div>
      )}

        {/* Today's Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <Card className="bg-white/80 dark:bg-[#232946] rounded-2xl border border-gray-200 dark:border-[#232946]">
            <CardContent className="p-6 text-center glass-card">
              <Clock className="mx-auto text-3xl text-primary mb-3 h-8 w-8" />
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Check-In Time</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {todaysAttendance?.checkInTime 
                  ? new Date(todaysAttendance.checkInTime).toLocaleTimeString()
                  : "--"
                }
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-[#232946] rounded-2xl border border-gray-200 dark:border-[#232946]">
            <CardContent className="p-6 text-center glass-card">
              <i className="fas fa-stopwatch text-3xl text-secondary mb-3"></i>
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">Hours Worked</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(() => {
                  if (todaysAttendance?.hoursWorked && parseFloat(todaysAttendance.hoursWorked) > 0) {
                    return `${todaysAttendance.hoursWorked}h`;
                  } else if (hasCheckedInToday && todaysAttendance?.checkInTime && !todaysAttendance?.checkOutTime) {
                    // Calculate live hours worked since check-in
                    const checkIn = new Date(todaysAttendance.checkInTime);
                    const now = new Date();
                    const ms = now.getTime() - checkIn.getTime();
                    const h = Math.floor(ms / (1000 * 60 * 60));
                    const m = Math.floor((ms / (1000 * 60)) % 60);
                    return `${h}h ${m}m`;
                  } else {
                    return "0h 0m";
                  }
                })()}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-white/80 dark:bg-[#232946] rounded-2xl border border-gray-200 dark:border-[#232946]">
            <CardContent className="p-6 text-center glass-card">
              <CalendarDays className="mx-auto text-3xl text-accent mb-3 h-8 w-8" />
              <h3 className="font-semibold text-gray-800 dark:text-white mb-2">This Week</h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {recentAttendance
                  .filter(log => {
                    const logDate = new Date(log.date);
                    const weekStart = new Date();
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    return logDate >= weekStart;
                  })
                  .reduce((total, log) => total + (parseFloat(log.hoursWorked || "0")), 0)
                  .toFixed(1)}h
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Attendance History */}
        <Card className="bg-white/80 dark:bg-[#232946] rounded-2xl border border-gray-200 dark:border-[#232946]">
          <CardHeader className="glass-card">
            <CardTitle className="text-xl font-bold text-primary dark:text-blue-300">Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent className="glass-card">
            <div className="space-y-4">
              {recentAttendance.slice(0, 5).map((record) => (
                <div key={record.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#232946] rounded-lg border border-gray-100 dark:border-[#232946]">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-4 ${
                      record.status === "complete" 
                        ? "bg-green-100" 
                        : record.status === "present"
                        ? "bg-blue-100"
                        : "bg-yellow-100"
                    }`}>
                      <CalendarDays className={`h-5 w-5 ${
                        record.status === "complete" 
                          ? "text-green-600" 
                          : record.status === "present"
                          ? "text-blue-600"
                          : "text-yellow-600"
                      }`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {new Date(record.date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'long' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {record.hoursWorked ? `${record.hoursWorked}h` : "--"}
                    </p>
                    <p className="text-sm text-gray-600">
                      {record.checkInTime && record.checkOutTime
                        ? `${new Date(record.checkInTime).toLocaleTimeString()} - ${new Date(record.checkOutTime).toLocaleTimeString()}`
                        : record.checkInTime
                        ? `${new Date(record.checkInTime).toLocaleTimeString()} - In Progress`
                        : "No Data"
                      }
                    </p>
                  </div>
                </div>
              ))}
              {recentAttendance.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>No attendance history available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Check-In Process Modal */}
      {isCheckInModalOpen && (
        <CheckInProcessModal
          isOpen={isCheckInModalOpen}
          onClose={() => setIsCheckInModalOpen(false)}
          onSuccess={async () => {
            setIsCheckInModalOpen(false);
            await queryClient.invalidateQueries({ queryKey: ["/api/attendance/today"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/attendance/active"] });
            await queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", user?.id] });
            await queryClient.invalidateQueries({ queryKey: ["/api/attendance/company"] }); // Invalidate company attendance for admin dashboard & team page
            await queryClient.invalidateQueries({ queryKey: ["/api/company", user?.companyCode, "users"] }); // Invalidate team members for team page
          }}
        />
      )}

      {/* Footer Section */}
      <div className="w-full fixed bottom-0 left-0 bg-white shadow-lg flex justify-center items-center py-2 sm:py-3 z-50">
        {/* Home Icon */}
        <div className="mx-3 sm:mx-6">
          <button className="footer-btn" onClick={() => navigate('/')} title="Home">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
              <path d="M3 12l9-9 9 9" />
              <path d="M9 21V9h6v12" />
            </svg>
          </button>
        </div>
        {/* Attendance Icon */}
        <div className="mx-3 sm:mx-6">
          <button className="footer-btn" onClick={() => navigate('/attendance')} title="Attendance">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
              <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
            </svg>
          </button>
        </div>
        {/* Message Icon - links to /message page */}
        <StyledWrapper>
          <button className="inbox-btn" onClick={() => navigate('/message')} title="Messages">
            <svg viewBox="0 0 512 512" height={16} xmlns="http://www.w3.org/2000/svg">
              <path d="M48 64C21.5 64 0 85.5 0 112c0 15.1 7.1 29.3 19.2 38.4L236.8 313.6c11.4 8.5 27 8.5 38.4 0L492.8 150.4c12.1-9.1 19.2-23.3 19.2-38.4c0-26.5-21.5-48-48-48H48zM0 176V384c0 35.3 28.7 64 64 64H448c35.3 0 64-28.7 64-64V176L294.4 339.2c-22.8 17.1-54 17.1-76.8 0L0 176z" />
            </svg>
            <span className="msg-count">99</span>
          </button>
        </StyledWrapper>
        {/* Profile Icon */}
        <div className="mx-3 sm:mx-6">
          <button className="footer-btn" onClick={() => navigate('/profile')} title="Profile">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
              <circle cx="12" cy="7" r="4" />
              <path d="M5.5 21a6.5 6.5 0 0 1 13 0" />
            </svg>
          </button>
        </div>
        {/* Settings Icon */}
        <div className="mx-3 sm:mx-6">
          <button className="footer-btn" onClick={() => navigate('/settings')} title="Settings">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="size-6">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.09a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.09a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.09a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
