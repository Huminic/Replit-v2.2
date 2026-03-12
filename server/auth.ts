import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required");
}

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = "1h";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_EXPIRY_SECONDS = 60 * 60;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId: string;
  organizationId: string;
  roleId: string;
  type?: 'access' | 'refresh';
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
        roleId: string;
        roleName: string;
        roleLevel: number;
        organizationId: string;
        organizationName: string;
      };
    }
  }
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string, expectedType?: 'access' | 'refresh'): TokenPayload {
  const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
  if (expectedType && decoded.type !== expectedType) {
    throw new Error(`Invalid token type: expected ${expectedType}, got ${decoded.type}`);
  }
  return decoded;
}

export function getAccessTokenExpirySeconds(): number {
  return ACCESS_TOKEN_EXPIRY_SECONDS;
}

export function getRefreshTokenExpiryDate(): Date {
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const payload = verifyToken(token, 'access');
    const user = await storage.getUser(payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    const role = await storage.getRole(user.roleId);
    const org = await storage.getOrganization(user.organizationId);

    if (!role || !org) {
      return res.status(401).json({ message: "Invalid user configuration" });
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roleId: role.id,
      roleName: role.name,
      roleLevel: role.level,
      organizationId: org.id,
      organizationName: org.name,
    };

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function requireRole(maxLevel: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (req.user.roleLevel > maxLevel) {
      return res.status(403).json({ message: `Forbidden: this action requires a role level of ${maxLevel} or higher (your level: ${req.user.roleLevel})` });
    }

    next();
  };
}
