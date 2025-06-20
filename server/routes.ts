import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCompanySchema } from "@shared/schema";
import bcrypt from "bcrypt";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const companyLoginSchema = z.object({
  companyCode: z.string().min(1).transform(val => val.toUpperCase()),
  companyPassword: z.string().min(1),
});

const companyCodeSchema = z.object({
  companyCode: z.string().min(1).transform(val => val.toUpperCase()),
});

const faceDataSchema = z.object({
  faceData: z.string().min(1),
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, role } = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        role,
      });

      res.json({ id: user.id, email: user.email, role: user.role });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Invalid registration data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      res.json({ 
        id: user.id, 
        email: user.email, 
        role: user.role, 
        isRegistered: user.isRegistered,
        companyId: user.companyId
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Invalid login data" });
    }
  });

  // Face registration
  app.post("/api/face/register", async (req, res) => {
    try {
      const { userId } = req.query;
      const { faceData } = faceDataSchema.parse(req.body);
      
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const user = await storage.updateUser(Number(userId), {
        faceData,
        isRegistered: true,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "Face registered successfully", isRegistered: true });
    } catch (error) {
      console.error("Face registration error:", error);
      res.status(400).json({ message: "Face registration failed" });
    }
  });

  // Company routes
  app.post("/api/company/register", async (req, res) => {
    try {
      const companyData = insertCompanySchema.parse(req.body);
      
      // Normalize company code to uppercase
      const normalizedCompanyCode = companyData.companyCode.toUpperCase();
      
      // Check if company code already exists
      const existingCompany = await storage.getCompanyByCode(normalizedCompanyCode);
      if (existingCompany) {
        return res.status(400).json({ message: "Company code already exists" });
      }

      // Hash company password
      const hashedPassword = await bcrypt.hash(companyData.companyPassword, 10);
      
      const company = await storage.createCompany({
        ...companyData,
        companyCode: normalizedCompanyCode,
        companyPassword: hashedPassword,
      });

      // Update admin user with company ID
      await storage.updateUser(companyData.adminId, { companyId: company.id });

      res.json({ 
        id: company.id, 
        name: company.name, 
        companyCode: company.companyCode 
      });
    } catch (error) {
      console.error("Company registration error:", error);
      res.status(400).json({ message: "Company registration failed" });
    }
  });

  app.post("/api/company/login", async (req, res) => {
    try {
      const { companyCode, companyPassword } = companyLoginSchema.parse(req.body);
      
      const company = await storage.getCompanyByCode(companyCode);
      if (!company) {
        return res.status(401).json({ message: "Invalid company credentials" });
      }

      const isValidPassword = await bcrypt.compare(companyPassword, company.companyPassword);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid company credentials" });
      }

      res.json({ 
        id: company.id, 
        name: company.name, 
        companyCode: company.companyCode 
      });
    } catch (error) {
      console.error("Company login error:", error);
      res.status(400).json({ message: "Invalid company credentials" });
    }
  });

  app.post("/api/company/join", async (req, res) => {
    try {
      const { userId } = req.query;
      const { companyCode } = companyCodeSchema.parse(req.body);
      
      console.log(`Company join attempt - userId: ${userId}, companyCode: "${companyCode}"`);
      
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const company = await storage.getCompanyByCode(companyCode);
      console.log(`Company lookup result:`, company);
      
      if (!company) {
        // List all companies for debugging
        const allCompanies = Array.from((storage as any).companies.values()) as any[];
        console.log(`Available companies:`, allCompanies.map(c => ({ id: c.id, name: c.name, code: c.companyCode })));
        return res.status(404).json({ message: "Company not found" });
      }

      const user = await storage.updateUser(Number(userId), { companyId: company.id });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ 
        message: "Successfully joined company",
        company: { id: company.id, name: company.name }
      });
    } catch (error) {
      console.error("Company join error:", error);
      res.status(400).json({ message: "Failed to join company" });
    }
  });

  // Generate company code
  app.get("/api/company/generate-code", (req, res) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    res.json({ code });
  });

  // Enterprise API endpoints for dashboards
  
  // Get company employees
  app.get("/api/company/employees/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const employees = await storage.getCompanyUsers(Number(companyId));
      res.json(employees);
    } catch (error) {
      console.error("Error fetching employees:", error);
      res.status(500).json({ message: "Failed to fetch employees" });
    }
  });

  // Get company departments
  app.get("/api/company/departments/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const departments = await storage.getCompanyDepartments(Number(companyId));
      res.json(departments);
    } catch (error) {
      console.error("Error fetching departments:", error);
      res.status(500).json({ message: "Failed to fetch departments" });
    }
  });

  // Get user attendance records
  app.get("/api/attendance/user/:userId", async (req, res) => {
    try {
      const { userId } = req.params;
      const records = await storage.getAttendanceRecords(Number(userId));
      res.json(records);
    } catch (error) {
      console.error("Error fetching attendance records:", error);
      res.status(500).json({ message: "Failed to fetch attendance records" });
    }
  });

  // Get company settings
  app.get("/api/company/settings/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      let settings = await storage.getCompanySettings(Number(companyId));
      
      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createCompanySettings({
          companyId: Number(companyId),
        });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Error fetching company settings:", error);
      res.status(500).json({ message: "Failed to fetch company settings" });
    }
  });

  // Check-in endpoint
  app.post("/api/attendance/check-in", async (req, res) => {
    try {
      const { userId, companyId, date, location, deviceInfo, ipAddress } = req.body;
      
      const record = await storage.createAttendanceRecord({
        userId,
        companyId,
        date,
        checkIn: new Date(),
        faceVerified: true, // In real app, this would be verified
        location,
        deviceInfo,
        ipAddress,
        status: "present",
      });

      // Create audit log
      await storage.createAuditLog({
        userId,
        companyId,
        action: "check_in",
        entityType: "attendance",
        entityId: record.id,
        details: JSON.stringify({ location, deviceInfo }),
        ipAddress,
        userAgent: deviceInfo,
      });

      res.json(record);
    } catch (error) {
      console.error("Check-in error:", error);
      res.status(500).json({ message: "Check-in failed" });
    }
  });

  // Check-out endpoint
  app.post("/api/attendance/check-out", async (req, res) => {
    try {
      const { attendanceId } = req.body;
      
      // Update attendance record (simplified - in real implementation would update existing record)
      res.json({ message: "Check-out successful" });
    } catch (error) {
      console.error("Check-out error:", error);
      res.status(500).json({ message: "Check-out failed" });
    }
  });

  // Get attendance analytics
  app.get("/api/analytics/attendance/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const { range = "today" } = req.query;
      
      const today = new Date().toISOString().split('T')[0];
      const records = await storage.getCompanyAttendanceRecords(Number(companyId));
      
      const todayRecords = records.filter(r => r.date === today);
      const presentToday = todayRecords.length;
      
      res.json({
        presentToday,
        totalRecords: records.length,
        todayRecords,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      res.status(500).json({ message: "Failed to fetch analytics" });
    }
  });

  // Get audit logs
  app.get("/api/audit/logs/:companyId", async (req, res) => {
    try {
      const { companyId } = req.params;
      const logs = await storage.getCompanyAuditLogs(Number(companyId));
      res.json(logs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
