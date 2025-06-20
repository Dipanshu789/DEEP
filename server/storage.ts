import { users, companies, attendanceRecords, type User, type InsertUser, type Company, type InsertCompany, type AttendanceRecord, type InsertAttendance } from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Company operations
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByCode(code: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  updateCompany(id: number, updates: Partial<Company>): Promise<Company | undefined>;
  
  // Attendance operations
  createAttendanceRecord(record: InsertAttendance): Promise<AttendanceRecord>;
  getAttendanceRecords(userId: number): Promise<AttendanceRecord[]>;
  getCompanyAttendanceRecords(companyId: number): Promise<AttendanceRecord[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private companies: Map<number, Company>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private currentUserId: number;
  private currentCompanyId: number;
  private currentAttendanceId: number;

  constructor() {
    this.users = new Map();
    this.companies = new Map();
    this.attendanceRecords = new Map();
    this.currentUserId = 1;
    this.currentCompanyId = 1;
    this.currentAttendanceId = 1;
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
      isRegistered: false,
      companyId: null,
      createdAt: new Date(),
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
      createdAt: new Date(),
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
      createdAt: new Date(),
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
}

export const storage = new MemStorage();
