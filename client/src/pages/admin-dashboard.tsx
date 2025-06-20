import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Users, UserPlus, Download, TrendingUp, Clock, Shield,
  Calendar, BarChart3, Activity, AlertTriangle, Building
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default function AdminDashboard() {
  const currentUser = getCurrentUser();
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: employees = [] } = useQuery({
    queryKey: ["/api/company/employees"],
    enabled: !!currentUser?.companyId,
  });

  const { data: stats = {} } = useQuery({
    queryKey: ["/api/admin/stats"],
    enabled: !!currentUser?.companyId,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["/api/departments"],
    enabled: !!currentUser?.companyId,
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/audit"],
    enabled: !!currentUser?.companyId,
  });

  const getDashboardStats = () => {
    const employeeList = Array.isArray(employees) ? employees : [];
    const today = new Date().toDateString();
    
    const totalEmployees = employeeList.length;
    const presentToday = employeeList.filter((emp: any) => 
      emp.attendanceRecords?.some((record: any) => 
        new Date(record.date).toDateString() === today && record.status === 'present'
      )
    ).length;
    
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;
    const departmentCount = Array.isArray(departments) ? departments.length : 0;

    return {
      totalEmployees,
      presentToday,
      attendanceRate,
      departmentCount,
    };
  };

  const dashboardStats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Mobile Header */}
      <div className="mobile-header p-4 md:p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-sm md:text-base text-gray-600 hidden sm:block">Manage your company's attendance system</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button className="btn-primary text-white touch-target text-sm px-3 py-2">
              <UserPlus className="mr-1 md:mr-2" size={14} />
              <span className="hidden sm:inline">Add Employee</span>
              <span className="sm:hidden">Add</span>
            </Button>
            <Button variant="outline" className="touch-target text-sm px-3 py-2 hidden md:flex">
              <Download className="mr-2" size={14} />
              Export Data
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile-optimized container */}
      <div className="px-3 md:px-6 pb-20 md:pb-6">
        {/* Key Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-8">
          <Card className="mobile-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Total Employees</p>
                  <p className="text-xl md:text-2xl font-bold text-primary">{dashboardStats.totalEmployees}</p>
                </div>
                <Users className="h-6 w-6 md:h-8 md:w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Present Today</p>
                  <p className="text-xl md:text-2xl font-bold text-green-600">{dashboardStats.presentToday}</p>
                </div>
                <Activity className="h-6 w-6 md:h-8 md:w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Attendance Rate</p>
                  <p className="text-xl md:text-2xl font-bold text-blue-600">{dashboardStats.attendanceRate}%</p>
                </div>
                <TrendingUp className="h-6 w-6 md:h-8 md:w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="mobile-card">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600">Departments</p>
                  <p className="text-xl md:text-2xl font-bold text-purple-600">{dashboardStats.departmentCount}</p>
                </div>
                <Building className="h-6 w-6 md:h-8 md:w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-optimized Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
            <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
            <TabsTrigger value="employees" className="text-xs md:text-sm">Employees</TabsTrigger>
            <TabsTrigger value="departments" className="text-xs md:text-sm hidden md:flex">Departments</TabsTrigger>
            <TabsTrigger value="attendance" className="text-xs md:text-sm">Attendance</TabsTrigger>
            <TabsTrigger value="audit" className="text-xs md:text-sm hidden md:flex">Audit</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Today's Attendance Overview */}
              <Card className="mobile-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="mr-2" size={18} />
                    Today's Attendance
                  </CardTitle>
                  <CardDescription className="text-sm">Real-time attendance tracking</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Attendance Rate</span>
                      <span className="font-semibold">{dashboardStats.attendanceRate}%</span>
                    </div>
                    <Progress value={dashboardStats.attendanceRate} className="h-2" />
                    
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <div className="text-lg md:text-xl font-bold text-green-600">{dashboardStats.presentToday}</div>
                        <div className="text-xs md:text-sm text-green-600">Present</div>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-lg md:text-xl font-bold text-red-600">{dashboardStats.totalEmployees - dashboardStats.presentToday}</div>
                        <div className="text-xs md:text-sm text-red-600">Absent</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Department Overview */}
              <Card className="mobile-card">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Building className="mr-2" size={18} />
                    Department Overview
                  </CardTitle>
                  <CardDescription className="text-sm">Department-wise breakdown</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Array.isArray(departments) && departments.slice(0, 4).map((dept: any) => (
                      <div key={dept.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="font-medium text-sm">{dept.name}</div>
                          <div className="text-xs text-gray-600">{dept.employeeCount || 0} employees</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(Math.random() * 100)}% present
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="employees" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Users className="mr-2" size={18} />
                  Employee Management
                </CardTitle>
                <CardDescription className="text-sm">Manage your team members</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(employees) && employees.slice(0, 10).map((employee: any) => (
                    <div key={employee.id} className="flex items-center justify-between p-3 glassmorphic rounded-xl swipeable-card">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-primary rounded-full flex items-center justify-center text-white text-sm font-semibold">
                          {employee.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm md:text-base truncate">{employee.email}</div>
                          <div className="text-xs md:text-sm text-gray-600">{employee.department || 'General'}</div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <Badge variant={employee.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                          {employee.role}
                        </Badge>
                        <Badge variant={employee.isRegistered ? 'default' : 'destructive'} className="text-xs">
                          {employee.isRegistered ? 'Active' : 'Pending'}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="departments" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Building className="mr-2" size={18} />
                  Department Management
                </CardTitle>
                <CardDescription className="text-sm">Organize your workforce</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.isArray(departments) && departments.map((dept: any) => (
                    <div key={dept.id} className="p-4 glassmorphic rounded-xl">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-semibold text-lg">{dept.name}</h3>
                        <Badge variant="outline">{dept.employeeCount || 0} employees</Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{dept.description || 'No description available'}</p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Manager:</span>
                        <span className="font-medium">{dept.manager || 'Not assigned'}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <BarChart3 className="mr-2" size={18} />
                  Attendance Analytics
                </CardTitle>
                <CardDescription className="text-sm">Track attendance patterns</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-xl">
                      <div className="text-2xl font-bold text-blue-600">87%</div>
                      <div className="text-sm text-blue-600">This Week</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-xl">
                      <div className="text-2xl font-bold text-green-600">92%</div>
                      <div className="text-sm text-green-600">This Month</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-xl">
                      <div className="text-2xl font-bold text-purple-600">89%</div>
                      <div className="text-sm text-purple-600">Overall</div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Recent Activity</h4>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <Activity size={16} className="text-green-600" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">Employee checked in</div>
                            <div className="text-xs text-gray-600">{i} minutes ago</div>
                          </div>
                        </div>
                        <Badge variant="default" className="text-xs">Present</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card className="mobile-card">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Shield className="mr-2" size={18} />
                  Audit Trail
                </CardTitle>
                <CardDescription className="text-sm">Security and compliance monitoring</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.isArray(auditLogs) && auditLogs.slice(0, 10).map((log: any) => (
                    <div key={log.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={16} className="text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{log.action}</div>
                        <div className="text-xs text-gray-600">User: {log.userEmail}</div>
                        <div className="text-xs text-gray-600">{new Date(log.timestamp).toLocaleString()}</div>
                      </div>
                      <Badge variant="outline" className="text-xs">{log.result}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}