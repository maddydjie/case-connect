import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createServer } from "http";
import { Server } from "socket.io";
import { initSocketIO } from "./lib/socket.js";
import { bedRouter } from "./routes/bed.routes.js";
import { documentRouter } from "./routes/document.routes.js";
import { appointmentRouter } from "./routes/appointment.routes.js";
import { scheduleRouter } from "./routes/schedule.routes.js";

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "hms-service", timestamp: new Date().toISOString() });
});

app.use("/api/beds", bedRouter);
app.use("/api/documents", documentRouter);
app.use("/api/appointments", appointmentRouter);
app.use("/api/schedules", scheduleRouter);

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

initSocketIO(io);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join:hospital", (hospitalId: string) => {
    socket.join(`hospital:${hospitalId}`);
    console.log(`Socket ${socket.id} joined hospital:${hospitalId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, () => {
  console.log(`HMS Service running on port ${PORT}`);
});

export default app;
