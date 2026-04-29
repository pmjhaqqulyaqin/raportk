import { Router } from 'express';
import webpush from 'web-push';
import { db } from '../db';
import { pushSubscriptions } from '../db/schema';
import { eq, and, ne } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

// Configure web-push
const vapidPublic = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || '';
const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@raportk.my.id';

if (vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(vapidEmail, vapidPublic, vapidPrivate);
}

// GET /api/push/vapid-key — Public key for frontend
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: vapidPublic });
});

// POST /api/push/subscribe — Register push subscription
router.post('/subscribe', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { endpoint, keys } = req.body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
        return res.status(400).json({ error: 'Invalid subscription' });
    }

    try {
        // Upsert: delete old + insert new
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
        await db.insert(pushSubscriptions).values({
            userId, endpoint, p256dh: keys.p256dh, auth: keys.auth,
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Push subscribe error:', error);
        res.status(500).json({ error: 'Gagal menyimpan subscription' });
    }
});

// DELETE /api/push/unsubscribe
router.delete('/unsubscribe', requireAuth, async (req, res) => {
    const userId = (req as any).user.id;
    const { endpoint } = req.body;

    try {
        if (endpoint) {
            await db.delete(pushSubscriptions).where(
                and(eq(pushSubscriptions.userId, userId), eq(pushSubscriptions.endpoint, endpoint))
            );
        } else {
            await db.delete(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        res.status(500).json({ error: 'Gagal menghapus subscription' });
    }
});

// Helper: send push to a user (all their devices), skip sender
export async function sendPushToUser(targetUserId: string, payload: { title: string; body: string; tag?: string; url?: string }) {
    if (!vapidPublic || !vapidPrivate) return;

    try {
        const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, targetUserId));

        for (const sub of subs) {
            try {
                await webpush.sendNotification(
                    { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                    JSON.stringify(payload)
                );
            } catch (err: any) {
                // 410 Gone or 404 = subscription expired, clean up
                if (err.statusCode === 410 || err.statusCode === 404) {
                    await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
                }
            }
        }
    } catch (e) {
        console.error('sendPushToUser error:', e);
    }
}

// Helper: send push to all school members except sender
export async function sendPushToSchoolMembers(schoolMemberUserIds: string[], senderUserId: string, payload: { title: string; body: string; tag?: string; url?: string }) {
    const targets = schoolMemberUserIds.filter(id => id !== senderUserId);
    await Promise.allSettled(targets.map(id => sendPushToUser(id, payload)));
}

export default router;
