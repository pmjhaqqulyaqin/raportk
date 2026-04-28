import { Router } from 'express';
import { db } from '../db';
import { students } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';
import multer from 'multer';
import csv from 'csv-parser';
import fs from 'fs';

const upload = multer({ dest: 'uploads/' });
const router = Router();

// Apply auth middleware to all routes in this router
router.use(requireAuth);

router.get('/', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const data = await db.select().from(students).where(eq(students.userId, userId));
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});

router.post('/', async (req, res) => {
    const userId = (req as any).user.id;
    const { name, height, weight, phase, group, gender } = req.body;
    try {
        const newStudent = await db.insert(students).values({
            userId,
            name,
            height: height ? parseInt(height) : null,
            weight: weight ? parseInt(weight) : null,
            phase: phase || 'Fondasi',
            group: group || 'A',
            gender
        }).returning();
        
        res.status(201).json(newStudent[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create student' });
    }
});

router.post('/import', upload.single('file'), async (req, res) => {
    const userId = (req as any).user.id;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    const results: any[] = [];
    fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (data) => results.push(data))
        .on('end', async () => {
            try {
                // Map Dapodik columns to our DB schema
                // Typically Dapodik has: Nama, JK, NISN, NIK, etc.
                const newStudents = results.map(row => ({
                    userId,
                    name: row.Nama || row.name || 'Unnamed',
                    gender: row.JK || row.gender || row['Jenis Kelamin'] || null,
                    nisn: row.NISN || row.nisn || null,
                    nik: row.NIK || row.nik || null,
                    phase: 'Fondasi',
                    group: 'A'
                }));

                if (newStudents.length > 0) {
                    await db.insert(students).values(newStudents);
                }

                fs.unlinkSync(req.file!.path); // clean up
                res.json({ success: true, count: newStudents.length });
            } catch (error) {
                console.error(error);
                res.status(500).json({ error: 'Failed to import students' });
            }
        });
});

router.put('/:id', async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, height, weight, phase, group, gender } = req.body;
    
    try {
        const updated = await db.update(students).set({
            name,
            height: height ? parseInt(height) : null,
            weight: weight ? parseInt(weight) : null,
            phase,
            group,
            gender,
            updatedAt: new Date()
        })
        .where(and(eq(students.id, id), eq(students.userId, userId)))
        .returning();

        if (updated.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json(updated[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to update student' });
    }
});

router.delete('/:id', async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    try {
        const deleted = await db.delete(students)
            .where(and(eq(students.id, id), eq(students.userId, userId)))
            .returning();
            
        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Student not found' });
        }
        res.json({ success: true, message: 'Student deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete student' });
    }
});

export default router;
