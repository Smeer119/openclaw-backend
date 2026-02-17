import { Request, Response, NextFunction } from 'express';
import { clerkClient } from '@clerk/clerk-sdk-node';
import { config } from '../config';

export interface AuthRequest extends Request {
    userId?: string;
}

/**
 * Middleware to verify Clerk JWT token and extract user ID
 */
export async function authenticateUser(
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Missing or invalid authorization header' });
            return;
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token with Clerk
        const payload = await clerkClient.verifyToken(token, {
            secretKey: config.clerk.secretKey,
        });

        if (!payload || !payload.sub) {
            res.status(401).json({ error: 'Invalid token' });
            return;
        }

        // Attach user ID to request
        req.userId = payload.sub;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}

/**
 * Helper to get user ID from authenticated request
 */
export function getUserId(req: AuthRequest): string {
    if (!req.userId) {
        throw new Error('User not authenticated');
    }
    return req.userId;
}
