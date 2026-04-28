import { Router } from 'express';
import { db } from '../db';
import { students, schoolInfo, reports, templates, classes } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();

router.use(requireAuth);

router.get('/', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const userStudents = await db.select().from(students).where(eq(students.userId, userId));
        const userSchoolInfo = await db.select().from(schoolInfo).where(eq(schoolInfo.userId, userId));
        const userReports = await db.select().from(reports).where(eq(reports.userId, userId));
        const userTemplates = await db.select().from(templates).where(eq(templates.userId, userId));
        const userClasses = await db.select().from(classes).where(eq(classes.userId, userId));

        const backupData = {
            exportDate: new Date().toISOString(),
            version: "1.0",
            data: {
                students: userStudents,
                schoolInfo: userSchoolInfo,
                reports: userReports,
                templates: userTemplates,
                classes: userClasses
            }
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename=raportk_backup_${new Date().getTime()}.json`);
        res.send(JSON.stringify(backupData, null, 2));
    } catch (error) {
        console.error("Backup failed", error);
        res.status(500).json({ error: 'Failed to generate backup' });
    }
});

export default router;
