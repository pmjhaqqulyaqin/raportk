import { Router } from 'express';
import { db } from '../db';
import { schoolInfo } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const data = await db.select().from(schoolInfo).where(eq(schoolInfo.userId, userId));
        if (data.length === 0) {
            return res.json(null);
        }
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch school info' });
    }
});

router.put('/', async (req, res) => {
    const userId = (req as any).user.id;
    const updateData = req.body;
    
    try {
        // Check if exists
        const existing = await db.select().from(schoolInfo).where(eq(schoolInfo.userId, userId));
        
        if (existing.length === 0) {
            // Create
            const created = await db.insert(schoolInfo).values({
                userId,
                ...updateData
            }).returning();
            return res.json(created[0]);
        } else {
            // Update
            const updated = await db.update(schoolInfo).set({
                ...updateData,
                updatedAt: new Date()
            }).where(eq(schoolInfo.userId, userId)).returning();
            return res.json(updated[0]);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update school info' });
    }
});

export default router;
