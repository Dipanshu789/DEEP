import { db } from "./db";

import { eq, and, or, desc } from "drizzle-orm";
import {
  users, companies, geofences, attendanceLogs, messages, passwordResets,
  type InsertUser, type User, type InsertCompany, type Company, type InsertGeofence, type Geofence, type InsertAttendanceLog, type AttendanceLog, type InsertMessage, type Message
} from "@shared/schema";

export class PostgresStorage {


// Export a singleton instance for use everywhere (must be outside the class definition)

  // ...existing methods...
  // Delete a remote user's live location by userId
  async deleteLiveLocationByUserId(userId: string): Promise<void> {
    const { liveLocations } = await import("../shared/schema");
    await db.delete(liveLocations).where(eq(liveLocations.userId, userId));
  }
  // Get the most recently registered company (highest id)
  async getLatestCompany(): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).orderBy(desc(companies.id)).limit(1);
    return company;
  }
  // Create a password reset token
  async createPasswordResetToken(userId: string, token: string, expiresAt: Date) {
    await db.insert(passwordResets).values({ userId, token, expiresAt }).returning();
  }

  // Get a password reset token
  async getPasswordResetToken(token: string) {
    const [row] = await db.select().from(passwordResets).where(eq(passwordResets.token, token));
    return row;
  }

  // Delete a password reset token
  async deletePasswordResetToken(token: string) {
    await db.delete(passwordResets).where(eq(passwordResets.token, token));
  }
  // Find a company by company code (for fallback in check-in)
  async getCompanyByUserCompanyCode(companyCode: string): Promise<Company | undefined> {
    const code = companyCode ? companyCode.toUpperCase() : companyCode;
    const [company] = await db.select().from(companies).where(eq(companies.companyCode, code));
    return company;
  }
  async getCompanyByUserEmail(email: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.email, email));
    return company;
  }

  // Upsert live location for a user
  async upsertLiveLocation({ userId, companyCode, latitude, longitude }: { userId: string, companyCode: string, latitude: number, longitude: number }) {
    const { liveLocations } = await import("../shared/schema");
    const latStr = latitude.toString();
    const lonStr = longitude.toString();
    // Get user's name and profile image for required fields
    const user = await db.select().from(users).where(eq(users.id, userId));
    const name = user[0]?.fullName || user[0]?.email || userId;
  const profileImageUrl = user[0]?.profileImageUrl || null;
    const existing = await db.select().from(liveLocations).where(eq(liveLocations.userId, userId));
    if (existing.length > 0) {
      await db.update(liveLocations)
        .set({ latitude: latStr, longitude: lonStr, profileImageUrl, lastUpdated: new Date() })
        .where(eq(liveLocations.userId, userId));
    } else {
      await db.insert(liveLocations).values({
        userId,
        name,
        latitude: latStr,
        longitude: lonStr,
        profileImageUrl,
        companyCode,
        lastUpdated: new Date()
      });
    }
  }
// Fetch all messages between two users (both directions)
async getMessagesBetweenUsersBothDirections(userA: string, userB: string): Promise<Message[]> {
  // Fetch messages where (senderId=userA AND to=userB) OR (senderId=userB AND to=userA)
  return db.select().from(messages)
    .where(
      or(
        and(eq(messages.senderId, userA), eq(messages.to, userB)),
        and(eq(messages.senderId, userB), eq(messages.to, userA))
      )
    )
    .orderBy(messages.timestamp);
}

  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    const camelUser = user ? this.toCamelCase(user) : undefined;
    if (camelUser && camelUser.companyCode) {
      camelUser.companyCode = camelUser.companyCode.toUpperCase();
    }
    return camelUser;
  }

  // Helper to convert snake_case keys to camelCase
  private toCamelCase(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(this.toCamelCase.bind(this));
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [
        k.replace(/_([a-z])/g, (_, c) => c.toUpperCase()),
        this.toCamelCase(v)
      ])
    );
  }

  async getUser(userId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const camelUser = user ? this.toCamelCase(user) : undefined;
    if (camelUser && camelUser.companyCode) {
      camelUser.companyCode = camelUser.companyCode.toUpperCase();
    }
    return camelUser;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    const camelUser = user ? this.toCamelCase(user) : undefined;
    if (camelUser && camelUser.companyCode) {
      camelUser.companyCode = camelUser.companyCode.toUpperCase();
    }
    return camelUser;
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(insertCompany).returning();
    return company;
  }

  async getCompanyByCode(companyCode: string): Promise<Company | undefined> {
    const code = companyCode ? companyCode.toUpperCase() : companyCode;
    const [company] = await db.select().from(companies).where(eq(companies.companyCode, code));
    return company;
  }

  async getCompanyByAdminId(adminId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.adminId, adminId));
    return company;
  }

  async createGeofence(insertGeofence: InsertGeofence): Promise<Geofence> {
    const [geofence] = await db.insert(geofences).values(insertGeofence).returning();
    return geofence;
  }

  async getGeofenceByCompanyCode(companyCode: string): Promise<Geofence | undefined> {
    const code = companyCode ? companyCode.toUpperCase() : companyCode;
    const [geofence] = await db.select().from(geofences).where(eq(geofences.companyCode, code));
    return geofence;
  }

  async createAttendanceLog(insertAttendanceLog: InsertAttendanceLog): Promise<AttendanceLog> {
    // Store checkInTime as IST string (do not convert to Date)
    let values = { ...insertAttendanceLog };
    // Ensure checkInTime is a string (IST)
    if (values.checkInTime && typeof values.checkInTime !== 'string') {
      let d;
      if ((values.checkInTime as any) instanceof Date) {
        d = values.checkInTime;
      } else {
        d = new Date(values.checkInTime);
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      values.checkInTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    if (values.checkOutTime && typeof values.checkOutTime !== 'string') {
      let d;
      if ((values.checkOutTime as any) instanceof Date) {
        d = values.checkOutTime;
      } else {
        d = new Date(values.checkOutTime);
      }
      const pad = (n: number) => n.toString().padStart(2, '0');
      values.checkOutTime = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    }
    const [log] = await db.insert(attendanceLogs).values(values).returning();
    return log;
  }

  async getTodaysAttendance(userId: string, date: string): Promise<AttendanceLog | undefined> {
    const [log] = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.userId, userId), eq(attendanceLogs.date, date)));
    return log;
  }

  async getActiveAttendance(userId: string): Promise<AttendanceLog | undefined> {
    const [log] = await db
      .select()
      .from(attendanceLogs)
      .where(and(eq(attendanceLogs.userId, userId), eq(attendanceLogs.isTracking, true)));
    return log;
  }

  async updateAttendanceLog(id: number, updates: Partial<AttendanceLog>): Promise<AttendanceLog | undefined> {
    const [log] = await db
      .update(attendanceLogs)
      .set(updates)
      .where(eq(attendanceLogs.id, id))
      .returning();
    return log;
  }

  async getAttendanceLogsByUser(userId: string): Promise<AttendanceLog[]> {
    return db.select().from(attendanceLogs).where(eq(attendanceLogs.userId, userId));
  }

  async getAttendanceLogsByCompany(companyCode: string, date?: string): Promise<AttendanceLog[]> {
    const code = companyCode ? companyCode.toUpperCase() : companyCode;
    if (date) {
      return db
        .select()
        .from(attendanceLogs)
        .where(and(eq(attendanceLogs.companyCode, code), eq(attendanceLogs.date, date)));
    }
    return db
      .select()
      .from(attendanceLogs)
      .where(eq(attendanceLogs.companyCode, code));
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    try {
      // Ensure timestamp is a JS Date object
      const payload = {
        ...insertMessage,
        timestamp: insertMessage.timestamp instanceof Date ? insertMessage.timestamp : new Date(insertMessage.timestamp)
      };
      const [msg] = await db.insert(messages).values(payload).returning();
      return msg;
    } catch (err) {
      console.error('[createMessage] DB error:', err);
      throw err;
    }
  }

  async getMessagesForChat(to: string): Promise<Message[]> {
    // Fetch messages for a user or group ("all"), sorted by timestamp
    return db.select().from(messages).where(eq(messages.to, to)).orderBy(messages.timestamp);
  }

  async getMessagesBetweenUsers(userA: string, userB: string): Promise<Message[]> {
    // Fetch messages between two users, sorted by timestamp
    return db.select().from(messages)
      .where(
        or(
          and(eq(messages.senderId, userA), eq(messages.to, userB)),
          and(eq(messages.senderId, userB), eq(messages.to, userA))
        )
      )
      .orderBy(messages.timestamp);
  }

  // Add this method to storage for the fallback logic
  async getAllUsersById(userId: string): Promise<User[]> {
    const usersList = await db.select().from(users).where(eq(users.id, userId));
    return usersList.map(this.toCamelCase.bind(this));
  }

  // Add this method to storage for debugging
  async getAllUsers(): Promise<User[]> {
    const usersList = await db.select().from(users);
    return usersList.map(this.toCamelCase.bind(this));
  }
  // Fetch users with role 'user' and matching company code
  async getUsersByCompanyCode(companyCode: string): Promise<User[]> {
    const code = companyCode ? companyCode.toUpperCase() : companyCode;
    const usersList = await db
      .select()
      .from(users)
      .where(and(eq(users.companyCode, code), or(eq(users.role, 'user'), eq(users.role, 'remote_user'))));
    return usersList.map(this.toCamelCase.bind(this));
  }
  // Create a new user in the database
  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return this.toCamelCase(user);
  }
  // Delete all user-related data: attendance logs, then user
  async deleteUser(userId: string): Promise<void> {
    // Delete attendance logs for this user
    await db.delete(attendanceLogs).where(eq(attendanceLogs.userId, userId));
    // TODO: If you have other user-related tables (e.g., face data, profile images in other tables), delete them here as well
    // Finally, delete the user
    await db.delete(users).where(eq(users.id, userId));
  }
}

export const storage = new PostgresStorage();
