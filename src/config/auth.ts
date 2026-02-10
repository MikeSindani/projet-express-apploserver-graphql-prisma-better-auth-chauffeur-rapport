import log from "@/lib/log";

/**
 * 🔐 Centralized JWT Secret Configuration
 * 
 * This ensures that token signing and verification are consistent across
 * all controllers and utilities in the application.
 */
export const JWT_SECRET = process.env.JWT_SECRET || "TON_SECRET_JWT";

// Log configuration status on startup
log(`🔐 Auth Config: Using ${process.env.JWT_SECRET ? 'environment variable' : 'fallback'} for JWT_SECRET`);
