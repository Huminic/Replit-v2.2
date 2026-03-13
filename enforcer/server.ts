import express from "express";
import { runGates, type VerifyPayload } from "./gates.js";

const PORT = parseInt(process.env.ENFORCER_PORT || "8004", 10);
const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    service: "nexxus-enforcer",
    version: "1.0.0",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.post("/api/verify", (req, res) => {
  const payload = req.body as VerifyPayload;

  if (!payload.sprintId) {
    res.status(400).json({ error: "sprintId is required" });
    return;
  }

  if (!payload.evidenceDir) {
    res.status(400).json({ error: "evidenceDir is required" });
    return;
  }

  const result = runGates(payload);
  const status = result.verdict === "APPROVED" ? 200 : 422;
  res.status(status).json(result);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Enforcer agent listening on port ${PORT}`);
  console.log(`  Health: http://localhost:${PORT}/health`);
  console.log(`  Verify: POST http://localhost:${PORT}/api/verify`);
});
