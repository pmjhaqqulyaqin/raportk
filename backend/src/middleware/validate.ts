import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

/**
 * Express middleware that validates req.body against a Zod schema.
 * Returns 400 with detailed error messages if validation fails.
 */
export function validateBody(schema: ZodSchema) {
    return (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.body);
        if (!result.success) {
            const issues = (result.error as any).issues || (result.error as any).errors || [];
            const errors = issues.map((e: any) => `${(e.path || []).join('.')}: ${e.message}`);
            return res.status(400).json({ error: 'Validasi gagal', details: errors });
        }
        req.body = result.data;
        next();
    };
}

// ─── Reusable Schemas ────────────────────────────────────

export const chatSendSchema = z.object({
    message: z.string().min(1, 'Pesan tidak boleh kosong').max(1000, 'Maks 1000 karakter'),
    recipientId: z.string().optional(),
    replyTo: z.string().uuid().optional(),
});

export const chatEditSchema = z.object({
    message: z.string().min(1, 'Pesan tidak boleh kosong').max(1000, 'Maks 1000 karakter'),
});

export const aiGenerateSchema = z.object({
    category: z.string().min(1, 'Kategori wajib diisi'),
    keywords: z.string().min(1, 'Keywords wajib diisi'),
    studentName: z.string().optional(),
    tone: z.string().optional(),
});

export const studentSchema = z.object({
    name: z.string().min(1, 'Nama wajib diisi').max(100),
    height: z.number().int().min(0).max(300).optional().nullable(),
    weight: z.number().int().min(0).max(300).optional().nullable(),
    phase: z.string().optional(),
    group: z.string().optional(),
    gender: z.string().max(1).optional().nullable(),
    classId: z.string().uuid().optional().nullable(),
    nisn: z.string().max(20).optional().nullable(),
    nik: z.string().max(20).optional().nullable(),
    birthPlace: z.string().max(100).optional().nullable(),
    birthDate: z.string().max(20).optional().nullable(),
});

export const schoolJoinSchema = z.object({
    npsn: z.string().min(1, 'NPSN wajib diisi').max(20),
    schoolName: z.string().min(1, 'Nama sekolah wajib diisi').max(200),
});
