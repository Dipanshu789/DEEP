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
  companyCode: z.string().min(1),
  companyPassword: z.string().min(1),
});

const companyCodeSchema = z.object({
  companyCode: z.string().min(1),
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
      
      // Check if company code already exists
      const existingCompany = await storage.getCompanyByCode(companyData.companyCode);
      if (existingCompany) {
        return res.status(400).json({ message: "Company code already exists" });
      }

      // Hash company password
      const hashedPassword = await bcrypt.hash(companyData.companyPassword, 10);
      
      const company = await storage.createCompany({
        ...companyData,
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
      
      if (!userId || isNaN(Number(userId))) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const company = await storage.getCompanyByCode(companyCode);
      if (!company) {
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

  const httpServer = createServer(app);
  return httpServer;
}
