import teamImg from "./assets/team.png";
import { useEffect, useState } from "react";
// Simple modal component for popup with blur effect
function Modal({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" style={{backdropFilter: 'blur(12px) saturate(160%)'}} onClick={onClose}></div>
      <div className="relative z-10 flex flex-col items-center justify-center p-0 bg-transparent shadow-none min-w-0 w-auto max-w-full">
        {children}
      </div>
    </div>
  );
}
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Users, Clock } from "lucide-react";
import TeamMemberActionsCard from "../components/TeamMemberActionsCard";

interface TeamMember {
  id: string;
  name: string;
  email: string | null;
  companyCode: string | null;
  profileImageUrl?: string | null;
}

interface AttendanceRecord {
  userId: string;
  status: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  hoursWorked: string | null;
}

export default function Team() {
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [memberDetails, setMemberDetails] = useState<any>(null);
  const { user, isAuthenticated, isLoading } = useAuth() as {
    user: { role?: string; companyCode?: string; name?: string; email?: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
  };
  const { toast } = useToast();

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || user?.role !== "admin")) {
      toast({
        title: "Unauthorized",
        description: "You need admin access to view this page.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, user, toast]);

  // Fetch team members (role 'user' for admin's company)
  const {
    data: teamMembers,
    isLoading: membersLoading,
    error: teamMembersError,
  } = useQuery({
    queryKey: ["/api/company", user?.companyCode, "users"],
    queryFn: async () => {
      if (!user?.companyCode) return [];
      const res = await fetch(`/api/company/${user.companyCode}/users`);
      if (!res.ok) throw new Error("Failed to fetch team members");
      return await res.json();
    },
    enabled: !!user && user?.role === "admin",
  });

  // Utility to check if error is unauthorized (HTTP 401)
  function isUnauthorizedError(error: unknown): boolean {
    if (!error) return false;
    if (typeof error === "object" && error !== null) {
      // react-query error shape
      if ("message" in error && typeof (error as any).message === "string") {
        return (error as any).message.toLowerCase().includes("unauthorized") || (error as any).message.includes("401");
      }
    }
    return false;
  }
  
  // Handle error for team members query
  useEffect(() => {
    if (teamMembersError) {
      if (typeof isUnauthorizedError === "function" && isUnauthorizedError(teamMembersError)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    }
  }, [teamMembersError, toast]);


  // Socket.IO for live attendance updates
  const queryClient = useQueryClient?.() ?? undefined;
  useEffect(() => {
    if (!queryClient) return;
    let socket: import("socket.io-client").Socket | undefined;
    import("socket.io-client").then(({ default: io }) => {
      socket = io("http://localhost:5000", { transports: ["websocket"] });
      socket.on("attendanceUpdated", (data: { companyCode: string; userId: string }) => {
        queryClient.invalidateQueries({ queryKey: ["/api/attendance/company", data.companyCode] });
        queryClient.invalidateQueries({ queryKey: ["/api/company", data.companyCode, "users"] });
        queryClient.invalidateQueries({ queryKey: ["/api/attendance/user", data.userId] });
      });
    });
    return () => {
      if (socket) socket.disconnect();
    };
  }, [queryClient]);

  // Fetch today's attendance
  // Fetch member details for info popup
  const fetchMemberDetails = async (member: TeamMember) => {
    // You may want to adjust the endpoint as per your backend
    const res = await fetch(`/api/user/${member.id}`);
    if (res.ok) {
      setMemberDetails(await res.json());
    } else {
      setMemberDetails(null);
    }
  };

  // Delete member logic
  const handleDeleteMember = async (member: TeamMember) => {
    setDeleting(true);
    const res = await fetch(`/api/user/${member.id}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      toast({ title: "Deleted", description: `User ${member.name} deleted.`, variant: "default" });
      setSelectedMember(null);
      setShowDelete(false);
      // Refetch team members
      if (queryClient) queryClient.invalidateQueries({ queryKey: ["/api/company", user?.companyCode, "users"] });
    } else {
      toast({ title: "Error", description: "Failed to delete user.", variant: "destructive" });
    }
  };
  const { data: todayAttendance = [] } = useQuery({
    queryKey: ["/api/attendance/company", user?.companyCode],
    enabled: !!user && user?.role === "admin" && !!user.companyCode,
    queryFn: async () => {
      if (!user?.companyCode) return [];
      const res = await fetch(`/api/attendance/company?companyCode=${user.companyCode}`);
      if (!res.ok) throw new Error("Failed to fetch today's attendance");
      return await res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center pb-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== "admin") {
    return null;
  }

  const getAttendanceStatus = (userId: string) => {
    const attendanceArray = Array.isArray(todayAttendance) ? todayAttendance : [];
    return attendanceArray.find((record: AttendanceRecord) => record.userId === userId) || null;
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) {
      return (
        <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
          Not checked in
        </Badge>
      );
    }

    const variants = {
      complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      incomplete: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      present: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      late: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      absent: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.incomplete}>
        {status === "incomplete" ? "Checked in" : status}
      </Badge>
    );
  };

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  // Use import for static asset to avoid require error in Vite/React

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-16">
      <div className="container mx-auto px-4 py-10 max-w-5xl flex flex-col gap-8">
        {/* Header and Illustration */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-4">
          <div className="flex-1 flex flex-col items-start md:items-start">
            <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight drop-shadow-lg">Team</h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 font-medium drop-shadow-sm mb-2">Manage your team members and attendance</p>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <img src={teamImg} alt="Team" className="w-64 h-64 object-contain drop-shadow-xl" />
          </div>
        </div>

        {/* Team Members - Modern Card List */}
        <div className="rounded-3xl bg-white/90 dark:bg-gray-800/90 shadow-2xl backdrop-blur-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 tracking-tight drop-shadow">Team Members</h2>
          {membersLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center space-x-4 animate-pulse">
                  <div className="w-14 h-14 bg-gradient-to-br from-pink-300 via-purple-300 to-blue-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 rounded-full shadow-lg"></div>
                  <div className="flex-1">
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : teamMembers && teamMembers.length > 0 ? (
            <div className="space-y-6">
              {teamMembers.map((member: TeamMember) => {
                const attendance = getAttendanceStatus(member.id);
                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-2xl bg-gradient-to-br from-white/80 via-green-50 to-green-100 dark:from-gray-900/80 dark:via-gray-800/80 dark:to-gray-900/80 shadow-lg p-6 hover:scale-[1.01] hover:shadow-2xl transition-all duration-200 border border-gray-200 dark:border-gray-800 cursor-pointer"
                    onClick={() => {
                      setSelectedMember(member);
                      setShowInfo(false);
                      setShowDelete(false);
                      setMemberDetails(null);
                    }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {member.profileImageUrl ? (
                          <span className="inline-block h-14 w-14 min-w-14 min-h-14 rounded-full border-4 border-green-400 shadow-2xl bg-gradient-to-br from-green-200 via-green-100 to-green-300 dark:from-gray-700 dark:via-gray-800 dark:to-gray-900 overflow-hidden relative">
                            <img
                              src={member.profileImageUrl}
                              alt={member.name || member.email || "Profile"}
                              className="w-full h-full object-cover rounded-full transition-all duration-300"
                              style={{ display: 'block' }}
                            />
                            <span className="absolute inset-0 rounded-full ring-2 ring-white/60 dark:ring-gray-900/60 pointer-events-none"></span>
                          </span>
                        ) : (
                          <Avatar className="h-14 w-14 min-w-14 min-h-14 border-4 border-green-400 shadow-2xl bg-white/80 dark:bg-gray-700/80 transition-all duration-300 overflow-visible backdrop-blur-lg">
                            <AvatarFallback>{member.name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-lg text-gray-900 dark:text-white leading-tight drop-shadow-sm">{member.name || member.email?.split("@")[0] || "Unknown User"}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {attendance?.checkInTime && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{
                                (() => {
                                  // Always use DB checkInTime as-is (assume IST string from backend)
                                  const t = attendance.checkInTime;
                                  if (!t) return "--";
                                  // Format as HH:mm:ss from 'YYYY-MM-DD HH:mm:ss'
                                  const time = t.split(' ')[1]?.split('.')[0];
                                  return time || t;
                                })()
                              }</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(attendance?.status || null)}
                      {attendance?.hoursWorked && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{attendance.hoursWorked}h</p>
                      )}
                    </div>
                  </div>
                );
              })}
      {/* Popup Modal for member actions */}
      <Modal open={!!selectedMember} onClose={() => setSelectedMember(null)}>
        {selectedMember && !showInfo && !showDelete && (
          <TeamMemberActionsCard
            onInfo={async () => {
              setShowInfo(true);
              await fetchMemberDetails(selectedMember);
            }}
            onDelete={() => setShowDelete(true)}
            onClose={() => setSelectedMember(null)}
          />
        )}
        {selectedMember && showInfo && (
          <div className="flex flex-col items-center gap-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Member Info</h3>
            {memberDetails ? (
              <div className="text-left w-full max-w-xs">
                <div className="mb-2"><span className="font-semibold">ID:</span> {memberDetails.id}</div>
                <div className="mb-2"><span className="font-semibold">Full Name:</span> {memberDetails.fullName || memberDetails.name}</div>
                <div className="mb-2"><span className="font-semibold">Email:</span> {memberDetails.email}</div>
                <div className="mb-2"><span className="font-semibold">Created At:</span> {memberDetails.createdAt && typeof memberDetails.createdAt === 'string' ? memberDetails.createdAt : (memberDetails.createdAt && memberDetails.createdAt.toString ? memberDetails.createdAt.toString() : "-")}</div>
              </div>
            ) : (
              <div className="text-gray-500">Loading...</div>
            )}
            <button
              className="mt-4 px-6 py-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white font-semibold shadow hover:bg-gray-400 dark:hover:bg-gray-600 transition"
              onClick={() => setShowInfo(false)}
            >Back</button>
          </div>
        )}
        {selectedMember && showDelete && (
          <div className="group select-none w-[220px] flex flex-col p-3 relative items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-700 shadow-xl rounded-xl">
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="rounded-full bg-red-500/10 p-2 mb-1 flex items-center justify-center">
                <svg fill="currentColor" viewBox="0 0 20 20" className="w-8 h-8 text-red-500" xmlns="http://www.w3.org/2000/svg">
                  <path clipRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" fillRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-gray-100">Are you sure?</h2>
              <p className="font-medium text-xs text-gray-400 px-2 text-center">
                Do you really want to continue? This process cannot be undone.
              </p>
            </div>
            <div className="flex flex-col gap-2 mt-4 w-full">
              <button
                className="w-full bg-gray-700 px-4 py-2 text-xs shadow-sm font-semibold tracking-wide border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg hover:shadow-lg hover:bg-gray-800 transition ease-in duration-200"
                onClick={() => setShowDelete(false)}
                disabled={deleting}
              >Cancel</button>
              <button
                className="w-full bg-red-500 hover:bg-transparent px-4 py-2 text-xs shadow-sm hover:shadow-lg font-semibold tracking-wide border border-red-500 hover:border-red-500 text-white hover:text-red-500 rounded-lg transition ease-in duration-200"
                onClick={() => handleDeleteMember(selectedMember)}
                disabled={deleting}
              >{deleting ? "Deleting..." : "Confirm"}</button>
            </div>
          </div>
        )}
      </Modal>
            </div>
          ) : (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No team members yet</p>
            </div>
          )}
        </div>

        {/* Team Stats - Modern Enterprise Style (Horizontal Small Squares) */}
        <div className="flex flex-row items-center justify-center gap-4 mt-2">
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-green-100 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-xl">
            <span className="text-2xl font-extrabold text-blue-700 dark:text-blue-300 mb-1 drop-shadow">{teamMembers?.length || 0}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Total</span>
          </div>
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-green-100 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-xl">
            <span className="text-2xl font-extrabold text-green-700 dark:text-green-300 mb-1 drop-shadow">{(Array.isArray(todayAttendance) ? todayAttendance.filter((record: AttendanceRecord) => record.status !== null).length : 0)}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Present</span>
          </div>
          <div className="w-24 h-24 flex flex-col items-center justify-center bg-gradient-to-br from-green-200 via-green-100 to-green-300 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800 rounded-xl shadow-xl">
            <span className="text-2xl font-extrabold text-red-700 dark:text-red-300 mb-1 drop-shadow">{(teamMembers?.length || 0) - (Array.isArray(todayAttendance) ? todayAttendance.filter((record: AttendanceRecord) => record.status !== null).length : 0)}</span>
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}


