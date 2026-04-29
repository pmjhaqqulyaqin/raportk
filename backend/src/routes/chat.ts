import { Router } from 'express';
import { db } from '../db';
import { chatMessages, schoolMembers, schools, user } from '../db/schema';
import { eq, and, desc, lt, or, isNull, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';
import { broadcast } from '../lib/sse';
import { sendPushToUser, sendPushToSchoolMembers } from './push';

const router = Router();
router.use(requireAuth);

async function getSchoolCtx(userId: string, npsn: string) {
    const school = await db.select().from(schools).where(eq(schools.npsn, npsn));
    if (school.length === 0) return null;
    const member = await db.select().from(schoolMembers)
        .where(and(eq(schoolMembers.schoolId, school[0].id), eq(schoolMembers.userId, userId)));
    if (member.length === 0) return null;
    return { school: school[0], member: member[0] };
}

// GET /api/chat/:npsn?to=userId — Load chat (group if no 'to', DM if 'to' specified)
router.get('/:npsn', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);
    const toUserId = req.query.to as string;

    try {
        const ctx = await getSchoolCtx(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        let condition;
        if (toUserId) {
            // DM: messages between me and target
            condition = and(
                eq(chatMessages.schoolId, ctx.school.id),
                or(
                    and(eq(chatMessages.senderId, userId), eq(chatMessages.recipientId, toUserId)),
                    and(eq(chatMessages.senderId, toUserId), eq(chatMessages.recipientId, userId))
                )
            );
        } else {
            // Group: messages with no recipient
            condition = and(
                eq(chatMessages.schoolId, ctx.school.id),
                isNull(chatMessages.recipientId)
            );
        }

        const messages = await db.select({
            id: chatMessages.id,
            message: chatMessages.message,
            replyTo: chatMessages.replyTo,
            recipientId: chatMessages.recipientId,
            createdAt: chatMessages.createdAt,
            senderId: chatMessages.senderId,
            senderName: user.name,
            senderImage: user.image,
        })
        .from(chatMessages)
        .innerJoin(user, eq(chatMessages.senderId, user.id))
        .where(condition)
        .orderBy(desc(chatMessages.createdAt))
        .limit(limit);

        res.json(messages.reverse());
    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({ error: 'Gagal memuat chat' });
    }
});

// GET /api/chat/:npsn/conversations — List DM conversations with last message
router.get('/:npsn/conversations', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;

    try {
        const ctx = await getSchoolCtx(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        // Get all DM messages involving this user
        const dms = await db.select({
            id: chatMessages.id,
            senderId: chatMessages.senderId,
            recipientId: chatMessages.recipientId,
            message: chatMessages.message,
            createdAt: chatMessages.createdAt,
        })
        .from(chatMessages)
        .where(and(
            eq(chatMessages.schoolId, ctx.school.id),
            or(eq(chatMessages.senderId, userId), eq(chatMessages.recipientId, userId)),
            sql`${chatMessages.recipientId} IS NOT NULL`
        ))
        .orderBy(desc(chatMessages.createdAt));

        // Group by partner, keep latest
        const seen = new Map<string, any>();
        for (const dm of dms) {
            const partnerId = dm.senderId === userId ? dm.recipientId! : dm.senderId;
            if (!seen.has(partnerId)) {
                seen.set(partnerId, { partnerId, lastMessage: dm.message, lastAt: dm.createdAt });
            }
        }

        // Fetch partner info
        const convos = [];
        for (const [partnerId, info] of seen) {
            const partner = await db.select({ name: user.name, image: user.image }).from(user).where(eq(user.id, partnerId));
            convos.push({
                ...info,
                partnerName: partner[0]?.name || 'Unknown',
                partnerImage: partner[0]?.image || null,
            });
        }

        res.json(convos);
    } catch (error) {
        console.error('Conversations error:', error);
        res.status(500).json({ error: 'Gagal memuat percakapan' });
    }
});

// POST /api/chat/:npsn — Send message (group or DM)
router.post('/:npsn', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const { message, replyTo, recipientId } = req.body;

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
            recipientId: recipientId || null,
            message: message.trim(),
            replyTo: replyTo || null,
        }).returning();

        const payload = {
            id: created.id,
            message: created.message,
            replyTo: created.replyTo,
            recipientId: created.recipientId,
            createdAt: created.createdAt,
            senderId: userId,
            senderName: sender[0]?.name || 'Unknown',
            senderImage: sender[0]?.image || null,
        };

        // Broadcast SSE
        broadcast(npsn, 'chat_message', payload);

        // Push notifications (async, don't block response)
        const senderName = sender[0]?.name || 'Guru';
        const pushPayload = {
            title: recipientId ? senderName : `${senderName} (Grup)`,
            body: message.trim().substring(0, 100),
            tag: recipientId ? `dm-${userId}` : `group-${npsn}`,
            url: '/school-hub',
        };

        if (recipientId) {
            // DM: push only to recipient
            sendPushToUser(recipientId, pushPayload).catch(() => {});
        } else {
            // Group: push to all members except sender
            const allMembers = await db.select({ userId: schoolMembers.userId })
                .from(schoolMembers).where(eq(schoolMembers.schoolId, ctx.school.id));
            sendPushToSchoolMembers(allMembers.map(m => m.userId), userId, pushPayload).catch(() => {});
        }

        res.status(201).json(payload);
    } catch (error) {
        console.error('Send chat error:', error);
        res.status(500).json({ error: 'Gagal mengirim pesan' });
    }
});

// DELETE /api/chat/:npsn/:messageId
router.delete('/:npsn/:messageId', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn, messageId } = req.params;

    try {
        const ctx = await getSchoolCtx(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        const msg = await db.select().from(chatMessages).where(eq(chatMessages.id, messageId));
        if (msg.length === 0) return res.status(404).json({ error: 'Pesan tidak ditemukan' });

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
