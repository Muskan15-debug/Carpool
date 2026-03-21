const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");
const { createAdapter } = require("@socket.io/redis-adapter");
const Redis = require("ioredis");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Redis setup for horizontally scaled instances bridging WebSocket connections
  if (process.env.REDIS_URL) {
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    
    pubClient.on("error", (err) => console.error("Redis pubClient error:", err.message));
    subClient.on("error", (err) => console.error("Redis subClient error:", err.message));

    io.adapter(createAdapter(pubClient, subClient));
    console.log("Socket.io: Redis Adapter attached for scaling.");
  } else {
    // Development local redis fallback or local test Mode
    console.log("Socket.io: Running without Redis Adapter (REDIS_URL not set).");
  }

  // Socket State Machine Actions
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Authentication could be done via middleware observing standard NextAuth / Clerk tokens
    // but for now, we rely on event-based rooms.
    socket.on("join-ride", (rideId) => {
      socket.join(`ride_${rideId}`);
      console.log(`Socket ${socket.id} joined ride_${rideId}`);
    });

    // Real-time Ride Experience (Pillar 3)
    socket.on("update-location", (data) => {
      // payload data must contain: rideId, lat, lng, and potentially driverId
      // Auto-broadcast location to the ride room
      socket.to(`ride_${data.rideId}`).emit("ride:location_update", data);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

  httpServer
    .once("error", (err) => {
      console.error("Server execution error:", err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Custom Next.js server ready on http://${hostname}:${port}`);
    });
});
