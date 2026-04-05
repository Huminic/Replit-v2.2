import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import helmet from 'helmet';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { registerDomainRoutes } from "./routes/index";
import { serveStatic } from "./static";
import { createServer } from "http";
import { storage } from "./storage";
import { startSchedulers } from "./services/scheduler";
import { seedDatabase } from "./seed";
import { registerVendorRoutes } from "./vendorProxy";
import { startSyncScheduler } from "./sync";

function validateEnvironment() {
  const required = ['DATABASE_URL', 'JWT_SECRET'];
  const recommended = ['TEXTMAGIC_USERNAME', 'TEXTMAGIC_API_KEY', 'RESEND_API_KEY', 'VAPI_PRIVATE_KEY', 'TAVUS_API_KEY', 'FAL_KEY', 'OPENAI_API_KEY', 'FLEXPRICE_API_KEY'];

  const missing = required.filter(key => !process.env[key]);
  if (missing.length > 0) {
    console.error('FATAL: Missing required environment variables:', missing.join(', '));
    process.exit(1);
  }

  const missingRecommended = recommended.filter(key => !process.env[key]);
  if (missingRecommended.length > 0) {
    console.warn('WARNING: Missing optional environment variables (some features will be disabled):', missingRecommended.join(', '));
  }
}

validateEnvironment();

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5000';
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);
const allowedOrigins = new Set([appBaseUrl, 'http://localhost:5000', 'http://localhost:3000', ...corsOrigins]);
// Widget endpoints need cross-origin access from any dealer site (I-135 fix).
// Both /api/widget/* and /widget/* paths must accept requests from any origin.
const widgetCors = cors({ origin: '*', methods: ['GET', 'POST', 'OPTIONS'], allowedHeaders: ['Content-Type'] });
app.use('/api/widget', widgetCors);
app.use('/widget', widgetCors);

// General CORS for all other routes — rejects unknown origins.
// Widget paths are excluded above so the permissive policy isn't overridden.
app.use((req, res, next) => {
  // Skip general CORS for widget paths — already handled above
  if (req.path.startsWith('/api/widget') || req.path.startsWith('/widget')) {
    return next();
  }
  cors({
    origin: function(origin, callback) {
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })(req, res, next);
});

// Security headers via Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.anthropic.com", "wss:"],
    },
  },
  crossOriginEmbedderPolicy: false,
  noSniff: false,
  frameguard: false,
  xssFilter: false,
  referrerPolicy: false,
}));

// Override Helmet's restrictive headers for widget routes (I-214).
// Widgets must load cross-origin on dealer sites (e.g. serrahonda.net loading
// live.huminic.app/widget/dealer/serra-honda.js). Helmet sets CORP=same-origin
// and COOP=same-origin by default, which blocks cross-origin script loads and
// iframe embeds. This middleware runs after Helmet to override those headers
// only on widget paths.
app.use((req, res, next) => {
  if (req.path.startsWith('/api/widget') || req.path.startsWith('/widget') || req.path.startsWith('/w/') || req.path.startsWith('/p/')) {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.removeHeader('X-Frame-Options');
    // Override CSP for widget routes — allow embedding from any origin
    res.setHeader('Content-Security-Policy', "default-src 'self' https:; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https: wss:; frame-ancestors *;");
  }
  next();
});

// Request ID middleware
app.use((req, _res, next) => {
  const requestId = crypto.randomUUID();
  (req as any).requestId = requestId;
  _res.setHeader('X-Request-ID', requestId);
  next();
});

// Global rate limiter: 100 requests per minute (configurable via GLOBAL_RATE_LIMIT_MAX)
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: parseInt(process.env.GLOBAL_RATE_LIMIT_MAX || '100'),
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    return ip.replace(/:\d+$/, '');
  },
});
app.use('/api/', globalLimiter);

// Auth rate limiting handled by route-level limiter in server/routes/auth.ts
// (configurable via AUTH_RATE_LIMIT_MAX env var)

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const sanitizedPath = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (sanitizedPath.startsWith("/api")) {
      log(`${req.method} ${sanitizedPath} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  // Seed database
  await seedDatabase();

  // Register vendor proxy routes (VIN Solutions, VAPI, etc.)
  registerVendorRoutes(app);

  // Start the VIN Solutions sync scheduler
  startSyncScheduler().catch(err => {
    console.error("[Sync] Failed to start scheduler:", err);
  });

  // Register all domain routes
  registerDomainRoutes(app);

  // File upload size error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File too large. Maximum upload size is 5MB." });
    }
    next(err);
  });

  app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    return res.status(status).json({ message });
  });

  // API 404 handler — catch unregistered /api/* paths before SPA fallback
  app.all("/api/{*path}", (_req, res) => {
    res.status(404).json({ error: "Not found" });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
      startSchedulers();
    },
  );
})();
