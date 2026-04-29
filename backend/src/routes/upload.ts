import { Router } from 'express';
import { requireAuth } from '../middleware/authMiddleware';
import { auth } from '../lib/auth';
import { db } from '../db';
import { user } from '../db/schema';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

const router = Router();
router.use(requireAuth);

// Configure multer for profile photo uploads
const uploadsDir = path.resolve(__dirname, '../../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname) || '.jpg';
        const name = `profile_${crypto.randomUUID()}${ext}`;
        cb(null, name);
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
    fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (allowed.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Only JPEG, PNG, WebP, and GIF images are allowed'));
        }
    },
});

// POST /api/upload/profile — upload profile photo
router.post('/profile', upload.single('image'), async (req, res) => {
    const userId = (req as any).user.id;

    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        // Build the public URL for the uploaded file
        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        // Update user's image field directly in the database
        await db.update(user).set({
            image: imageUrl,
            updatedAt: new Date(),
        }).where(eq(user.id, userId));

        res.json({ success: true, imageUrl });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload profile photo' });
    }
});

// DELETE /api/upload/profile — remove profile photo
router.delete('/profile', async (req, res) => {
    const userId = (req as any).user.id;

    try {
        // Get current image path
        const [userData] = await db.select({ image: user.image }).from(user).where(eq(user.id, userId));

        if (userData?.image && userData.image.startsWith('/uploads/')) {
            const filePath = path.resolve(__dirname, '../../', userData.image.slice(1));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        // Clear image in database
        await db.update(user).set({
            image: null,
            updatedAt: new Date(),
        }).where(eq(user.id, userId));

        res.json({ success: true });
    } catch (error) {
        console.error('Delete photo error:', error);
        res.status(500).json({ error: 'Failed to delete profile photo' });
    }
});

export default router;
