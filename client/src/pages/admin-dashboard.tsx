import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, Building, Settings, TrendingUp, Calendar, 
  Clock, UserPlus, Download, Filter, Search, 
  MoreVertical, Edit, Trash2, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { getCurrentUser } from "@/lib/auth";

export default function AdminDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [dateRange, setDateRange] = useState("today");
  const currentUser = getCurrentUser();

  // Fetch company data
  const { data: company } = useQuery({
    queryKey: ["/api/company", currentUser?.companyId],
    enabled: !!currentUser?.companyId,
  });

  // Fetch company employees
  const { data: employees = [] } = useQuery({
    queryKey: ["/api/company/employees", currentUser?.companyId],
    enabled: !!currentUser?.companyId,
  });

  // Fetch company departments
  const { data: departments = [] } = useQuery({
    queryKey: ["/api/company/departments", currentUser?.companyId],
    enabled: !!currentUser?.companyId,
  });

  // Fetch attendance analytics
  const { data: attendanceAnalytics } = useQuery({
    queryKey: ["/api/analytics/attendance", currentUser?.companyId, dateRange],
    enabled: !!currentUser?.companyId,
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["/api/audit/logs", currentUser?.companyId],
    enabled: !!currentUser?.companyId,
  });

  const filteredEmployees = employees.filter((emp: any) => {
    const matchesSearch = emp.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === "all" || emp.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  const getDashboardStats = () => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter((emp: any) => emp.isActive).length;
    const presentToday = attendanceAnalytics?.presentToday || 0;
    const attendanceRate = totalEmployees > 0 ? Math.round((presentToday / totalEmployees) * 100) : 0;

    return {
      totalEmployees,
      activeEmployees,
      presentToday,
      attendanceRate,
      departments: departments.length,
    };
  };

  const stats = getDashboardStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your company's attendance system</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button className="btn-primary text-white">
            <UserPlus className="mr-2" size={16} />
            Add Employee
          </Button>
          <Button variant="outline">
            <Download className="mr-2" size={16} />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Employees</p>
                <p className="text-2xl font-bold text-gray-800">{stats.totalEmployees}</p>
              </div>
              <Users className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.presentToday}</p>
              </div>
              <Clock className="text-green-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Attendance Rate</p>
                <p className="text-2xl font-bold text-primary">{stats.attendanceRate}%</p>
              </div>
              <TrendingUp className="text-blue-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Departments</p>
                <p className="text-2xl font-bold text-gray-800">{stats.departments}</p>
              </div>
              <Building className="text-purple-500" size={24} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-gray-800">{stats.activeEmployees}</p>
              </div>
              <Users className="text-indigo-500" size={24} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="employees" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="employees">Employees</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Employees Tab */}
        <TabsContent value="employees" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Employee Management</CardTitle>
                  <CardDescription>Manage your company employees and their details</CardDescription>
                </div>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    <Input
                      placeholder="Search employees..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Departments</SelectItem>
                      {departments.map((dept: any) => (
                        <SelectItem key={dept.id} value={dept.name}>{dept.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredEmployees.map((employee: any) => (
                  <div key={employee.id} className="flex items-center justify-between p-4 glassmorphic rounded-xl">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {(employee.firstName?.[0] || employee.email[0]).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">
                          {employee.firstName && employee.lastName 
                            ? `${employee.firstName} ${employee.lastName}`
                            : employee.email
                          }
                        </div>
                        <div className="text-sm text-gray-600">{employee.email}</div>
                        <div className="flex items-center space-x-2 mt-1">
                          {employee.department && (
                            <Badge variant="outline">{employee.department}</Badge>
                          )}
                          {employee.position && (
                            <Badge variant="secondary">{employee.position}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right text-sm">
                        <div className="text-gray-600">Status</div>
                        <Badge variant={employee.isActive ? "default" : "secondary"}>
                          {employee.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-600">Role</div>
                        <div className="font-medium capitalize">{employee.role}</div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical size={16} />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem>
                            <Eye className="mr-2" size={14} />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2" size={14} />
                            Edit Employee
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2" size={14} />
                            Remove Access
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Attendance Overview</CardTitle>
                  <CardDescription>Monitor daily attendance and working hours</CardDescription>
                </div>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-6 glassmorphic rounded-xl">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.presentToday}</div>
                  <div className="text-gray-600">Present Today</div>
                </div>
                <div className="text-center p-6 glassmorphic rounded-xl">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {stats.totalEmployees - stats.presentToday}
                  </div>
                  <div className="text-gray-600">Absent Today</div>
                </div>
                <div className="text-center p-6 glassmorphic rounded-xl">
                  <div className="text-3xl font-bold text-primary mb-2">{stats.attendanceRate}%</div>
                  <div className="text-gray-600">Attendance Rate</div>
                </div>
              </div>

              {/* Live attendance feed would go here */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-800">Recent Check-ins</h4>
                {auditLogs
                  .filter((log: any) => log.action === 'check_in')
                  .slice(0, 5)
                  .map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between p-3 glassmorphic rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                          <Clock className="text-white" size={14} />
                        </div>
                        <div>
                          <div className="font-medium">Employee checked in</div>
                          <div className="text-sm text-gray-600">
                            {new Date(log.createdAt).toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Check In
                      </Badge>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics & Reports</CardTitle>
              <CardDescription>Insights into attendance patterns and productivity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 glassmorphic rounded-xl">
                  <h4 className="font-semibold mb-4">Department Attendance</h4>
                  <div className="space-y-3">
                    {departments.map((dept: any) => {
                      const deptEmployees = employees.filter((emp: any) => emp.department === dept.name);
                      const deptAttendance = Math.floor(Math.random() * 100); // Mock data
                      return (
                        <div key={dept.id} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{dept.name}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-primary h-2 rounded-full" 
                                style={{ width: `${deptAttendance}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{deptAttendance}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="p-6 glassmorphic rounded-xl">
                  <h4 className="font-semibold mb-4">Weekly Trends</h4>
                  <div className="space-y-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day) => {
                      const attendance = Math.floor(Math.random() * 20) + 80; // Mock data
                      return (
                        <div key={day} className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-green-500 h-2 rounded-full" 
                                style={{ width: `${attendance}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{attendance}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Settings</CardTitle>
              <CardDescription>Configure attendance policies and company preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold">Working Hours</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Start Time</label>
                      <Input defaultValue="09:00" type="time" />
                    </div>
                    <div>
                      <label className="text-sm text-gray-600">End Time</label>
                      <Input defaultValue="17:00" type="time" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-semibold">Attendance Policies</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-gray-600">Late Threshold (minutes)</label>
                      <Input defaultValue="15" type="number" />
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Require Face Verification</span>
                      <Button variant="outline" size="sm">Enabled</Button>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Allow Manual Entry</span>
                      <Button variant="outline" size="sm">Disabled</Button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t">
                <Button className="btn-primary text-white">
                  <Settings className="mr-2" size={16} />
                  Save Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}