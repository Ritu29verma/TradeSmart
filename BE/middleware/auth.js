import { authService } from "../services/auth.js";
import { storage } from "../storage.js";

export const authenticateToken = async (req, res, next) => {
  try {
    const token = authService.extractTokenFromHeader(req.headers.authorization);
    console.log("Incoming auth headers:", req.headers.authorization);
    if (!token) {
      return res.status(401).json({ message: "Access token required" });
    }

    const decoded = authService.verifyToken(token);
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = authService.extractTokenFromHeader(req.headers.authorization);
    console.log("Incoming auth headers:", req.headers.authorization);
    if (token) {
      const decoded = authService.verifyToken(token);
      const user = await storage.getUser(decoded.id);
      req.user = user;
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};
