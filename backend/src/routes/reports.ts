import { Router } from 'express';
import { db } from '../db';
import { reports } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const data = await db.select().from(reports).where(eq(reports.userId, userId));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch all reports' });
    }
});

router.get('/:studentId', async (req, res) => {
    const userId = (req as any).user.id;
    const { studentId } = req.params;
    
    try {
        const data = await db.select().from(reports)
            .where(and(eq(reports.studentId, studentId), eq(reports.userId, userId)));
            
        if (data.length === 0) {
            return res.json(null);
        }
        res.json(data[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch report' });
    }
});

router.put('/:studentId', async (req, res) => {
    const userId = (req as any).user.id;
    const { studentId } = req.params;
    const updateData = req.body;
    
    try {
        const existing = await db.select().from(reports)
            .where(and(eq(reports.studentId, studentId), eq(reports.userId, userId)));
            
        if (existing.length === 0) {
            // Create
            const created = await db.insert(reports).values({
                userId,
                studentId,
                ...updateData
            }).returning();
            return res.json(created[0]);
        } else {
            // Update
            const updated = await db.update(reports).set({
                ...updateData,
                updatedAt: new Date()
            }).where(and(eq(reports.studentId, studentId), eq(reports.userId, userId))).returning();
            return res.json(updated[0]);
        }
    } catch (error) {
        res.status(500).json({ error: 'Failed to update report' });
    }
});

export default router;
