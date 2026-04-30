import { Router } from 'express';
import { db } from '../db';
import { reports } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';
import crypto from 'crypto';

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

// ─── Parent Portal: Generate Share Token ─────────────────
router.post('/:studentId/share', async (req, res) => {
    const userId = (req as any).user.id;
    const { studentId } = req.params;

    try {
        let existing = await db.select().from(reports)
            .where(and(eq(reports.studentId, studentId), eq(reports.userId, userId)));

        // Auto-create empty report if none exists yet
        if (!existing.length) {
            const created = await db.insert(reports).values({
                userId,
                studentId,
            }).returning();
            existing = created;
        }

        // If already has token, return it
        if (existing[0].shareToken) {
            return res.json({ shareToken: existing[0].shareToken });
        }

        // Generate unique token (URL-safe, 16 bytes = 22 chars base64url)
        const token = crypto.randomBytes(16).toString('base64url');
        
        await db.update(reports)
            .set({ shareToken: token, updatedAt: new Date() })
            .where(and(eq(reports.studentId, studentId), eq(reports.userId, userId)));

        res.json({ shareToken: token });
    } catch (error) {
        console.error('Share report error:', error);
        res.status(500).json({ error: 'Gagal membuat link berbagi' });
    }
});

// ─── Parent Portal: Revoke Share Token ───────────────────
router.delete('/:studentId/share', async (req, res) => {
    const userId = (req as any).user.id;
    const { studentId } = req.params;

    try {
        await db.update(reports)
            .set({ shareToken: null, updatedAt: new Date() })
            .where(and(eq(reports.studentId, studentId), eq(reports.userId, userId)));

        res.json({ message: 'Link berbagi telah dicabut' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mencabut link berbagi' });
    }
});

export default router;

