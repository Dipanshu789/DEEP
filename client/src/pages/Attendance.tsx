import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, CheckCircle, XCircle } from "lucide-react";
import CheckInProcessModal from "@/components/CheckInProcessModal";

interface AttendanceLog {
  id: number;
  date: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  status: string;
  hoursWorked: string | null;
}

export default function Attendance() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [showCheckInModal, setShowCheckInModal] = useState(false);

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

  // Fetch user's attendance logs
  const { data: attendanceLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["/api/attendance/my-logs"],
    enabled: !!user,
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
      }
    },
  });

  // Check active attendance
  const { data: activeAttendance } = useQuery({
    queryKey: ["/api/attendance/active"],
    enabled: !!user,
  });

  const handleCheckInSuccess = () => {
    setShowCheckInModal(false);
    queryClient.invalidateQueries({ queryKey: ["/api/attendance/my-logs"] });
    queryClient.invalidateQueries({ queryKey: ["/api/attendance/active"] });
    toast({
      title: "Success",
      description: activeAttendance ? "Checked out successfully!" : "Checked in successfully!",
    });
  };

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

  const getStatusBadge = (status: string) => {
    const variants = {
      complete: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      incomplete: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      present: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      late: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
      absent: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.incomplete}>
        {status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-16">
      <div className="container mx-auto px-4 py-6 max-w-md">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Attendance
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your work hours and attendance
          </p>
        </div>

        {/* Quick Action Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Quick Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {activeAttendance ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="text-green-600 font-medium">Currently Checked In</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Since: {new Date(activeAttendance.checkInTime).toLocaleTimeString()}
                  </p>
                  <Button 
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full"
                    variant="destructive"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Check Out
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    <span className="text-gray-600 dark:text-gray-400">Not Checked In</span>
                  </div>
                  <Button 
                    onClick={() => setShowCheckInModal(true)}
                    className="w-full"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Check In
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Attendance */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            {logsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : attendanceLogs && attendanceLogs.length > 0 ? (
              <div className="space-y-4">
                {attendanceLogs.map((log: AttendanceLog) => (
                  <div key={log.id} className="border-b border-gray-200 dark:border-gray-700 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {new Date(log.date).toLocaleDateString()}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="w-4 h-4" />
                          {log.checkInTime && (
                            <span>In: {new Date(log.checkInTime).toLocaleTimeString()}</span>
                          )}
                          {log.checkOutTime && (
                            <span>Out: {new Date(log.checkOutTime).toLocaleTimeString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(log.status)}
                        {log.hoursWorked && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {log.hoursWorked}h
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No attendance records yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Check-in Modal */}
      {showCheckInModal && (
        <CheckInProcessModal
          isOpen={showCheckInModal}
          onClose={() => setShowCheckInModal(false)}
          onSuccess={handleCheckInSuccess}
        />
      )}
    </div>
  );
}