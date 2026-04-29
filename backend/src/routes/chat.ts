import { Router } from 'express';
import { db } from '../db';
import { chatMessages, schoolMembers, schools, user } from '../db/schema';
import { eq, and, desc, lt } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';
import { broadcast } from '../lib/sse';

const router = Router();
router.use(requireAuth);

// Helper: verify membership and get school
async function getSchoolCtx(userId: string, npsn: string) {
    const school = await db.select().from(schools).where(eq(schools.npsn, npsn));
    if (school.length === 0) return null;
    const member = await db.select().from(schoolMembers)
        .where(and(eq(schoolMembers.schoolId, school[0].id), eq(schoolMembers.userId, userId)));
    if (member.length === 0) return null;
    return { school: school[0], member: member[0] };
}

// GET /api/chat/:npsn — Load chat history (cursor-based, newest first)
router.get('/:npsn', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const before = req.query.before as string; // cursor: message ID

    try {
        const ctx = await getSchoolCtx(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        let query = db.select({
            id: chatMessages.id,
            message: chatMessages.message,
            replyTo: chatMessages.replyTo,
            createdAt: chatMessages.createdAt,
            senderId: chatMessages.senderId,
            senderName: user.name,
            senderImage: user.image,
        })
        .from(chatMessages)
        .innerJoin(user, eq(chatMessages.senderId, user.id))
        .where(eq(chatMessages.schoolId, ctx.school.id))
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

        // Cursor pagination: load older messages
        if (before) {
            const ref = await db.select({ createdAt: chatMessages.createdAt }).from(chatMessages).where(eq(chatMessages.id, before));
            if (ref.length > 0) {
                query = db.select({
                    id: chatMessages.id,
                    message: chatMessages.message,
                    replyTo: chatMessages.replyTo,
                    createdAt: chatMessages.createdAt,
                    senderId: chatMessages.senderId,
                    senderName: user.name,
                    senderImage: user.image,
                })
                .from(chatMessages)
                .innerJoin(user, eq(chatMessages.senderId, user.id))
                .where(and(
                    eq(chatMessages.schoolId, ctx.school.id),
                    lt(chatMessages.createdAt, ref[0].createdAt)
                ))
                .orderBy(desc(chatMessages.createdAt))
                .limit(limit);
            }
        }

        const messages = await query;
        res.json(messages.reverse()); // Return in chronological order
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ error: 'Gagal memuat chat' });
    }
});

// POST /api/chat/:npsn — Send message
router.post('/:npsn', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const { message, replyTo } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({ error: 'Pesan tidak boleh kosong' });
    }
    if (message.length > 1000) {
        return res.status(400).json({ error: 'Pesan maksimal 1000 karakter' });
    }

    try {
        const ctx = await getSchoolCtx(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        const sender = await db.select({ name: user.name, image: user.image }).from(user).where(eq(user.id, userId));

        const [created] = await db.insert(chatMessages).values({
            schoolId: ctx.school.id,
            senderId: userId,
            message: message.trim(),
            replyTo: replyTo || null,
        }).returning();

        const payload = {
            id: created.id,
            message: created.message,
            replyTo: created.replyTo,
            createdAt: created.createdAt,
            senderId: userId,
            senderName: sender[0]?.name || 'Unknown',
            senderImage: sender[0]?.image || null,
        };

        // Broadcast to all SSE clients in this school
        broadcast(npsn, 'chat_message', payload);

        res.status(201).json(payload);
    } catch (error) {
        console.error('Send chat error:', error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

// DELETE /api/chat/:npsn/:messageId — Delete own message
router.delete('/:npsn/:messageId', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn, messageId } = req.params;

    try {
        const ctx = await getSchoolCtx(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        const msg = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId));
        if (msg.length === 0) return res.status(404).json({ error: 'Pesan tidak ditemukan' });

        // Only sender or admin can delete
        if (msg[0].senderId !== userId && ctx.member.role !== 'admin') {
            return res.status(403).json({ error: 'Hanya pengirim atau admin yang bisa menghapus' });
        }

        await db.delete(chatMessages).where(eq(chatMessages.id, messageId));
        broadcast(npsn, 'chat_delete', { messageId });
        res.json({ success: true });
    } catch (error) {
        console.error('Delete chat error:', error);
        res.status(500).json({ error: 'Gagal menghapus pesan' });
    }
});

export default router;
