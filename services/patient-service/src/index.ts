import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import patientRoutes from "./routes/patient.routes";
import healthVaultRoutes from "./routes/health-vault.routes";
import triageRoutes from "./routes/triage.routes";
import consentRoutes from "./routes/consent.routes";

const app = express();
const PORT = process.env.PORT || 3003;

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "patient-service", timestamp: new Date().toISOString() });
});

app.use("/api/patients", patientRoutes);
app.use("/api/health-vault", healthVaultRoutes);
app.use("/api/triage", triageRoutes);
app.use("/api/consent", consentRoutes);

app.listen(PORT, () => {
  console.log(`Patient service running on port ${PORT}`);
});

export default app;
