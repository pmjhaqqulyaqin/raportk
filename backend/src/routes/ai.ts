import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

// ─── Multi-Key Rotation ─────────────────────────────────
// Support comma-separated keys: GEMINI_API_KEY=key1,key2,key3
let keyIndex = 0;
const getApiKeys = (): string[] => {
    const raw = process.env.GEMINI_API_KEY || '';
    return raw.split(',').map(k => k.trim()).filter(Boolean);
};

// ─── Model Fallback Chain ────────────────────────────────
const MODEL_CHAIN = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-2.0-flash-lite'];

// ─── In-Memory Cache ─────────────────────────────────────
const cache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours
const MAX_CACHE = 200;

function getCached(key: string): string | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.text;
    if (entry) cache.delete(key);
    return null;
}

function setCache(key: string, text: string) {
    if (cache.size >= MAX_CACHE) {
        // Evict oldest
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { text, ts: Date.now() });
}

// ─── Smart Generate with Key Rotation + Model Fallback ───
async function smartGenerate(prompt: string): Promise<string> {
    const keys = getApiKeys();
    if (keys.length === 0) throw new Error('GEMINI_API_KEY not configured');

    // Try each key × each model
    const errors: string[] = [];
    for (let ki = 0; ki < keys.length; ki++) {
        const currentKeyIdx = (keyIndex + ki) % keys.length;
        const apiKey = keys[currentKeyIdx];
        const genAI = new GoogleGenerativeAI(apiKey);

        for (const modelName of MODEL_CHAIN) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = result.response.text().trim();
                if (text) {
                    // Rotate to next key for next request (spread load)
                    keyIndex = (currentKeyIdx + 1) % keys.length;
                    return text;
                }
            } catch (err: any) {
                const msg = err?.message || '';
                errors.push(`[key${currentKeyIdx + 1}/${modelName}]: ${msg.substring(0, 80)}`);
                // If 429 (rate limit), try next key/model immediately
                if (err?.status === 429 || msg.includes('429')) continue;
                // If other error (invalid key etc), try next key
                if (err?.status === 403 || err?.status === 400) break;
                // Unknown error, try next
                continue;
            }
        }
    }

    // All keys and models exhausted — last resort: wait and retry once
    await new Promise(r => setTimeout(r, 16000));
    const fallbackKey = keys[keyIndex % keys.length];
    const genAI = new GoogleGenerativeAI(fallbackKey);
    const model = genAI.getGenerativeModel({ model: MODEL_CHAIN[MODEL_CHAIN.length - 1] });
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

// ─── Generate Narasi ─────────────────────────────────────
router.post('/generate', async (req, res) => {
    const { category, keywords, studentName, tone } = req.body;

    if (!keywords || !category) {
        return res.status(400).json({ error: 'Keywords and category are required' });
    }

    // Cache key based on inputs
    const cacheKey = `gen:${category}:${keywords}:${studentName || ''}:${tone || ''}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ text: cached, fromCache: true });

    const prompt = `Kamu adalah guru TK/PAUD berpengalaman di Indonesia. Buatkan narasi capaian pembelajaran untuk laporan raport anak usia dini (Kurikulum Merdeka).

Bagian: ${category}
Nama anak: ${studentName || '[nama]'}
Kata kunci perkembangan: ${keywords}
Nada: ${tone || 'positif dan suportif'}

Aturan:
- Tulis 3-5 kalimat narasi yang natural, positif, dan profesional
- Gunakan bahasa Indonesia formal tapi hangat
- Sebutkan nama anak secara natural dalam narasi
- Fokus pada perkembangan dan capaian positif anak
- Jangan gunakan bullet point, tulis dalam paragraf
- Jangan tambahkan pengantar atau penutup, langsung narasi saja`;

    try {
        const text = await smartGenerate(prompt);
        setCache(cacheKey, text);
        res.json({ text });
    } catch (error: any) {
        console.error('AI generation error:', error?.message);
        if (error?.message?.includes('API_KEY') || error?.message?.includes('not configured')) {
            return res.status(500).json({ error: 'Gemini API key belum dikonfigurasi. Tambahkan GEMINI_API_KEY di file .env' });
        }
        res.status(500).json({ error: 'Semua API key dan model kehabisan kuota. Coba lagi nanti atau tambahkan API key baru di GEMINI_API_KEY (pisahkan dengan koma).' });
    }
});

// ─── Variations ──────────────────────────────────────────
router.post('/variations', async (req, res) => {
    const { text, category } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }

    const cacheKey = `var:${text.substring(0, 50)}:${category || ''}`;
    const cached = getCached(cacheKey);
    if (cached) {
        const variations = cached.split('---').map((v: string) => v.trim()).filter((v: string) => v.length > 20);
        return res.json({ variations, fromCache: true });
    }

    const prompt = `Kamu adalah guru TK/PAUD berpengalaman. Berikut adalah narasi raport yang sudah ada:

"${text}"

Bagian: ${category || 'Umum'}

Buatkan 2 variasi narasi alternatif dengan gaya penulisan berbeda tapi makna serupa. Gunakan nama yang sama dengan narasi asli. Format output: pisahkan setiap variasi dengan "---" (tiga strip).

Aturan:
- Bahasa Indonesia formal tapi hangat
- Setiap variasi 3-5 kalimat
- Langsung tulis narasi, tanpa nomor atau label`;

    try {
        const raw = await smartGenerate(prompt);
        setCache(cacheKey, raw);
        const variations = raw.split('---').map((v: string) => v.trim()).filter((v: string) => v.length > 20);
        res.json({ variations });
    } catch (error: any) {
        console.error('AI variations error:', error?.message);
        res.status(500).json({ error: 'Semua API key kehabisan kuota. Coba lagi nanti.' });
    }
});

export default router;
