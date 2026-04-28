import { Router } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { requireAuth } from '../middleware/authMiddleware';

const router = Router();
router.use(requireAuth);

const getModel = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY not configured');
    const genAI = new GoogleGenerativeAI(apiKey);
    return genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
};

const generateWithRetry = async (model: any, prompt: string, retries = 2): Promise<string> => {
    try {
        const result = await model.generateContent(prompt);
        return result.response.text().trim();
    } catch (err: any) {
        if (retries > 0 && err?.status === 429) {
            await new Promise(r => setTimeout(r, 12000));
            return generateWithRetry(model, prompt, retries - 1);
        }
        throw err;
    }
};

// Generate narasi from keywords
router.post('/generate', async (req, res) => {
    const { category, keywords, studentName, tone } = req.body;

    if (!keywords || !category) {
        return res.status(400).json({ error: 'Keywords and category are required' });
    }

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
        const model = getModel();
        const text = await generateWithRetry(model, prompt);
        res.json({ text });
    } catch (error: any) {
        console.error('AI generation error:', error?.message);
        if (error?.message?.includes('API_KEY')) {
            return res.status(500).json({ error: 'Gemini API key belum dikonfigurasi. Tambahkan GEMINI_API_KEY di file .env' });
        }
        res.status(500).json({ error: 'Gagal generate narasi: ' + (error?.message || 'Unknown error') });
    }
});

// Suggest variations based on existing text
router.post('/variations', async (req, res) => {
    const { text, category } = req.body;

    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
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
        const model = getModel();
        const raw = await generateWithRetry(model, prompt);
        const variations = raw.split('---').map((v: string) => v.trim()).filter((v: string) => v.length > 20);
        res.json({ variations });
    } catch (error: any) {
        console.error('AI variations error:', error?.message);
        res.status(500).json({ error: 'Gagal generate variasi' });
    }
});

export default router;
