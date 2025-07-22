import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Mail, Building2, Shield, LogOut } from "lucide-react";

type UserType = {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  email?: string | null;
  profileImageUrl?: string | null;
  role?: string | null;
  companyCode?: string | null;
};

export default function Profile() {
  const { user, isAuthenticated, isLoading } = useAuth() as { user: UserType | null, isAuthenticated: boolean, isLoading: boolean };
  const { toast } = useToast();

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

  // State for editing fullName
  const [editFullName, setEditFullName] = useState<string>(user?.fullName || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleFullNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user?.id, fullName: editFullName }),
      });
      const data = await res.json();
      if (res.ok && data?.fullName) {
        setSuccessMsg("Full name updated successfully!");
        // Optionally update local user state
      } else {
        setErrorMsg(data?.message || "Failed to update full name.");
      }
    } catch {
      setErrorMsg("Failed to update full name.");
    }
    setIsSubmitting(false);
  };
  // Fetch company details by company code
  type CompanyDetailsType = {
    name: string;
    email: string;
    adminId: string;
    companyCode: string;
    address?: string;
    createdAt?: string;
  };
  const { data: companyDetails } = useQuery<CompanyDetailsType>({
    queryKey: ["/api/company/details", user?.companyCode],
    enabled: !!user?.companyCode,
  });

  // Fetch profile image from backend and display in profile section
  const [profileImageUrl, setProfileImageUrl] = useState<string>("");
  useEffect(() => {
    if (user?.email) {
      // Use user.id if available, else fallback to email
      const identifier = user?.id || user?.email;
      fetch(`/api/profile-image?userId=${identifier}`)
        .then(res => res.json())
        .then(data => {
          if (data?.url) setProfileImageUrl(data.url);
        });
    }
  }, [user?.id, user?.email]);

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

  const getInitials = (firstName: string | null, lastName: string | null) => {
    const first = firstName?.charAt(0) || "";
    const last = lastName?.charAt(0) || "";
    return (first + last).toUpperCase() || "U";
  };

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-gray-900 pb-16">
      <div className="container mx-auto px-4 py-10 max-w-lg">
        {/* Header */}
        <div className="mb-10 flex flex-col items-center text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight drop-shadow-lg">Profile</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 font-medium drop-shadow-sm">Your account information and settings</p>
        </div>

        {/* Profile Card - Modern Glassmorphism */}
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-2xl backdrop-blur-lg p-8 mb-10">
          <div className="flex flex-col items-center space-y-4 mb-6">
            <div className="relative group">
              <Avatar className="h-24 w-24 min-w-24 min-h-24 border-4 border-pink-400 shadow-2xl bg-white/80 dark:bg-gray-700/80 transition-all duration-300 overflow-visible backdrop-blur-lg">
                <AvatarImage src={profileImageUrl || user?.profileImageUrl || ""} className="object-cover w-full h-full rounded-full border-2 border-white dark:border-gray-700 shadow-lg" />
                <AvatarFallback className="text-2xl font-bold">{getInitials(user?.firstName ?? null, user?.lastName ?? null)}</AvatarFallback>
              </Avatar>
              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  if (!e.target.files || e.target.files.length === 0 || !user?.id) return;
                  const file = e.target.files[0];
                  if (file.size > 8 * 1024 * 1024) {
                    alert("Image too large. Please select an image smaller than 8MB.");
                    return;
                  }
                  // Show uploading indicator (optional)
                  try {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      const base64String = (reader.result as string).split(',')[1];
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
                    };
                    reader.onerror = () => {
                      alert("Could not read image file.");
                    };
                    reader.readAsDataURL(file);
                  } catch {
                    alert("Upload failed. Try again.");
                  }
                }}
              />
              <button
                className="absolute bottom-0 right-0 bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 hover:from-pink-600 hover:to-indigo-600 text-white rounded-full p-2 shadow-lg transition-all duration-200 opacity-90 group-hover:opacity-100 focus:outline-none border-2 border-white dark:border-gray-700"
                style={{ fontSize: 16 }}
                onClick={() => document.getElementById('profile-upload')?.click()}
                aria-label="Upload profile image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2a2.828 2.828 0 11-4-4 2.828 2.828 0 014 4z" />
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight drop-shadow-sm">
              {user?.fullName || (user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.email?.split("@")[0] || "Unknown User")}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={user?.role === "admin" ? "bg-gradient-to-br from-purple-500 via-pink-500 to-indigo-500 text-white shadow-lg" : "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"}>
                <Shield className="w-4 h-4 mr-1" />
                {user?.role || "user"}
              </Badge>
            </div>
          </div>
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-gray-500" />
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-gray-900 dark:text-white font-medium">{user?.email || "Not provided"}</p>
              </div>
            </div>
            {user?.companyCode && (
              <div className="flex items-center gap-4">
                <Building2 className="w-5 h-5 text-gray-500" />
                <div>
          {/* Stylish Full Name Edit Bar */}
          <form 
            onSubmit={handleFullNameSubmit} 
            className="mb-8 flex flex-col items-center justify-center gap-4 w-full px-2 sm:px-0"
            style={{ width: '100%' }}
          >
            <label htmlFor="edit-fullname" className="text-lg font-semibold text-gray-700 dark:text-gray-200 text-center w-full">Edit Full Name</label>
            <div className="flex flex-col items-center w-full max-w-md bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg px-2 py-2 sm:px-4 sm:py-2 mx-auto">
              <input
                id="edit-fullname"
                type="text"
                value={editFullName}
                onChange={e => setEditFullName(e.target.value)}
                className="w-full bg-transparent outline-none text-xl text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 font-medium px-2 py-2 text-center"
                placeholder="Enter your full name"
                disabled={isSubmitting}
                required
                style={{ minWidth: 0 }}
              />
              <Button 
                type="submit" 
                disabled={isSubmitting || !editFullName.trim()} 
                className="w-full mt-3 px-6 py-2 font-bold text-lg bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-500 text-white rounded-xl shadow-md hover:scale-[1.03] transition-all duration-200"
                style={{ marginTop: '0.75rem' }}
              >
                {isSubmitting ? "Saving..." : "Submit"}
              </Button>
            </div>
            {successMsg && <div className="text-green-600 font-semibold">{successMsg}</div>}
            {errorMsg && <div className="text-red-600 font-semibold">{errorMsg}</div>}
          </form>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Company Code</p>
                  <p className="text-gray-900 dark:text-white font-mono font-bold">{user.companyCode ?? ""}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Company Info - Modern Card, always shown as separate section */}
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-2xl backdrop-blur-lg p-8 mb-10 mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight drop-shadow">Company Information</h2>
          {companyDetails ? (
            <div className="space-y-6">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company Name</p>
                <p className="text-gray-900 dark:text-white font-bold">{companyDetails.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company Email</p>
                <p className="text-gray-900 dark:text-white font-medium">{companyDetails.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Admin ID</p>
                <p className="text-gray-900 dark:text-white font-mono font-bold">{companyDetails.adminId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Company Code</p>
                <p className="text-gray-900 dark:text-white font-mono font-bold">{companyDetails.companyCode}</p>
              </div>
              {companyDetails.address && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Address</p>
                  <p className="text-gray-900 dark:text-white font-medium">{companyDetails.address}</p>
                </div>
              )}
              {companyDetails.createdAt && (
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
                  <p className="text-gray-900 dark:text-white font-medium">{new Date(companyDetails.createdAt).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-gray-500 dark:text-gray-400">No company information available.</div>
          )}
        </div>

        {/* Actions - Modern Card */}
        <div className="rounded-2xl bg-white/80 dark:bg-gray-800/80 shadow-2xl backdrop-blur-lg p-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight drop-shadow">Account Actions</h2>
          <div className="space-y-4">
            <Button 
              variant="destructive" 
              className="w-full text-lg font-bold py-3 shadow-lg hover:scale-[1.01] transition-all duration-200"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5 mr-2" />
              Log Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
