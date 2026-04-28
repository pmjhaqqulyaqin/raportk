import { Request, Response, NextFunction } from 'express';
import { auth } from '../lib/auth';

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const session = await auth.api.getSession({
            headers: req.headers
        });

        if (!session || !session.user) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        // Attach user info to req
        (req as any).user = session.user;
        next();
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Unauthorized' });
    }
};
