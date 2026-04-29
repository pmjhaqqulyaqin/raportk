import { Router } from 'express';
import { db } from '../db';
import { students } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';
import multer from 'multer';
import fs from 'fs';
import path from 'path';

// Use xlsx via dynamic import workaround for CommonJS
let XLSX: any;
try { XLSX = require('xlsx'); } catch { /* will be caught at route level */ }

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
    const { name, height, weight, phase, group, gender, nisn, nik, birthPlace, birthDate } = req.body;
    try {
        const newStudent = await db.insert(students).values({
            userId,
            name,
            height: height ? parseInt(height) : null,
            weight: weight ? parseInt(weight) : null,
            phase: phase || 'Fondasi',
            group: group || 'A',
            gender,
            nisn: nisn || null,
            nik: nik || null,
            birthPlace: birthPlace || null,
            birthDate: birthDate || null,
        }).returning();
        
        res.status(201).json(newStudent[0]);
    } catch (error) {
        res.status(500).json({ error: 'Failed to create student' });
    }
});

// Download Excel import template
router.get('/import-template', (_req, res) => {
    if (!XLSX) return res.status(500).json({ error: 'XLSX module not available' });

    const header = ['Nama', 'Jenis Kelamin (L/P)', 'NISN', 'NIK', 'Tempat Lahir', 'Tanggal Lahir', 'Fase', 'Kelompok', 'Tinggi (cm)', 'Berat (kg)'];
    const example = ['Budi Santoso', 'L', '0012345678', '3201012345670001', 'Kolaka', '2020-05-15', 'Fondasi', 'A', '110', '20'];

    const ws = XLSX.utils.aoa_to_sheet([header, example]);
    ws['!cols'] = [
        { wch: 25 }, { wch: 18 }, { wch: 14 }, { wch: 20 },
        { wch: 18 }, { wch: 16 }, { wch: 10 }, { wch: 12 },
        { wch: 12 }, { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Import Siswa');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', 'attachment; filename=Template_Import_Siswa.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
});

// Import students from Excel
router.post('/import', upload.single('file'), async (req, res) => {
    const userId = (req as any).user.id;
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    if (!XLSX) {
        return res.status(500).json({ error: 'XLSX module not available on server' });
    }

    try {
        const workbook = XLSX.readFile(req.file.path);
        const sheetName = workbook.SheetNames[0];
        const rows: any[] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        const newStudents = rows.map((row: any) => ({
            userId,
            name: row['Nama'] || row.Nama || row.name || 'Unnamed',
            gender: row['Jenis Kelamin (L/P)'] || row.JK || row.gender || null,
            nisn: row['NISN'] || row.nisn || null,
            nik: row['NIK'] || row.nik || null,
            birthPlace: row['Tempat Lahir'] || row.birthPlace || null,
            birthDate: row['Tanggal Lahir'] || row.birthDate || null,
            phase: row['Fase'] || row.phase || 'Fondasi',
            group: row['Kelompok'] || row.group || 'A',
            height: row['Tinggi (cm)'] ? parseInt(row['Tinggi (cm)']) : null,
            weight: row['Berat (kg)'] ? parseInt(row['Berat (kg)']) : null,
        }));

        if (newStudents.length > 0) {
            await db.insert(students).values(newStudents);
        }

        fs.unlinkSync(req.file!.path); // clean up
        res.json({ success: true, count: newStudents.length });
    } catch (error) {
        console.error(error);
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ error: 'Failed to import students. Pastikan format Excel sesuai template.' });
    }
});

router.put('/:id', async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { name, height, weight, phase, group, gender, nisn, nik, birthPlace, birthDate } = req.body;
    
    try {
        const updated = await db.update(students).set({
            name,
            height: height ? parseInt(height) : null,
            weight: weight ? parseInt(weight) : null,
            phase,
            group,
            gender,
            nisn: nisn || null,
            nik: nik || null,
            birthPlace: birthPlace || null,
            birthDate: birthDate || null,
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
