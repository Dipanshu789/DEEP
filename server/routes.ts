// (Removed invalid top-level app.get calls. All route definitions must be inside registerRoutes.)
  // (Removed duplicate top-level route definitions for /api/user/:id)
  // These routes are already defined inside registerRoutes(app)

import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { Server as SocketIOServer } from "socket.io";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { z } from "zod";
import {
  insertUserSchema,
  insertCompanySchema,
  insertGeofenceSchema,
  insertAttendanceLogSchema,
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { users } from "@shared/schema"; // Add this import for the users table

const geofenceInputSchema = insertGeofenceSchema.extend({
  altitude: z.union([z.string(), z.number()]).transform((val) => String(val)).optional(),
});





import express from 'express';

export async function registerRoutes(app: Express): Promise<Server> {
  // --- Socket.IO setup ---
  let io: SocketIOServer | null = null;
  if (!app.locals.io) {
    const httpServer = createServer(app);
    io = new SocketIOServer(httpServer, {
      cors: { origin: "*" }
    });
    app.locals.io = io;
    // Listen for connections
    io.on("connection", (socket) => {
      console.log("Socket.IO client connected:", socket.id);
    });
    // Return httpServer at end of function
  } else {
    io = app.locals.io;
  }
  // Get user details by ID (legacy)
  app.get('/api/user/:id', async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      let createdAt: string | null = null;
      if (user.createdAt) {
        if (typeof user.createdAt === 'string') {
          createdAt = user.createdAt;
        } else if (user.createdAt instanceof Date) {
          const pad = (n: number, z = 2) => ('00' + n).slice(-z);
          const y = user.createdAt.getFullYear();
          const m = pad(user.createdAt.getMonth() + 1);
          const d = pad(user.createdAt.getDate());
          const h = pad(user.createdAt.getHours());
          const min = pad(user.createdAt.getMinutes());
          const s = pad(user.createdAt.getSeconds());
          const ms = (user.createdAt.getMilliseconds() / 1000).toFixed(6).slice(2, 8);
          createdAt = `${y}-${m}-${d} ${h}:${min}:${s}.${ms}`;
        } else if (typeof user.createdAt === 'object' && user.createdAt !== null) {
          if ('value' in user.createdAt && typeof (user.createdAt as { value?: unknown }).value === 'string') {
            createdAt = (user.createdAt as { value: string }).value;
          } else {
            try {
              const maybeObj = JSON.parse(JSON.stringify(user.createdAt));
              if (maybeObj && typeof maybeObj.value === 'string') {
                createdAt = maybeObj.value;
              } else {
                createdAt = null;
              }
            } catch {
              createdAt = null;
            }
          }
        } else {
          createdAt = null;
        }
      }
      res.json({
        id: user.id,
        fullName: user.fullName || '',
        email: user.email || '',
        createdAt
      });
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user' });
    }
  });

  // New: Get user details by query param (for dashboard header)
  app.get('/api/user/details', async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) return res.status(400).json({ message: 'Missing userId' });
      // Use storage method to get user details by ID
      const user = await storage.getUser(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      res.json({
        id: user.id,
        fullName: user.fullName || '',
        email: user.email || '',
      });
    } catch (error) {
      console.error('Error fetching user details:', error);
      res.status(500).json({ message: 'Failed to fetch user details' });
    }
  });

  // Delete user by ID
  app.delete('/api/user/:id', async (req: Request, res: Response) => {
    try {
      const user = await storage.getUser(req.params.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
      // Delete all user-related data (attendance logs, etc.)
      await storage.deleteUser(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ message: 'Failed to delete user' });
    }
  });
  // Profile image upload endpoint (store image in Neon DB)
  app.post('/api/profile-image/upload', async (req: any, res) => {
    try {
      const userId = req.body.userId;
      const imageData = req.body.imageData; // Expect base64 string or binary
      if (!userId || !imageData) {
        return res.status(400).json({ message: 'Missing userId or image data.' });
      }
      // Store image data in DB (as base64 string or Buffer)
      await storage.updateUserProfile(userId, { profileImageUrl: imageData });
      res.json({ success: true });
    } catch (error) {
      console.error('Error uploading profile image:', error);
      res.status(500).json({ message: 'Failed to upload profile image.' });
    }
  });

  // Profile image retrieval endpoint (serve from Neon DB)
  app.get('/api/profile-image', async (req: any, res) => {
    try {
      const userId = req.query.userId;
      if (!userId) return res.status(400).json({ message: 'Missing userId.' });
      const user = await storage.getUser(userId);
      if (!user || !user.profileImageUrl) return res.json({ url: null });
      // Return as data URL (assume PNG)
      const dataUrl = `data:image/png;base64,${user.profileImageUrl}`;
      res.json({ url: dataUrl });
    } catch (error) {
      console.error('Error fetching profile image:', error);
      res.status(500).json({ message: 'Failed to fetch profile image.' });
    }
  });
  // Profile image static serving is no longer needed
  // Auth middleware removed

  // Auth routes (no authentication)
  app.get('/api/auth/user', async (req: any, res) => {
    try {
      console.log('[AUTH] Session at /api/auth/user:', req.session);
      const userId = req.session.userId;
      if (!userId) return res.status(401).json({ message: "Not logged in" });
      const user = await storage.getUser(userId);
      if (!user) return res.status(401).json({ message: "User not found" });
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  app.post('/api/login', async (req: any, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      // Compare password
      if (!user.passwordHash) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      // Set session userId
      req.session.userId = user.id;
      console.log('[LOGIN] Session after setting userId:', req.session);
      // Return user info (omit passwordHash)
      const { passwordHash, ...userInfo } = user;
      res.json(userInfo);
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Failed to log in" });
    }
  });

  // User profile routes
  app.put('/api/user/profile', async (req: any, res) => {
    try {
      const userId = req.query.userId || req.body.userId || "demo-user";
      const { fullName } = req.body;
      if (!userId || !fullName) {
        return res.status(400).json({ message: "Missing userId or fullName." });
      }
      // Update fullName in users table
      const user = await storage.updateUserProfile(userId, { fullName });
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      res.json({ ...user, fullName });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  app.post('/api/user/face-data', async (req: any, res) => {
    try {
      console.log('Request body:', req.body);
      console.log('Request query:', req.query);
      console.log('Request headers:', req.headers);
      // Accept userId from body, query, headers, or session (if available)
      const userId = req.body.userId || req.query.userId || req.headers['x-user-id'] || (req.user && req.user.id);
      if (!userId) {
        console.error('Missing userId in request for face data update');
        return res.status(400).json({ message: "Missing userId for face data update. Please provide userId in the request body, query string, or x-user-id header." });
      }
      const { faceData, faceDescriptor, role } = req.body;
      console.log('Received face data update:', { userId, faceData, faceDescriptor, role });
      const user = await storage.updateUserProfile(userId, { 
        faceData, 
        faceDescriptor: faceDescriptor ? JSON.stringify(faceDescriptor) : null,
        role,
        updatedAt: new Date()
      });
      if (!user) {
        console.error(`User with id '${userId}' not found during face data update`);
        return res.status(404).json({ message: `User with id '${userId}' not found` });
      }
      // Fetch user again to confirm faceData is stored
      const userFromDb = await storage.getUser(userId);
      console.log('User after face data update (from DB):', userFromDb);
      res.json(userFromDb);
    } catch (error) {
      console.error("Error saving face data:", error);
      res.status(500).json({ message: "Failed to save face data", error: (error instanceof Error ? error.message : String(error)) });
    }
  });

  // User signup route (add logging)
  app.post('/api/user/signup', async (req: any, res) => {
    try {
      let userData = req.body;
      console.log('Signup request body:', userData);
      // Auto-generate a UUID if id is missing
      if (!userData.id) {
        userData.id = uuidv4();
      }
      // Ensure userId is always present after signup
      const userId = userData.id;
      // Hash the password from the plain password field
      if (userData.password) {
        userData.passwordHash = await bcrypt.hash(userData.password, 10);
        delete userData.password;
      }
      // Map fullName to full_name for DB
      if (userData.fullName) {
        userData.full_name = userData.fullName;
        delete userData.fullName;
      }
      // Do not require or set companyCode at signup; it will be set in join-company flow
      // Validate user data (after mapping fields)
      userData = insertUserSchema.safeParse(userData);
      if (!userData.success) {
        return res.status(400).json({ message: "Invalid signup data.", errors: userData.error.errors });
      }
      const userToInsert = userData.data;
      console.log('[SIGNUP] Final userData to insert:', userToInsert);
      const user = await storage.createUser(userToInsert);
      // Do not check for companyCode at signup; allow user creation without it
      const userFromDb = await storage.getUser(user.id);
      console.log('[SIGNUP] Created user:', userFromDb);
      // Always return userId in response
      res.json({ ...userFromDb, userId });
    } catch (error) {
      console.error("Error signing up user:", error);
      res.status(500).json({ message: "Failed to sign up user", error: (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Test endpoint: create user and set face data in one step
  app.post('/api/user/signup-with-face', async (req: any, res) => {
    try {
      const { email, fullName, role, passwordHash, faceData } = req.body;
      if (!email || !fullName || !role || !passwordHash) {
        return res.status(400).json({ message: "Missing required fields: email, fullName, role, passwordHash" });
      }
      // Auto-generate a UUID for id
      const id = uuidv4();
      const user = await storage.createUser({
        id,
        email,
        fullName,
        role,
        passwordHash,
        faceData: faceData || null,
      });
      // Fetch user again to confirm faceData is stored
      const userFromDb = await storage.getUser(id);
      console.log('User after signup-with-face (from DB):', userFromDb);
      res.json(userFromDb);
    } catch (error) {
      console.error("Error in signup-with-face:", error);
      res.status(500).json({ message: "Failed to sign up user with face data", error: (error instanceof Error ? error.message : String(error)) });
    }
  });

  // Company routes
  app.post('/api/company', async (req: any, res) => {
    try {
      // const adminId = req.user.claims.sub;
      const adminId = req.query.userId || req.body.userId || "demo-admin";
      // Add adminId to the request body before parsing
      const requestData = {
        ...req.body,
        adminId,
      };
      const companyData = insertCompanySchema.parse(requestData);
      // Hash the company password
      const passwordHash = await bcrypt.hash(companyData.passwordHash, 10);
      const company = await storage.createCompany({
        ...companyData,
        passwordHash,
      });
      res.json(company);
    } catch (error) {
      console.error("Error creating company:", error);
      res.status(500).json({ message: "Failed to create company" });
    }
  });

  app.get('/api/company/:code', async (req, res) => {
    try {
      const company = await storage.getCompanyByCode(req.params.code);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      // Fetch admin user details
      let admin = null;
      if (company.adminId) {
        admin = await storage.getUser(company.adminId);
      }
      res.json({
        ...company,
        admin: admin
          ? {
              id: admin.id,
              name: admin.fullName || admin.email || null,
              email: admin.email || null,
              profileImageUrl: admin.profileImageUrl || null
            }
          : null
      });
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.get('/api/company/admin/me', async (req: any, res) => {
    try {
      // const adminId = req.user.claims.sub;
      const adminId = req.query.userId || req.body.userId || "demo-admin";
      const company = await storage.getCompanyByAdminId(adminId);
      res.json(company);
    } catch (error) {
      console.error("Error fetching admin company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/company/join', async (req: any, res: Response) => {
    try {
      // const userId = req.user.claims.sub;
      const userId = req.query.userId || req.body.userId;
      if (!userId) {
        return res.status(400).json({ message: "User ID is missing. Please sign up first." });
      }
      let { companyCode } = req.body;
      if (!companyCode) {
        return res.status(400).json({ message: "Company code is required." });
      }
      companyCode = companyCode.toUpperCase();
      const company = await storage.getCompanyByCode(companyCode);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const user = await storage.updateUserProfile(userId, { companyCode });
      // Extra confirmation: fetch user again to verify companyCode is saved
      const updatedUser = await storage.getUser(userId);
      if (!updatedUser?.companyCode || updatedUser.companyCode !== companyCode) {
        console.error(`[JOIN COMPANY] Failed to save companyCode for user ${userId}. Expected: ${companyCode}, Got: ${updatedUser?.companyCode}`);
        return res.status(500).json({ message: "Failed to save company code to user profile. Please try again or contact support." });
      }
      res.json({ user: updatedUser, company });
    } catch (error) {
      console.error("Error joining company:", error);
      res.status(500).json({ message: "Failed to join company" });
    }
  });

  // Geofence routes
  // Team page: Get users by company code (role 'user')
  app.get('/api/company/:companyCode/users', async (req, res) => {
    try {
      const companyCode = req.params.companyCode;
      if (!companyCode) {
        return res.status(400).json({ message: "Company code is required." });
      }
      const users = await storage.getUsersByCompanyCode(companyCode);
      // Support both fullName and full_name for name, and include profileImageUrl
      const filtered = users.map(u => {
        let profileImageUrl = u.profileImageUrl || null;
        if (profileImageUrl && typeof profileImageUrl === 'string' && !profileImageUrl.startsWith('data:')) {
          // Assume PNG if not already a data URL
          profileImageUrl = `data:image/png;base64,${profileImageUrl}`;
        }
        return {
          id: u.id,
          name: u.fullName || '',
          email: u.email,
          companyCode: u.companyCode,
          profileImageUrl
        };
      });
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching users by company code:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });
  app.post('/api/geofence', async (req: any, res) => {
    try {
      console.log('Incoming geofence request body:', req.body);
      const adminId = req.query.userId || req.body.userId || "demo-admin";
      const geofenceData = {
        ...req.body,
        adminId,
      };
      console.log('Parsed geofence data to validate:', geofenceData);
      const parsed = geofenceInputSchema.parse(geofenceData);
      const geofence = await storage.createGeofence(parsed);
      res.json(geofence);
    } catch (error: any) {
      console.error("Error creating geofence:", error);
      res.status(500).json({ message: "Failed to create geofence", error: error?.message || error, full: error });
    }
  });

  app.get('/api/geofence/:companyCode', async (req, res) => {
    try {
      const geofence = await storage.getGeofenceByCompanyCode(req.params.companyCode);
      res.json(geofence);
    } catch (error) {
      console.error("Error fetching geofence:", error);
      res.status(500).json({ message: "Failed to fetch geofence" });
    }
  });

  // Attendance routes
  app.post('/api/attendance/checkin', async (req: any, res) => {
    try {
      // Accept userId from body, query, or session
      const userId = req.body.userId || req.query.userId || (req.session && req.session.userId);
      if (!userId) {
        return res.status(400).json({ message: "Missing userId for check-in." });
      }
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found." });
      }
      if (user.role === 'admin') {
        return res.status(403).json({ message: "Admins are not allowed to check in." });
      }
      if (!user.companyCode) {
        return res.status(400).json({ message: "User not associated with any company." });
      }
      const today = new Date().toISOString().split('T')[0];
      const existingLog = await storage.getTodaysAttendance(user.id, today);
      if (existingLog && existingLog.checkInTime) {
        return res.status(400).json({ message: "Already checked in today." });
      }
      const { latitude, longitude, faceData, faceDescriptor } = req.body;

      // --- Step 1: Face Verification ---
      if (!user.faceDescriptor || !faceDescriptor) {
        return res.status(400).json({ message: "Face verification failed: missing descriptor" });
      }
      let storedDescriptor, newDescriptor;
      try {
        storedDescriptor = JSON.parse(user.faceDescriptor);
        newDescriptor = Array.isArray(faceDescriptor) ? faceDescriptor : JSON.parse(faceDescriptor);
      } catch (e) {
        return res.status(400).json({ message: "Face descriptor format error" });
      }
      // Euclidean distance
      const euclidean = (a: number[], b: number[]) => {
        if (!a || !b || a.length !== b.length) return Infinity;
        return Math.sqrt(a.reduce((sum, v, i) => sum + Math.pow(v - b[i], 2), 0));
      };
      const distance = euclidean(storedDescriptor, newDescriptor);
      if (distance > 0.7) {
        return res.status(400).json({ message: `Face verification failed: distance ${distance.toFixed(3)}` });
      }

      // --- Step 2: Geofence Check ---
      const geofence = await storage.getGeofenceByCompanyCode(user.companyCode);
      if (geofence) {
        // Calculate distance from geofence center
        const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const toRad = (v: number) => (v * Math.PI) / 180;
          const R = 6371000; // meters
          const dLat = toRad(lat2 - lat1);
          const dLon = toRad(lon2 - lon1);
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return R * c;
        };
        const userLat = parseFloat(latitude);
        const userLon = parseFloat(longitude);
        const fenceLat = parseFloat(geofence.latitude);
        const fenceLon = parseFloat(geofence.longitude);
        const radius = geofence.radius || 100;
        const dist = haversine(userLat, userLon, fenceLat, fenceLon);
        if (dist > radius) {
          return res.status(400).json({ message: `Geofence check failed: outside allowed area (${dist.toFixed(1)}m > ${radius}m)` });
        }
      }

      // --- Step 3: Tracking ---
      // Store check-in time as IST
      const now = new Date();
      const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
      const istOffset = 5.5 * 60 * 60 * 1000;
      const istDate = new Date(utc + istOffset);
      const attendanceLog = await storage.createAttendanceLog({
        userId: user.id,
        companyCode: user.companyCode,
        date: today,
        checkInTime: istDate,
        checkInLat: latitude,
        checkInLon: longitude,
        isTracking: true,
        status: "present",
      });
      if (io) {
        io.emit("attendanceUpdated", {
          userId: user.id,
          companyCode: user.companyCode,
          date: today,
          attendanceLog,
        });
      }
      res.json(attendanceLog);
    } catch (error) {
      console.error("Error checking in:", error);
      res.status(500).json({ message: "Failed to check in" });
    }
  });

  app.post('/api/attendance/checkout', async (req: any, res) => {
    try {
      // Accept userId from body, query, or session
      const userId = req.body.userId || req.query.userId || (req.session && req.session.userId);
      if (!userId) {
        return res.status(400).json({ message: "Missing userId for checkout." });
      }
      const today = new Date().toISOString().split('T')[0];
      const log = await storage.getTodaysAttendance(userId, today);
      if (!log || !log.checkInTime) {
        return res.status(400).json({ message: "No active check-in found for today." });
      }
      if (log.checkOutTime) {
        return res.status(400).json({ message: "Already checked out today." });
      }
      const { latitude, longitude, hoursWorked } = req.body;
      // Calculate workedMs
      let workedMs = 0;
      if (log.checkInTime) {
        workedMs = Date.now() - new Date(log.checkInTime).getTime();
      }
      // Use frontend provided hoursWorked if available and valid
      let hoursWorkedStr = hoursWorked;
      if (!hoursWorkedStr || typeof hoursWorkedStr !== 'string' || !/\d/.test(hoursWorkedStr)) {
        const h = Math.floor(workedMs / (1000 * 60 * 60));
        const m = Math.floor((workedMs / (1000 * 60)) % 60);
        hoursWorkedStr = `${h}h ${m}m`;
      }
      // Update attendance log
      const checkOutTime = new Date();
      const updatedLog = await storage.updateAttendanceLog(log.id, {
        checkOutTime,
        checkOutLat: latitude,
        checkOutLon: longitude,
        isTracking: false,
        hoursWorked: hoursWorkedStr,
        status: "complete",
      });
      if (!updatedLog) {
        return res.status(500).json({ message: "Failed to update attendance log" });
      }
      if (io) {
        const user = await storage.getUser(userId);
        const companyCode = user?.companyCode || null;
        io.emit("attendanceUpdated", {
          userId,
          companyCode,
          date: updatedLog.date,
          attendanceLog: updatedLog,
        });
      }
      res.json(updatedLog);
    } catch (error) {
      console.error("Error checking out:", error);
      res.status(500).json({ message: "Failed to check out" });
    }
  });


  // Helper to convert a Date or string to IST string (YYYY-MM-DD HH:mm:ss)
  function toISTString(date: Date | string | null | undefined) {
    if (!date) return null;
    let d = typeof date === 'string' ? new Date(date) : date;
    if (!(d instanceof Date) || isNaN(d.getTime())) return null;
    // Convert to IST
    const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(utc + istOffset);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${istDate.getFullYear()}-${pad(istDate.getMonth() + 1)}-${pad(istDate.getDate())} ${pad(istDate.getHours())}:${pad(istDate.getMinutes())}:${pad(istDate.getSeconds())}`;
  }

  // Format attendance log(s) to ensure all times are in IST string format
  function formatAttendanceLog(log: any) {
    if (!log) return log;
    return {
      ...log,
      checkInTime: toISTString(log.checkInTime),
      checkOutTime: toISTString(log.checkOutTime),
      createdAt: toISTString(log.createdAt),
      updatedAt: toISTString(log.updatedAt),
    };
  }

  app.get('/api/attendance/user/:userId', async (req, res) => {
    try {
      const logs = await storage.getAttendanceLogsByUser(req.params.userId);
      res.json(logs.map(formatAttendanceLog));
    } catch (error) {
      console.error("Error fetching user attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  app.get('/api/attendance/company/:companyCode', async (req, res) => {
    try {
      const { date } = req.query;
      const logs = await storage.getAttendanceLogsByCompany(
        req.params.companyCode, 
        date as string
      );
      res.json(logs.map(formatAttendanceLog));
    } catch (error) {
      console.error("Error fetching company attendance:", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });


  app.get('/api/attendance/today', async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub;
      const userId = req.query.userId || req.body.userId || "demo-user";
      const today = new Date().toISOString().split('T')[0];
      const log = await storage.getTodaysAttendance(userId, today);
      res.json(formatAttendanceLog(log));
    } catch (error) {
      console.error("Error fetching today's attendance:", error);
      res.status(500).json({ message: "Failed to fetch today's attendance" });
    }
  });


  app.get('/api/attendance/active', async (req: any, res) => {
    try {
      // const userId = req.user.claims.sub;
      const userId = req.query.userId || req.body.userId || "demo-user";
      const log = await storage.getActiveAttendance(userId);
      res.json(formatAttendanceLog(log));
    } catch (error) {
      console.error("Error fetching active attendance:", error);
      res.status(500).json({ message: "Failed to fetch active attendance" });
    }
  });

  // Logout route: destroy session and return JSON (frontend will handle redirect)
  app.get('/api/logout', (req, res) => {
    req.session.destroy(() => {
      res.clearCookie('connect.sid', { path: '/', httpOnly: true, sameSite: 'lax' });
      res.status(200).json({ message: 'Logged out' });
    });
  });

  // Query param version for user attendance (for frontend consistency)

  app.get('/api/attendance/user', async (req: Request, res: Response) => {
    try {
      const userIdRaw = req.query.userId;
      if (!userIdRaw) return res.status(400).json({ message: 'Missing userId' });
      const userId = Array.isArray(userIdRaw) ? userIdRaw[0] : String(userIdRaw);
      // Always return only today's log for the user
      const today = new Date().toISOString().split('T')[0];
      const log = await storage.getTodaysAttendance(String(userId), today);
      res.json(log ? [formatAttendanceLog(log)] : []);
    } catch (error) {
      console.error("Error fetching user attendance (query):", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Query param version for company attendance (for frontend consistency)

  app.get('/api/attendance/company', async (req: Request, res: Response) => {
    try {
      const companyCodeRaw = req.query.companyCode;
      if (!companyCodeRaw) return res.status(400).json({ message: 'Missing companyCode' });
      const companyCode = Array.isArray(companyCodeRaw) ? String(companyCodeRaw[0]) : String(companyCodeRaw);
      // Always return only today's logs for the company
      const today = new Date().toISOString().split('T')[0];
      const logs = await storage.getAttendanceLogsByCompany(companyCode, today);
      res.json(logs.map(formatAttendanceLog));
    } catch (error) {
      console.error("Error fetching company attendance (query):", error);
      res.status(500).json({ message: "Failed to fetch attendance" });
    }
  });

  // Export all attendance logs for a company as CSV
  app.get('/api/attendance/company/export', async (req: Request, res: Response) => {
    try {
      const companyCodeRaw = req.query.companyCode;
      if (!companyCodeRaw) return res.status(400).json({ message: 'Missing companyCode' });
      const companyCode = Array.isArray(companyCodeRaw) ? String(companyCodeRaw[0]) : String(companyCodeRaw);
      // Get all logs for the company (all dates)
      const logs = await storage.getAttendanceLogsByCompany(companyCode);
      // CSV headers for all fields
      const csvHeaders = [
        'ID', 'User ID', 'Company Code', 'Date', 'Check In', 'Check Out', 'Check In Lat', 'Check In Lng', 'Check Out Lat', 'Check Out Lng', 'Hours Worked', 'Status', 'Created At'
      ];
      const csvRows = logs.map(log => [
        log.id,
        log.userId,
        log.companyCode,
        log.date,
        log.checkInTime || '',
        log.checkOutTime || '',
        log.checkInLat || '',
        log.checkInLon || '',
        log.checkOutLat || '',
        log.checkOutLon || '',
        log.hoursWorked || '',
        log.status || '',
        log.createdAt || ''
      ]);
      let csv = csvHeaders.join(',') + '\n';
      csv += csvRows.map(row => row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="attendance_logs_${companyCode}.csv"`);
      res.send(csv);
    } catch (error) {
      console.error("Error exporting attendance logs:", error);
      res.status(500).json({ message: "Failed to export attendance logs" });
    }
  });

  // --- Messaging endpoints ---
  // Fetch messages for a chat (user or group)
  app.get('/api/messages', async (req, res) => {
    try {
      const { to, from } = req.query;
      if (!to) return res.status(400).json({ message: "Missing 'to' parameter" });
      let messages;
      if (from) {
        // Fetch messages between two users (both directions)
        messages = await storage.getMessagesBetweenUsers(String(from), String(to));
      } else {
        // Fetch all messages for a chat (user or group)
        messages = await storage.getMessagesForChat(String(to));
      }
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Send a message
  app.post('/api/messages', async (req, res) => {
    try {
      let { senderId, senderName, senderProfileImageUrl, message, to } = req.body;
      if (!senderId || !senderName || !message || !to) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      // If to is "admin" (string), resolve to real admin ID for user's company
      if (to === "admin") {
        // Try to get sender's user info
        const senderUser = await storage.getUser(senderId);
        if (senderUser && senderUser.companyCode) {
          // Find admin for this company
          const company = await storage.getCompanyByCode(senderUser.companyCode);
          if (company && company.adminId) {
            to = company.adminId;
          }
        }
      }
      const timestamp = new Date();
      const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now();
      const msg = await storage.createMessage({
        id,
        senderId,
        senderName,
        senderProfileImageUrl,
        message,
        to,
        timestamp,
      });
      res.json(msg);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  const httpServer = createServer(app);
  // Only return httpServer if we created it above
  return app.locals.io ? app.locals.io.httpServer : httpServer;
}
