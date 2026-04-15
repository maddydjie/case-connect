import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { analyticsRouter } from "./routes/analytics.routes.js";

const app = express();
const PORT = process.env.PORT || 3005;

app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "analytics-service", timestamp: new Date().toISOString() });
});

app.use("/api/analytics", analyticsRouter);

app.listen(PORT, () => {
  console.log(`Analytics Service running on port ${PORT}`);
});

export default app;
