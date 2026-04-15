import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { createProxyMiddleware, Options } from "http-proxy-middleware";
import client from "prom-client";

const app = express();
const PORT = process.env.PORT || 3000;

const SERVICE_URLS: Record<string, string> = {
  "doctor-service": process.env.DOCTOR_SERVICE_URL || "http://doctor-service:3001",
  "hms-service": process.env.HMS_SERVICE_URL || "http://hms-service:3002",
  "patient-service": process.env.PATIENT_SERVICE_URL || "http://patient-service:3003",
  "student-service": process.env.STUDENT_SERVICE_URL || "http://student-service:3004",
  "analytics-service": process.env.ANALYTICS_SERVICE_URL || "http://analytics-service:3005",
  "voice-ai": process.env.VOICE_AI_URL || "http://voice-ai:8100",
};

// Prometheus metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

const httpRequestDuration = new client.Histogram({
  name: "http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route"] as const,
  buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

const httpErrorCounter = new client.Counter({
  name: "http_errors_total",
  help: "Total number of HTTP errors",
  labelNames: ["method", "route", "status_code"] as const,
  registers: [register],
});

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan("combined"));
app.use(express.json());

// Metrics collection middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route?.path || req.path;

    httpRequestCounter.inc({
      method: req.method,
      route,
      status_code: res.statusCode.toString(),
    });

    httpRequestDuration.observe({ method: req.method, route }, duration);

    if (res.statusCode >= 400) {
      httpErrorCounter.inc({
        method: req.method,
        route,
        status_code: res.statusCode.toString(),
      });
    }
  });

  next();
});

// Metrics endpoint
app.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get("/health", async (_req: Request, res: Response) => {
  const checks = await Promise.allSettled(
    Object.entries(SERVICE_URLS).map(async ([name, url]) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3000);

      try {
        const response = await fetch(`${url}/health`, {
          signal: controller.signal,
        });
        return { name, status: response.ok ? "healthy" : "unhealthy" };
      } catch {
        return { name, status: "unhealthy" };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  const services = checks.map((result) =>
    result.status === "fulfilled"
      ? result.value
      : { name: "unknown", status: "unhealthy" }
  );

  const allHealthy = services.every((s) => s.status === "healthy");

  res.status(allHealthy ? 200 : 503).json({
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    services,
  });
});

// Proxy configuration
function proxy(target: string, pathRewrite?: Record<string, string>): Options {
  return {
    target,
    changeOrigin: true,
    pathRewrite,
    on: {
      error(err, _req, res) {
        console.error(`Proxy error: ${err.message}`);
        if ("writeHead" in res && typeof res.writeHead === "function") {
          (res as any).status(502).json({ error: "Service unavailable" });
        }
      },
    },
  };
}

// Doctor Service routes
app.use("/api/v1/case-sheets", createProxyMiddleware(proxy(SERVICE_URLS["doctor-service"])));
app.use("/api/v1/op-sheets", createProxyMiddleware(proxy(SERVICE_URLS["doctor-service"])));
app.use("/api/v1/emergency", createProxyMiddleware(proxy(SERVICE_URLS["doctor-service"])));
app.use("/api/v1/follow-ups", createProxyMiddleware(proxy(SERVICE_URLS["doctor-service"])));
app.use("/api/v1/templates", createProxyMiddleware(proxy(SERVICE_URLS["doctor-service"])));

// HMS Service routes
app.use("/api/v1/beds", createProxyMiddleware(proxy(SERVICE_URLS["hms-service"])));
app.use("/api/v1/documents", createProxyMiddleware(proxy(SERVICE_URLS["hms-service"])));
app.use("/api/v1/appointments", createProxyMiddleware(proxy(SERVICE_URLS["hms-service"])));
app.use("/api/v1/schedules", createProxyMiddleware(proxy(SERVICE_URLS["hms-service"])));

// Patient Service routes
app.use("/api/v1/patients", createProxyMiddleware(proxy(SERVICE_URLS["patient-service"])));
app.use("/api/v1/health-vault", createProxyMiddleware(proxy(SERVICE_URLS["patient-service"])));
app.use("/api/v1/triage", createProxyMiddleware(proxy(SERVICE_URLS["patient-service"])));
app.use("/api/v1/consents", createProxyMiddleware(proxy(SERVICE_URLS["patient-service"])));

// Student Service routes
app.use("/api/v1/cases/practice", createProxyMiddleware(proxy(SERVICE_URLS["student-service"])));
app.use("/api/v1/learning", createProxyMiddleware(proxy(SERVICE_URLS["student-service"])));
app.use("/api/v1/leaderboard", createProxyMiddleware(proxy(SERVICE_URLS["student-service"])));

// Analytics Service routes
app.use("/api/v1/analytics", createProxyMiddleware(proxy(SERVICE_URLS["analytics-service"])));

// Voice AI routes
app.use("/api/v1/voice", createProxyMiddleware(proxy(SERVICE_URLS["voice-ai"])));

app.listen(PORT, () => {
  console.log(`API Gateway listening on port ${PORT}`);
});
