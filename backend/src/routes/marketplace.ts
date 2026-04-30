import { Router } from 'express';
import { db } from '../db';
import { templates, marketplaceVotes, user } from '../db/schema';
import { eq, desc, sql, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// GET /api/marketplace — Public: Browse all public templates (sorted by votes)
router.get('/', async (_req, res) => {
    try {
        const data = await db.select({
            id: templates.id,
            name: templates.name,
            category: templates.category,
            text: templates.text,
            phase: templates.phase,
            groupName: templates.groupName,
            semester: templates.semester,
            description: templates.description,
            forkCount: templates.forkCount,
            createdAt: templates.createdAt,
            authorName: user.name,
            voteCount: sql<number>`(SELECT COUNT(*) FROM marketplace_votes mv WHERE mv.template_id = ${templates.id})`.as('vote_count'),
        })
        .from(templates)
        .leftJoin(user, eq(templates.userId, user.id))
        .where(eq(templates.isPublic, true))
        .orderBy(desc(sql`vote_count`), desc(templates.createdAt))
        .limit(100);

        res.json(data);
    } catch (error) {
        console.error('Marketplace list error:', error);
        res.status(500).json({ error: 'Gagal memuat marketplace' });
    }
});

// POST /api/marketplace/:templateId/vote — Toggle upvote (auth required)
router.post('/:templateId/vote', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { templateId } = req.params;

    try {
        // Check if already voted
        const existing = await db.select().from(marketplaceVotes)
            .where(and(eq(marketplaceVotes.templateId, templateId), eq(marketplaceVotes.userId, userId)));

        if (existing.length > 0) {
            // Remove vote (toggle off)
            await db.delete(marketplaceVotes)
                .where(and(eq(marketplaceVotes.templateId, templateId), eq(marketplaceVotes.userId, userId)));
            res.json({ voted: false });
        } else {
            // Add vote
            await db.insert(marketplaceVotes).values({ templateId, userId });
            res.json({ voted: true });
        }
    } catch (error) {
        res.status(500).json({ error: 'Gagal memproses vote' });
    }
});

// GET /api/marketplace/my-votes — Get current user's votes (auth required)
router.get('/my-votes', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const votes = await db.select({ templateId: marketplaceVotes.templateId })
            .from(marketplaceVotes).where(eq(marketplaceVotes.userId, userId));
        res.json(votes.map(v => v.templateId));
    } catch (error) {
        res.status(500).json({ error: 'Gagal memuat votes' });
    }
});

// POST /api/marketplace/:templateId/fork — Fork/copy template to own collection (auth required)
router.post('/:templateId/fork', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { templateId } = req.params;

    try {
        // Get the source template
        const source = await db.select().from(templates).where(eq(templates.id, templateId));
        if (!source.length || !source[0].isPublic) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }

        const t = source[0];

        // Create a copy for the user
        await db.insert(templates).values({
            userId,
            category: t.category,
            name: `${t.name} (copy)`,
            text: t.text,
            phase: t.phase,
            groupName: t.groupName,
            semester: t.semester,
            isPublic: false,
        });

        // Increment fork count
        await db.update(templates)
            .set({ forkCount: sql`COALESCE(${templates.forkCount}, 0) + 1` })
            .where(eq(templates.id, templateId));

        res.json({ message: 'Template berhasil disalin ke koleksi Anda' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal menyalin template' });
    }
});

// POST /api/marketplace/publish/:templateId — Publish own template to marketplace (auth required)
router.post('/publish/:templateId', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { templateId } = req.params;
    const { description } = req.body;

    try {
        const existing = await db.select().from(templates)
            .where(and(eq(templates.id, templateId), eq(templates.userId, userId)));

        if (!existing.length) {
            return res.status(404).json({ error: 'Template tidak ditemukan' });
        }

        await db.update(templates)
            .set({ isPublic: true, description: description || null, updatedAt: new Date() })
            .where(and(eq(templates.id, templateId), eq(templates.userId, userId)));

        res.json({ message: 'Template berhasil dipublikasikan' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal mempublikasikan template' });
    }
});

// POST /api/marketplace/unpublish/:templateId — Remove from marketplace (auth required)
router.post('/unpublish/:templateId', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { templateId } = req.params;

    try {
        await db.update(templates)
            .set({ isPublic: false, updatedAt: new Date() })
            .where(and(eq(templates.id, templateId), eq(templates.userId, userId)));

        res.json({ message: 'Template dihapus dari marketplace' });
    } catch (error) {
        res.status(500).json({ error: 'Gagal menghapus dari marketplace' });
    }
});

export default router;
