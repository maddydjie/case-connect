import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { caseSheetRouter } from "./routes/case-sheet.routes";
import { opSheetRouter } from "./routes/op-sheet.routes";
import { emergencyRouter } from "./routes/emergency.routes";
import { followUpRouter } from "./routes/follow-up.routes";
import { templatesRouter } from "./routes/templates.routes";

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(helmet());
app.use(morgan("combined"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "doctor-service", timestamp: new Date().toISOString() });
});

app.use("/api/case-sheets", caseSheetRouter);
app.use("/api/op-sheets", opSheetRouter);
app.use("/api/emergencies", emergencyRouter);
app.use("/api/follow-ups", followUpRouter);
app.use("/api/templates", templatesRouter);

app.listen(PORT, () => {
  console.log(`Doctor Service running on port ${PORT}`);
});

export default app;
