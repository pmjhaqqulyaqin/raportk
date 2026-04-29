import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

// ─── Multi-Key Rotation ─────────────────────────────────
let keyIndex = 0;
const getApiKeys = (): string[] => {
    const raw = process.env.GEMINI_API_KEY || '';
    return raw.split(',').map(k => k.trim()).filter(Boolean);
};

// ─── In-Memory Cache ─────────────────────────────────────
const cache = new Map<string, { text: string; ts: number }>();
const CACHE_TTL = 1000 * 60 * 60 * 24;
const MAX_CACHE = 200;

function getCached(key: string): string | null {
    const entry = cache.get(key);
    if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.text;
    if (entry) cache.delete(key);
    return null;
}

function setCache(key: string, text: string) {
    if (cache.size >= MAX_CACHE) {
        const oldest = cache.keys().next().value;
        if (oldest) cache.delete(oldest);
    }
    cache.set(key, { text, ts: Date.now() });
}

// ─── Provider 1: Google Gemini (multi-key × multi-model) ─
const GEMINI_MODELS = ['gemini-2.0-flash', 'gemini-1.5-flash'];

async function tryGemini(prompt: string): Promise<string | null> {
    const keys = getApiKeys();
    if (keys.length === 0) return null;

    for (let ki = 0; ki < keys.length; ki++) {
        const idx = (keyIndex + ki) % keys.length;
        const genAI = new GoogleGenerativeAI(keys[idx]);

        for (const modelName of GEMINI_MODELS) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const text = result.response.text().trim();
                if (text) {
                    keyIndex = (idx + 1) % keys.length;
                    console.log(`[AI] ✓ Gemini key${idx + 1}/${modelName}`);
                    return text;
                }
            } catch (err: any) {
                const msg = err?.message || '';
                console.log(`[AI] ✗ key${idx + 1}/${modelName}: ${msg.substring(0, 60)}`);
                if (err?.status === 429 || msg.includes('429')) continue;
                if (err?.status === 403 || err?.status === 400) break;
                continue;
            }
        }
    }
    return null;
}

// ─── Provider 2: OpenRouter (free models) ─────────────────
async function tryOpenRouter(prompt: string): Promise<string | null> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) return null;

    const FREE_MODELS = [
        'google/gemini-2.0-flash-exp:free',
        'meta-llama/llama-4-maverick:free',
        'deepseek/deepseek-chat-v3-0324:free',
    ];

    for (const model of FREE_MODELS) {
        try {
            const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'HTTP-Referer': process.env.BETTER_AUTH_URL || 'https://raportk.app',
                },
                body: JSON.stringify({
                    model,
                    messages: [{ role: 'user', content: prompt }],
                    max_tokens: 500,
                }),
            });
            if (!resp.ok) continue;
            const data = await resp.json() as any;
            const text = data.choices?.[0]?.message?.content?.trim();
            if (text) {
                console.log(`[AI] ✓ OpenRouter/${model}`);
                return text;
            }
        } catch {
            continue;
        }
    }
    return null;
}

// ─── Provider 3: Offline Template Engine (NEVER fails) ────
function generateOffline(category: string, keywords: string, studentName: string): string {
    const name = studentName || 'Anak';
    const kw = keywords.split(',').map(k => k.trim()).filter(Boolean);

    const templates: Record<string, string[]> = {
        'Nilai Agama dan Budi Pekerti': [
            `${name} menunjukkan perkembangan yang baik dalam aspek nilai agama dan budi pekerti.`,
            `${name} mampu ${kw[0] || 'mengenal nilai-nilai kebaikan'} dengan antusias.`,
            kw[1] ? `Dalam kegiatan sehari-hari, ${name} juga menunjukkan kemampuan ${kw[1]}.` : `${name} mulai terbiasa menerapkan sikap sopan dan santun kepada teman dan guru.`,
            `Semangat ${name} dalam mengikuti kegiatan keagamaan patut diapresiasi.`,
        ],
        'Jati Diri': [
            `${name} menunjukkan perkembangan jati diri yang positif selama periode ini.`,
            `${name} mampu ${kw[0] || 'mengenal dirinya sendiri'} dengan percaya diri.`,
            kw[1] ? `${name} juga menunjukkan kemampuan ${kw[1]} dengan baik.` : `${name} mulai menunjukkan kemandirian dalam menyelesaikan tugas-tugasnya.`,
            `Kepercayaan diri ${name} semakin berkembang dan patut diapresiasi.`,
        ],
        'Dasar Literasi dan STEAM': [
            `${name} menunjukkan kemajuan yang menggembirakan dalam aspek literasi dan STEAM.`,
            `${name} mampu ${kw[0] || 'mengenal huruf dan angka'} dengan baik.`,
            kw[1] ? `Dalam kegiatan eksplorasi, ${name} menunjukkan kemampuan ${kw[1]}.` : `${name} menunjukkan rasa ingin tahu yang tinggi terhadap lingkungan sekitarnya.`,
            `Kreativitas dan semangat belajar ${name} terus berkembang dengan positif.`,
        ],
    };

    // Find best matching template or use generic
    const key = Object.keys(templates).find(k => category.toLowerCase().includes(k.toLowerCase().split(' ')[0]));
    const lines = templates[key || 'Jati Diri'] || templates['Jati Diri'];

    // Add remaining keywords naturally
    const extra = kw.slice(2).map(k => `${name} juga menunjukkan perkembangan dalam hal ${k}.`);
    const result = [...lines, ...extra.slice(0, 2)];

    return result.join(' ');
}

// ─── Smart Generate: Gemini → OpenRouter → Offline ────────
async function smartGenerate(prompt: string, category: string, keywords: string, studentName: string): Promise<{ text: string; source: string }> {
    // Try Gemini (5 keys × 2 models = 10 attempts)
    const geminiResult = await tryGemini(prompt);
    if (geminiResult) return { text: geminiResult, source: 'gemini' };

    // Try OpenRouter (3 free models)
    const openRouterResult = await tryOpenRouter(prompt);
    if (openRouterResult) return { text: openRouterResult, source: 'openrouter' };

    // Last resort: offline template (NEVER fails)
    console.log('[AI] ⚠ All providers failed, using offline template');
    const offlineResult = generateOffline(category, keywords, studentName);
    return { text: offlineResult, source: 'offline' };
}

// ─── Generate Narasi ─────────────────────────────────────
router.post('/generate', async (req, res) => {
    const { category, keywords, studentName, tone } = req.body;

    if (!keywords || !category) {
        return res.status(400).json({ error: 'Keywords and category are required' });
    }

    const cacheKey = `gen:${category}:${keywords}:${studentName || ''}:${tone || ''}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json({ text: cached, source: 'cache' });

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
        const { text, source } = await smartGenerate(prompt, category, keywords, studentName || '');
        setCache(cacheKey, text);
        res.json({ text, source });
    } catch (error: any) {
        console.error('AI generation error:', error?.message);
        // Even if something unexpected happens, offline NEVER fails
        const text = generateOffline(category, keywords, studentName || '');
        res.json({ text, source: 'offline' });
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
        return res.json({ variations, source: 'cache' });
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
        const { text: raw, source } = await smartGenerate(prompt, category || '', '', '');
        setCache(cacheKey, raw);
        const variations = raw.split('---').map((v: string) => v.trim()).filter((v: string) => v.length > 20);
        res.json({ variations, source });
    } catch (error: any) {
        console.error('AI variations error:', error?.message);
        res.status(500).json({ error: 'Gagal generate variasi' });
    }
});

export default router;
