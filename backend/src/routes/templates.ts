import { Router } from 'express';
import { db } from '../db';
import { templates } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const data = await db.select().from(templates).where(eq(templates.userId, userId));
        res.json(data);
    } catch (error) {
        console.error('Fetch templates error:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

router.post('/', async (req, res) => {
    const userId = (req as any).user.id;
    const { category, name, text, phase, groupName, semester } = req.body;
    
    try {
        const created = await db.insert(templates).values({
            userId, category, name, text,
            phase: phase || null,
            groupName: groupName || null,
            semester: semester || null,
        }).returning();
        res.status(201).json(created[0]);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Seed default templates
router.post('/seed', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const existing = await db.select().from(templates).where(eq(templates.userId, userId));
        if (existing.length > 0) {
            return res.json({ message: 'Templates already exist', count: existing.length });
        }

        const defaults = [
            { category: 'Nilai Agama & Budi Pekerti', name: 'Sangat Baik', text: '[nama] menunjukkan perkembangan yang sangat baik dalam mengenal nilai-nilai agamanya. Ia sudah mampu membedakan perilaku baik dan buruk secara sederhana. Dalam kegiatan berdoa bersama, [nama] tampak khidmat dan mampu mengikuti gerakan salat dengan mandiri.' },
            { category: 'Nilai Agama & Budi Pekerti', name: 'Mulai Berkembang', text: '[nama] mulai menunjukkan ketertarikan dalam kegiatan keagamaan. Dengan bimbingan guru, ia bersedia ikut berdoa sebelum dan sesudah kegiatan.' },
            { category: 'Nilai Agama & Budi Pekerti', name: 'Berkembang Sesuai Harapan', text: '[nama] sudah dapat menghafal doa-doa pendek dan senang mengikuti kegiatan keagamaan. Ia menunjukkan sikap sopan dan menghormati teman serta guru.' },
            { category: 'Jati Diri', name: 'Mandiri & Percaya Diri', text: '[nama] memiliki rasa percaya diri yang tinggi saat tampil di depan kelas. Ia mampu mengekspresikan emosi dengan cara yang positif dan menunjukkan sikap kemandirian dalam menyelesaikan tugas.' },
            { category: 'Jati Diri', name: 'Mulai Beradaptasi', text: '[nama] perlahan mulai menunjukkan kemandiriannya di lingkungan sekolah. Ia mulai berani bermain bersama teman sebayanya dan mau berbagi mainan.' },
            { category: 'Jati Diri', name: 'Berkembang Baik', text: '[nama] menunjukkan perkembangan sosial-emosional yang baik. Ia mampu mengenali perasaannya sendiri dan mulai memahami perasaan orang lain.' },
            { category: 'Dasar Literasi & STEAM', name: 'Sangat Tertarik', text: 'Kemampuan literasi [nama] berkembang pesat. Ia sangat tertarik mendengarkan cerita dan mampu menceritakan kembali isi buku bergambar dengan bahasanya sendiri. [nama] juga mulai mengenal huruf dan angka.' },
            { category: 'Dasar Literasi & STEAM', name: 'Mulai Mengenal', text: '[nama] mulai menunjukkan minat terhadap kegiatan membaca dan mengenal huruf. Dengan bimbingan, ia mampu menghitung benda-benda sederhana di sekitarnya.' },
            { category: 'Projek / Kokurikuler', name: 'Aktif & Gotong Royong', text: 'Dalam aktivitas projek, [nama] menunjukkan partisipasi aktif dan mampu bekerjasama dengan baik bersama teman-teman kelompoknya. Ia antusias dalam mengikuti kegiatan gotong royong.' },
            { category: 'Projek / Kokurikuler', name: 'Kreatif & Inovatif', text: '[nama] menunjukkan kreativitas yang tinggi dalam kegiatan projek. Ia mampu menghasilkan karya yang unik dan senang bereksperimen dengan bahan-bahan yang tersedia.' },
        ];

        const created = await db.insert(templates).values(
            defaults.map(d => ({ ...d, userId }))
        ).returning();

        res.status(201).json({ message: 'Default templates created', count: created.length, data: created });
    } catch (error) {
        console.error('Seed templates error:', error);
        res.status(500).json({ error: 'Failed to seed templates' });
    }
});

// Export templates as JSON
router.get('/export', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const data = await db.select().from(templates).where(eq(templates.userId, userId));
        const exportData = {
            version: 1,
            exportedAt: new Date().toISOString(),
            count: data.length,
            templates: data.map(t => ({
                category: t.category,
                name: t.name,
                text: t.text,
                phase: t.phase,
                groupName: t.groupName,
                semester: t.semester,
            })),
        };
        res.json(exportData);
    } catch (error) {
        console.error('Export templates error:', error);
        res.status(500).json({ error: 'Failed to export templates' });
    }
});

// Import templates from JSON (bulk insert)
router.post('/import', async (req, res) => {
    const userId = (req as any).user.id;
    const { templates: importedTemplates, mode } = req.body; // mode: 'merge' | 'replace'

    if (!Array.isArray(importedTemplates) || importedTemplates.length === 0) {
        return res.status(400).json({ error: 'No templates provided' });
    }

    try {
        // If replace mode, delete existing templates first
        if (mode === 'replace') {
            await db.delete(templates).where(eq(templates.userId, userId));
        }

        const created = await db.insert(templates).values(
            importedTemplates.map((t: any) => ({
                userId,
                category: t.category,
                name: t.name,
                text: t.text,
                phase: t.phase || null,
                groupName: t.groupName || null,
                semester: t.semester || null,
            }))
        ).returning();

        res.status(201).json({ message: `${created.length} templates imported`, count: created.length });
    } catch (error) {
        console.error('Import templates error:', error);
        res.status(500).json({ error: 'Failed to import templates' });
    }
});

router.put('/:id', async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    const { category, name, text, phase, groupName, semester } = req.body;
    
    try {
        const updated = await db.update(templates).set({
            category, name, text,
            phase: phase || null,
            groupName: groupName || null,
            semester: semester || null,
            updatedAt: new Date()
        }).where(and(eq(templates.id, id), eq(templates.userId, userId))).returning();
        
        if (updated.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json(updated[0]);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

router.delete('/:id', async (req, res) => {
    const userId = (req as any).user.id;
    const { id } = req.params;
    
    try {
        const deleted = await db.delete(templates)
            .where(and(eq(templates.id, id), eq(templates.userId, userId)))
            .returning();
            
        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Template not found' });
        }
        res.json({ success: true });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
