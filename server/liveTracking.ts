import { Server as SocketIOServer } from "socket.io";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { liveLocations } from "../shared/schema";

export function setupLiveTracking(server: any) {
  const io = new SocketIOServer(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    socket.on("locationUpdate", async (data) => {
      // { userId, lat, lon, speed, name, profileImageUrl }
      console.log('[SOCKET.IO] Received locationUpdate:', data);
      try {
      // Upsert into live_locations table
      const routePoint = {
        lat: data.lat,
        lon: data.lon,
        timestamp: Date.now(),
      };
      // Fetch previous route
      const prev = await db.query.liveLocations.findFirst({
        where: eq(liveLocations.userId, data.userId),
      });
      let newRoute = [];
      if (prev && prev.route) {
        try {
          newRoute = Array.isArray(prev.route) ? prev.route : JSON.parse(prev.route as any);
        } catch { newRoute = []; }
      }
      newRoute.push(routePoint);
      if (newRoute.length > 100) newRoute = newRoute.slice(-100);
      console.log('[LIVE_TRACKING] Upserting to live_locations:', {
  userId: data.userId,
  name: data.name,
  profileImageUrl: data.profileImageUrl,
  status: data.status,
  latitude: data.lat,
  longitude: data.lon,
  speed: data.speed,
  route: newRoute,
  companyCode: data.companyCode
      });
      // Upsert using Drizzle ORM
      await db.insert(liveLocations).values({
  userId: data.userId,
  name: data.name || '',
  profileImageUrl: data.profileImageUrl || null,
  status: data.status || null,
  latitude: data.lat,
  longitude: data.lon,
  speed: data.speed || null,
  route: newRoute,
  lastUpdated: new Date(),
  companyCode: data.companyCode || null,
      }).onConflictDoUpdate({
        target: liveLocations.userId,
        set: {
          name: data.name || '',
          profileImageUrl: data.profileImageUrl || null,
          status: data.status || null,
          latitude: data.lat,
          longitude: data.lon,
          speed: data.speed || null,
          route: newRoute,
          lastUpdated: new Date(),
          companyCode: data.companyCode || null,
        },
      });
      // Broadcast all live locations to admin clients
      const all = await db.select().from(liveLocations);
      io.emit("adminLocationUpdate", all);
      } catch (err) {
        console.error('[LIVE_TRACKING] Error in locationUpdate handler:', err);
      }
    });
  });
}
