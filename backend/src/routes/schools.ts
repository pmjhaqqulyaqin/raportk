import { Router } from 'express';
import { db } from '../db';
import { schools, schoolMembers, schoolInfo, user, students, reports } from '../db/schema';
import { eq, and, count } from 'drizzle-orm';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

// GET /api/schools/my — Get current user's school hub
router.get('/my', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        // Find user's school membership
        const membership = await db.select({
            memberId: schoolMembers.id,
            role: schoolMembers.role,
            classGroup: schoolMembers.classGroup,
            schoolId: schools.id,
            npsn: schools.npsn,
            schoolName: schools.name,
            address: schools.address,
            logoUrl: schools.logoUrl,
        })
        .from(schoolMembers)
        .innerJoin(schools, eq(schoolMembers.schoolId, schools.id))
        .where(eq(schoolMembers.userId, userId));

        if (membership.length === 0) {
            return res.json(null);
        }

        res.json(membership[0]);
    } catch (error) {
        console.error('Get school error:', error);
        res.status(500).json({ error: 'Failed to fetch school data' });
    }
});

// POST /api/schools/join — Join or create school by NPSN
router.post('/join', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn, schoolName } = req.body;

    if (!npsn || npsn.length < 8) {
        return res.status(400).json({ error: 'NPSN harus 8 digit' });
    }

    try {
        // Check if user already belongs to a school
        const existingMembership = await db.select().from(schoolMembers).where(eq(schoolMembers.userId, userId));
        if (existingMembership.length > 0) {
            return res.status(400).json({ error: 'Anda sudah tergabung dalam sebuah sekolah. Keluar dulu sebelum bergabung ke sekolah lain.' });
        }

        // Check if school with this NPSN already exists
        let school = await db.select().from(schools).where(eq(schools.npsn, npsn));

        let schoolId: string;
        let isFirstMember = false;

        if (school.length === 0) {
            // Create new school — first person becomes admin
            const created = await db.insert(schools).values({
                npsn,
                name: schoolName || `Sekolah NPSN ${npsn}`,
            }).returning();
            schoolId = created[0].id;
            isFirstMember = true;
        } else {
            schoolId = school[0].id;
        }

        // Add user as member
        const role = isFirstMember ? 'admin' : 'guru';
        const member = await db.insert(schoolMembers).values({
            schoolId,
            userId,
            role,
        }).returning();

        // Also update schoolInfo NPSN for this user
        const existingInfo = await db.select().from(schoolInfo).where(eq(schoolInfo.userId, userId));
        if (existingInfo.length > 0) {
            await db.update(schoolInfo).set({ npsn }).where(eq(schoolInfo.userId, userId));
        }

        const schoolData = await db.select().from(schools).where(eq(schools.id, schoolId));

        res.json({
            success: true,
            role,
            school: schoolData[0],
            message: isFirstMember
                ? `Sekolah "${schoolData[0].name}" berhasil dibuat. Anda menjadi Admin.`
                : `Berhasil bergabung ke "${schoolData[0].name}" sebagai Guru.`,
        });
    } catch (error) {
        console.error('Join school error:', error);
        res.status(500).json({ error: 'Gagal bergabung ke sekolah' });
    }
});

// GET /api/schools/:npsn/members — List all members of a school
router.get('/:npsn/members', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;

    try {
        // Verify user belongs to this school
        const school = await db.select().from(schools).where(eq(schools.npsn, npsn));
        if (school.length === 0) return res.status(404).json({ error: 'Sekolah tidak ditemukan' });

        const isMember = await db.select().from(schoolMembers)
            .where(and(eq(schoolMembers.schoolId, school[0].id), eq(schoolMembers.userId, userId)));
        if (isMember.length === 0) return res.status(403).json({ error: 'Anda bukan anggota sekolah ini' });

        // Get all members with user info
        const members = await db.select({
            memberId: schoolMembers.id,
            role: schoolMembers.role,
            classGroup: schoolMembers.classGroup,
            joinedAt: schoolMembers.joinedAt,
            userId: user.id,
            userName: user.name,
            userEmail: user.email,
            userImage: user.image,
        })
        .from(schoolMembers)
        .innerJoin(user, eq(schoolMembers.userId, user.id))
        .where(eq(schoolMembers.schoolId, school[0].id));

        res.json(members);
    } catch (error) {
        console.error('List members error:', error);
        res.status(500).json({ error: 'Gagal memuat daftar anggota' });
    }
});

// GET /api/schools/:npsn/progress — Raport progress for all members (kepsek dashboard)
router.get('/:npsn/progress', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;

    try {
        const school = await db.select().from(schools).where(eq(schools.npsn, npsn));
        if (school.length === 0) return res.status(404).json({ error: 'Sekolah tidak ditemukan' });

        // Verify membership
        const isMember = await db.select().from(schoolMembers)
            .where(and(eq(schoolMembers.schoolId, school[0].id), eq(schoolMembers.userId, userId)));
        if (isMember.length === 0) return res.status(403).json({ error: 'Akses ditolak' });

        // Get all members
        const members = await db.select({
            userId: schoolMembers.userId,
            role: schoolMembers.role,
            classGroup: schoolMembers.classGroup,
            userName: user.name,
        })
        .from(schoolMembers)
        .innerJoin(user, eq(schoolMembers.userId, user.id))
        .where(eq(schoolMembers.schoolId, school[0].id));

        // For each member, count students and completed reports
        const progress = await Promise.all(members.map(async (member) => {
            const studentList = await db.select({ id: students.id })
                .from(students).where(eq(students.userId, member.userId));

            const totalStudents = studentList.length;

            // Count reports that have at least one narrative filled
            let completedReports = 0;
            if (totalStudents > 0) {
                const reportList = await db.select()
                    .from(reports).where(eq(reports.userId, member.userId));
                completedReports = reportList.filter(r =>
                    (r.agama && r.agama.length > 10) ||
                    (r.jatiDiri && r.jatiDiri.length > 10) ||
                    (r.literasi && r.literasi.length > 10)
                ).length;
            }

            return {
                userId: member.userId,
                userName: member.userName,
                role: member.role,
                classGroup: member.classGroup,
                totalStudents,
                completedReports,
                percentage: totalStudents > 0 ? Math.round((completedReports / totalStudents) * 100) : 0,
            };
        }));

        res.json({
            school: school[0],
            members: progress,
            totalStudents: progress.reduce((sum, p) => sum + p.totalStudents, 0),
            totalCompleted: progress.reduce((sum, p) => sum + p.completedReports, 0),
        });
    } catch (error) {
        console.error('Progress error:', error);
        res.status(500).json({ error: 'Gagal memuat progress' });
    }
});

// PUT /api/schools/:npsn — Update school info (admin only)
router.put('/:npsn', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const { name, address } = req.body;

    try {
        const school = await db.select().from(schools).where(eq(schools.npsn, npsn));
        if (school.length === 0) return res.status(404).json({ error: 'Sekolah tidak ditemukan' });

        // Check admin role
        const membership = await db.select().from(schoolMembers)
            .where(and(eq(schoolMembers.schoolId, school[0].id), eq(schoolMembers.userId, userId)));
        if (membership.length === 0 || membership[0].role !== 'admin') {
            return res.status(403).json({ error: 'Hanya admin yang bisa mengubah data sekolah' });
        }

        const updated = await db.update(schools).set({
            name: name || school[0].name,
            address: address || school[0].address,
            updatedAt: new Date(),
        }).where(eq(schools.id, school[0].id)).returning();

        res.json(updated[0]);
    } catch (error) {
        console.error('Update school error:', error);
        res.status(500).json({ error: 'Gagal mengupdate data sekolah' });
    }
});

// DELETE /api/schools/leave — Leave current school
router.delete('/leave', async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const deleted = await db.delete(schoolMembers)
            .where(eq(schoolMembers.userId, userId))
            .returning();

        if (deleted.length === 0) {
            return res.status(404).json({ error: 'Anda tidak tergabung di sekolah manapun' });
        }

        res.json({ success: true, message: 'Berhasil keluar dari sekolah' });
    } catch (error) {
        console.error('Leave school error:', error);
        res.status(500).json({ error: 'Gagal keluar dari sekolah' });
    }
});

// =============================================
// PHASE 2: DATA SHARING
// =============================================

// Helper: verify school membership and get school
async function verifyMembership(userId: string, npsn: string) {
    const school = await db.select().from(schools).where(eq(schools.npsn, npsn));
    if (school.length === 0) return null;
    const membership = await db.select().from(schoolMembers)
        .where(and(eq(schoolMembers.schoolId, school[0].id), eq(schoolMembers.userId, userId)));
    if (membership.length === 0) return null;
    return { school: school[0], membership: membership[0] };
}

// GET /api/schools/:npsn/students — All students across all teachers in the school
router.get('/:npsn/students', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;

    try {
        const ctx = await verifyMembership(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        // Get all members
        const members = await db.select({
            userId: schoolMembers.userId,
            userName: user.name,
            classGroup: schoolMembers.classGroup,
        })
        .from(schoolMembers)
        .innerJoin(user, eq(schoolMembers.userId, user.id))
        .where(eq(schoolMembers.schoolId, ctx.school.id));

        // Get students per member
        const allStudents = await Promise.all(members.map(async (member) => {
            const studentList = await db.select().from(students)
                .where(eq(students.userId, member.userId));
            return studentList.map(s => ({
                ...s,
                teacherName: member.userName,
                teacherId: member.userId,
                teacherClassGroup: member.classGroup,
            }));
        }));

        res.json(allStudents.flat());
    } catch (error) {
        console.error('School students error:', error);
        res.status(500).json({ error: 'Gagal memuat data siswa sekolah' });
    }
});

// POST /api/schools/:npsn/import-students — Copy students from another teacher
router.post('/:npsn/import-students', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const { studentIds, fromUserId } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
        return res.status(400).json({ error: 'Pilih minimal 1 siswa untuk diimpor' });
    }

    try {
        const ctx = await verifyMembership(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        // Verify source teacher is in the same school
        const sourceMember = await db.select().from(schoolMembers)
            .where(and(eq(schoolMembers.schoolId, ctx.school.id), eq(schoolMembers.userId, fromUserId)));
        if (sourceMember.length === 0) return res.status(400).json({ error: 'Guru sumber bukan anggota sekolah ini' });

        // Get source students
        const sourceStudents = await db.select().from(students)
            .where(eq(students.userId, fromUserId));
        const toImport = sourceStudents.filter(s => studentIds.includes(s.id));

        if (toImport.length === 0) return res.status(400).json({ error: 'Tidak ada siswa yang valid untuk diimpor' });

        // Check for duplicates in current user's students by NISN or name
        const myStudents = await db.select().from(students).where(eq(students.userId, userId));
        const myNisns = new Set(myStudents.filter(s => s.nisn).map(s => s.nisn));
        const myNames = new Set(myStudents.map(s => s.name.toLowerCase().trim()));

        let skipped = 0;
        const newStudents = toImport.filter(s => {
            if (s.nisn && myNisns.has(s.nisn)) { skipped++; return false; }
            if (myNames.has(s.name.toLowerCase().trim())) { skipped++; return false; }
            return true;
        }).map(s => ({
            userId,
            name: s.name,
            height: s.height,
            weight: s.weight,
            phase: s.phase,
            group: s.group,
            gender: s.gender,
            nisn: s.nisn,
            nik: s.nik,
            birthPlace: s.birthPlace,
            birthDate: s.birthDate,
        }));

        let imported = 0;
        if (newStudents.length > 0) {
            await db.insert(students).values(newStudents);
            imported = newStudents.length;
        }

        res.json({
            success: true,
            imported,
            skipped,
            message: `${imported} siswa berhasil diimpor${skipped > 0 ? `, ${skipped} dilewati (duplikat)` : ''}.`,
        });
    } catch (error) {
        console.error('Import students error:', error);
        res.status(500).json({ error: 'Gagal mengimpor siswa' });
    }
});

// POST /api/schools/:npsn/transfer-student — Transfer student ownership to another teacher
router.post('/:npsn/transfer-student', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;
    const { studentId, toUserId } = req.body;

    try {
        const ctx = await verifyMembership(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        // Verify target teacher is in the same school
        const targetMember = await db.select().from(schoolMembers)
            .where(and(eq(schoolMembers.schoolId, ctx.school.id), eq(schoolMembers.userId, toUserId)));
        if (targetMember.length === 0) return res.status(400).json({ error: 'Guru tujuan bukan anggota sekolah ini' });

        // Verify student belongs to current user
        const student = await db.select().from(students)
            .where(and(eq(students.id, studentId), eq(students.userId, userId)));
        if (student.length === 0) return res.status(404).json({ error: 'Siswa tidak ditemukan atau bukan milik Anda' });

        // Transfer: change userId
        await db.update(students).set({
            userId: toUserId,
            updatedAt: new Date(),
        }).where(eq(students.id, studentId));

        // Also transfer any reports
        await db.update(reports).set({
            userId: toUserId,
            updatedAt: new Date(),
        }).where(and(eq(reports.studentId, studentId), eq(reports.userId, userId)));

        res.json({
            success: true,
            message: `Siswa "${student[0].name}" berhasil ditransfer.`,
        });
    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({ error: 'Gagal mentransfer siswa' });
    }
});

// GET /api/schools/:npsn/duplicates — Detect duplicate students across teachers
router.get('/:npsn/duplicates', async (req, res) => {
    const userId = (req as any).user.id;
    const { npsn } = req.params;

    try {
        const ctx = await verifyMembership(userId, npsn);
        if (!ctx) return res.status(403).json({ error: 'Akses ditolak' });

        // Get all members
        const members = await db.select({
            userId: schoolMembers.userId,
            userName: user.name,
        })
        .from(schoolMembers)
        .innerJoin(user, eq(schoolMembers.userId, user.id))
        .where(eq(schoolMembers.schoolId, ctx.school.id));

        // Get ALL students
        const allStudents: any[] = [];
        for (const member of members) {
            const studentList = await db.select().from(students)
                .where(eq(students.userId, member.userId));
            studentList.forEach(s => {
                allStudents.push({ ...s, teacherName: member.userName, teacherId: member.userId });
            });
        }

        // Detect duplicates by NISN
        const nisnMap = new Map<string, any[]>();
        allStudents.forEach(s => {
            if (s.nisn) {
                const key = s.nisn.trim();
                if (!nisnMap.has(key)) nisnMap.set(key, []);
                nisnMap.get(key)!.push(s);
            }
        });

        // Detect duplicates by exact name (case-insensitive)
        const nameMap = new Map<string, any[]>();
        allStudents.forEach(s => {
            const key = s.name.toLowerCase().trim();
            if (!nameMap.has(key)) nameMap.set(key, []);
            nameMap.get(key)!.push(s);
        });

        const duplicates: any[] = [];
        const seen = new Set<string>();

        // NISN duplicates (strongest signal)
        nisnMap.forEach((group, nisn) => {
            if (group.length > 1) {
                const key = `nisn:${nisn}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    duplicates.push({
                        type: 'NISN',
                        matchKey: nisn,
                        students: group.map(s => ({
                            id: s.id, name: s.name, nisn: s.nisn, group: s.group,
                            teacherName: s.teacherName, teacherId: s.teacherId,
                        })),
                    });
                }
            }
        });

        // Name duplicates (weaker signal, only if across different teachers)
        nameMap.forEach((group, name) => {
            if (group.length > 1) {
                const teacherIds = new Set(group.map((s: any) => s.teacherId));
                if (teacherIds.size > 1) {  // Only flag if different teachers have same name
                    const key = `name:${name}`;
                    if (!seen.has(key)) {
                        seen.add(key);
                        duplicates.push({
                            type: 'Nama',
                            matchKey: name,
                            students: group.map(s => ({
                                id: s.id, name: s.name, nisn: s.nisn, group: s.group,
                                teacherName: s.teacherName, teacherId: s.teacherId,
                            })),
                        });
                    }
                }
            }
        });

        res.json({ duplicates, totalStudents: allStudents.length });
    } catch (error) {
        console.error('Duplicates error:', error);
        res.status(500).json({ error: 'Gagal mendeteksi duplikat' });
    }
});

export default router;

