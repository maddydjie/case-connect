import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { caseTutorRouter } from "./routes/case-tutor.routes";
import { learningRouter } from "./routes/learning.routes";
import { leaderboardRouter } from "./routes/leaderboard.routes";

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "student-service", timestamp: new Date().toISOString() });
});

app.use("/api/case-tutor", caseTutorRouter);
app.use("/api/learning", learningRouter);
app.use("/api/leaderboard", leaderboardRouter);

app.listen(PORT, () => {
  console.log(`Student Service running on port ${PORT}`);
});

export default app;
