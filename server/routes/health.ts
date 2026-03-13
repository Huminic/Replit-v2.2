import type { Express } from "express";

const startTime = Date.now();

export function registerHealthRoutes(app: Express) {
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      version: process.env.npm_package_version || '2.2.0',
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    });
  });
}
