import { Server } from "socket.io";

let io: Server;

export function initSocketIO(server: Server): void {
  io = server;
}

export function getIO(): Server {
  if (!io) {
    throw new Error("Socket.io not initialized. Call initSocketIO first.");
  }
  return io;
}

export function emitBedUpdate(hospitalId: string, data: Record<string, unknown>): void {
  getIO().to(`hospital:${hospitalId}`).emit("bed:updated", data);
}

export function emitDocumentUpdate(
  hospitalId: string,
  event: "document:uploaded" | "document:validated" | "document:delivered",
  data: Record<string, unknown>
): void {
  getIO().to(`hospital:${hospitalId}`).emit(event, data);
}
