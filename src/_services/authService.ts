import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";
const JWT_EXPIRES_IN = "7d";

export type UserType = "admin" | "customer";
export type UserRole = "superAdmin" | "admin";

export interface AuthTokenPayload {
  id: number;
  username: string;
  email: string;
  role: string;
  user_type: UserType;
}

export function generateToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): AuthTokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
  } catch (err) {
    return null;
  }
}

/**
 * Express middleware to verify Bearer token and attach user to req.user
 */
export function authenticateToken(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid authorization header" });
  }
  const token = authHeader.split(" ")[1];
  const user = verifyToken(token);
  if (!user) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = user;
  next();
}

/**
 * Decorator/middleware factory to validate user role
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: any, res: any, next: any) => {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user's role is in the allowed roles
    if (!allowedRoles.includes(req.user.role as UserRole)) {
      return res.status(403).json({ 
        error: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${req.user.role}` 
      });
    }

    next();
  };
}

/**
 * Decorator/middleware factory to validate user type
 * @param allowedUserTypes - Array of user types that are allowed to access the route
 * @returns Express middleware function
 */
export function requireUserType(...allowedUserTypes: UserType[]) {
  return (req: any, res: any, next: any) => {
    // First ensure user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Check if user's type is in the allowed types
    if (!allowedUserTypes.includes(req.user.user_type)) {
      return res.status(403).json({ 
        error: `Access denied. Required user type: ${allowedUserTypes.join(" or ")}. Your type: ${req.user.user_type}` 
      });
    }

    next();
  };
}

/**
 * Combined middleware that requires both authentication and specific role
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @returns Express middleware function
 */
export function requireAuthAndRole(...allowedRoles: UserRole[]) {
  return [authenticateToken, requireRole(...allowedRoles)];
}

/**
 * Combined middleware that requires both authentication and specific user type
 * @param allowedUserTypes - Array of user types that are allowed to access the route
 * @returns Express middleware function
 */
export function requireAuthAndUserType(...allowedUserTypes: UserType[]) {
  return [authenticateToken, requireUserType(...allowedUserTypes)];
}

/**
 * Combined middleware that requires authentication, specific role, and specific user type
 * @param allowedRoles - Array of roles that are allowed to access the route
 * @param allowedUserTypes - Array of user types that are allowed to access the route
 * @returns Express middleware function
 */
export function requireAuthRoleAndUserType(allowedRoles: UserRole[], allowedUserTypes: UserType[]) {
  return [
    authenticateToken, 
    requireRole(...allowedRoles), 
    requireUserType(...allowedUserTypes)
  ];
}
