import { Router } from 'express';
import { db } from '../db';
import { reports, students, schoolInfo } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// GET /api/public/raport/:token — Public (no auth required)
// Returns read-only report data for parent viewing
router.get('/raport/:token', async (req, res) => {
    const { token } = req.params;

    if (!token || token.length < 10) {
        return res.status(400).json({ error: 'Token tidak valid' });
    }

    try {
        // Find report by share token
        const reportData = await db.select().from(reports).where(eq(reports.shareToken, token));
        if (!reportData.length) {
            return res.status(404).json({ error: 'Raport tidak ditemukan atau link sudah tidak berlaku' });
        }

        const report = reportData[0];

        // Fetch student data
        const studentData = await db.select().from(students).where(eq(students.id, report.studentId));
        if (!studentData.length) {
            return res.status(404).json({ error: 'Data siswa tidak ditemukan' });
        }

        const student = studentData[0];

        // Fetch school info (from the teacher who owns the report)
        const schoolData = await db.select().from(schoolInfo).where(eq(schoolInfo.userId, report.userId));
        const school = schoolData[0] || {};

        // Return sanitized data (no internal IDs or user data)
        res.json({
            student: {
                name: student.name,
                group: student.group,
                phase: student.phase,
                gender: student.gender,
                nisn: student.nisn,
                height: student.height,
                weight: student.weight,
                birthPlace: student.birthPlace,
                birthDate: student.birthDate,
            },
            report: {
                agama: report.agama,
                jatiDiri: report.jatiDiri,
                literasi: report.literasi,
                p5: report.p5,
                attendanceSick: report.attendanceSick,
                attendancePermission: report.attendancePermission,
                attendanceUnexcused: report.attendanceUnexcused,
                parentReflection: report.parentReflection,
            },
            school: {
                schoolName: school.schoolName || '',
                location: school.location || '',
                academicYear: school.academicYear || '',
                semester: school.semester || '',
                teacher: school.teacher || '',
                teacherNip: school.teacherNip || '',
                principal: school.principal || '',
                principalNip: school.principalNip || '',
                date: school.date || '',
            }
        });
    } catch (error) {
        console.error('Public raport error:', error);
        res.status(500).json({ error: 'Gagal memuat raport' });
    }
});

export default router;
