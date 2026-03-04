import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { storage } from "./storage";

const JWT_SECRET = process.env.JWT_SECRET || "nexxus-connect-jwt-secret-dev";
const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60;
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

export interface TokenPayload {
  userId: string;
  organizationId: string;
  roleId: string;
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
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
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
    const payload = verifyToken(token);
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
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
}
