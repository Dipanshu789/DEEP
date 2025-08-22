// Simulated real-time location backend for MVP
import express from "express";
const router = express.Router();

// Simulate a remote_user moving along a route
let simulatedLat = 28.6139;
let simulatedLng = 77.209;
let direction = 1;

setInterval(() => {
  // Move the simulated user east/west
  simulatedLng += direction * 0.0005;
  if (simulatedLng > 77.215) direction = -1;
  if (simulatedLng < 77.205) direction = 1;
}, 2000); // Update every 2 seconds

router.get("/api/simulated-location", (req, res) => {
  res.json({
    userId: "simulated-remote-user",
    fullName: "Simulated Rider",
    lat: simulatedLat,
    lng: simulatedLng,
    profileImageUrl: ""
  });
});

export default router;
