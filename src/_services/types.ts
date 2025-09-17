import { Request } from "express";
import { AuthTokenPayload } from "./authService";

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
    }
  }
}

export {};
