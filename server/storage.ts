import { 
  users, companies, attendanceRecords, departments, auditLogs, companySettings,
  type User, type InsertUser, type Company, type InsertCompany, 
  type AttendanceRecord, type InsertAttendance, type Department, type InsertDepartment,
  type AuditLog, type InsertAuditLog, type CompanySettings, type InsertCompanySettings
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  getCompanyUsers(companyId: number): Promise<User[]>;
  getUsersByDepartment(companyId: number, department: string): Promise<User[]>;
  
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined>;
  
  // Department operations
  getDepartment(id: number): Promise<Department | undefined>;
  getCompanyDepartments(companyId: number): Promise<Department[]>;
  createDepartment(department: InsertDepartment): Promise<Department>;
  updateDepartment(id: number, updates: Partial<Department>): Promise<Department | undefined>;
  
  // Attendance operations
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceRecords(userId: number): Promise<AttendanceRecord[]>;
  getCompanyAttendanceRecords(companyId: number): Promise<AttendanceRecord[]>;
  getAttendanceByDateRange(companyId: number, startDate: string, endDate: string): Promise<AttendanceRecord[]>;
  getUserAttendanceByMonth(userId: number, year: number, month: number): Promise<AttendanceRecord[]>;
  
  // Audit operations
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getCompanyAuditLogs(companyId: number): Promise<AuditLog[]>;
  
  // Company settings
  getCompanySettings(companyId: number): Promise<CompanySettings | undefined>;
  createCompanySettings(settings: InsertCompanySettings): Promise<CompanySettings>;
  updateCompanySettings(companyId: number, updates: Partial<CompanySettings>): Promise<CompanySettings | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private departments: Map<number, Department>;
  private auditLogs: Map<number, AuditLog>;
  private companySettings: Map<number, CompanySettings>;
  private currentUserId: number;
  private currentCompanyId: number;
  private currentAttendanceId: number;
  private currentDepartmentId: number;
  private currentAuditLogId: number;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.attendanceRecords = new Map();
    this.departments = new Map();
    this.auditLogs = new Map();
    this.companySettings = new Map();
    this.currentUserId = 1;
    this.currentCompanyId = 1;
    this.currentAttendanceId = 1;
    this.currentDepartmentId = 1;
    this.currentAuditLogId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      ...insertUser,
      id,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      faceData: insertUser.faceData || null,
      isRegistered: false,
      isActive: true,
      companyId: null,
      department: insertUser.department || null,
      position: insertUser.position || null,
      lastLogin: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByCode(code: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(company => company.companyCode === code);
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const company: Company = {
      ...insertCompany,
      id,
      phone: insertCompany.phone || null,
      address: insertCompany.address || null,
      industry: insertCompany.industry || null,
      subscription: insertCompany.subscription || "basic",
      maxEmployees: insertCompany.maxEmployees || 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updatedCompany = { ...company, ...updates };
    this.companies.set(id, updatedCompany);
    return updatedCompany;
  }

  async createAttendanceRecord(insertRecord: InsertAttendance): Promise<AttendanceRecord> {
    const id = this.currentAttendanceId++;
    const record: AttendanceRecord = {
      ...insertRecord,
      id,
      checkIn: insertRecord.checkIn || null,
      checkOut: insertRecord.checkOut || null,
      faceVerified: insertRecord.faceVerified || false,
      location: insertRecord.location || null,
      deviceInfo: insertRecord.deviceInfo || null,
      ipAddress: insertRecord.ipAddress || null,
      status: insertRecord.status || "present",
      notes: insertRecord.notes || null,
      approvedBy: insertRecord.approvedBy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.attendanceRecords.set(id, record);
    return record;
  }

  async getAttendanceRecords(userId: number): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.userId === userId);
  }

  async getCompanyAttendanceRecords(companyId: number): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => record.companyId === companyId);
  }

  async getAttendanceByDateRange(companyId: number, startDate: string, endDate: string): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(record => 
      record.companyId === companyId && 
      record.date >= startDate && 
      record.date <= endDate
    );
  }

  async getUserAttendanceByMonth(userId: number, year: number, month: number): Promise<AttendanceRecord[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    return Array.from(this.attendanceRecords.values()).filter(record => 
      record.userId === userId && 
      record.date >= startDate && 
      record.date <= endDate
    );
  }

  // User enterprise methods
  async getCompanyUsers(companyId: number): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.companyId === companyId);
  }

  async getUsersByDepartment(companyId: number, department: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => 
      user.companyId === companyId && user.department === department
    );
  }

  // Department methods
  async getDepartment(id: number): Promise<Department | undefined> {
    return this.departments.get(id);
  }

  async getCompanyDepartments(companyId: number): Promise<Department[]> {
    return Array.from(this.departments.values()).filter(dept => dept.companyId === companyId);
  }

  async createDepartment(insertDepartment: InsertDepartment): Promise<Department> {
    const id = this.currentDepartmentId++;
    const department: Department = {
      ...insertDepartment,
      id,
      description: insertDepartment.description || null,
      managerId: insertDepartment.managerId || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.departments.set(id, department);
    return department;
  }

  async updateDepartment(id: number, updates: Partial<Department>): Promise<Department | undefined> {
    const department = this.departments.get(id);
    if (!department) return undefined;
    
    const updatedDepartment = { ...department, ...updates, updatedAt: new Date() };
    this.departments.set(id, updatedDepartment);
    return updatedDepartment;
  }

  // Audit log methods
  async createAuditLog(insertLog: InsertAuditLog): Promise<AuditLog> {
    const id = this.currentAuditLogId++;
    const auditLog: AuditLog = {
      ...insertLog,
      id,
      userId: insertLog.userId || null,
      entityType: insertLog.entityType || null,
      entityId: insertLog.entityId || null,
      details: insertLog.details || null,
      ipAddress: insertLog.ipAddress || null,
      userAgent: insertLog.userAgent || null,
      createdAt: new Date(),
    };
    this.auditLogs.set(id, auditLog);
    return auditLog;
  }

  async getCompanyAuditLogs(companyId: number): Promise<AuditLog[]> {
    return Array.from(this.auditLogs.values()).filter(log => log.companyId === companyId);
  }

  // Company settings methods
  async getCompanySettings(companyId: number): Promise<CompanySettings | undefined> {
    return Array.from(this.companySettings.values()).find(settings => settings.companyId === companyId);
  }

  async createCompanySettings(insertSettings: InsertCompanySettings): Promise<CompanySettings> {
    const id = Math.floor(Math.random() * 1000000); // Simple ID generation
    const settings: CompanySettings = {
      ...insertSettings,
      id,
      workingHours: insertSettings.workingHours || '{"start":"09:00","end":"17:00"}',
      workingDays: insertSettings.workingDays || '["mon","tue","wed","thu","fri"]',
      timeZone: insertSettings.timeZone || "UTC",
      lateThreshold: insertSettings.lateThreshold || 15,
      requireFaceVerification: insertSettings.requireFaceVerification ?? true,
      allowManualEntry: insertSettings.allowManualEntry ?? false,
      geoFencing: insertSettings.geoFencing || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companySettings.set(id, settings);
    return settings;
  }

  async updateCompanySettings(companyId: number, updates: Partial<CompanySettings>): Promise<CompanySettings | undefined> {
    const existingSettings = Array.from(this.companySettings.values()).find(s => s.companyId === companyId);
    if (!existingSettings) return undefined;
    
    const updatedSettings = { ...existingSettings, ...updates, updatedAt: new Date() };
    this.companySettings.set(existingSettings.id, updatedSettings);
    return updatedSettings;
  }
}

export const storage = new MemStorage();
