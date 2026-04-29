import { Response } from 'express';

// In-memory SSE client registry, keyed by school NPSN
const clients = new Map<string, Set<Response>>();

// ─── Heartbeat: ping every 30s to keep connections alive ──
setInterval(() => {
    const ping = `:ping ${Date.now()}\n\n`;
    clients.forEach((pool) => {
        pool.forEach(res => {
            try { res.write(ping); } catch { /* client gone */ }
        });
    });
}, 30000);

// ─── Auto-cleanup: drop idle connections after 1 hour ─────
const connectionTimers = new WeakMap<Response, NodeJS.Timeout>();

export function addClient(npsn: string, res: Response) {
    if (!clients.has(npsn)) clients.set(npsn, new Set());

    // Max 5 connections per school (prevent flooding)
    const pool = clients.get(npsn)!;
    if (pool.size >= 50) {
        // Drop oldest connection
        const oldest = pool.values().next().value;
        if (oldest) {
            try { oldest.end(); } catch {}
            pool.delete(oldest);
        }
    }

    pool.add(res);

    // Auto-close after 1 hour (client will auto-reconnect via EventSource)
    const timer = setTimeout(() => {
        try { res.end(); } catch {}
        pool.delete(res);
        if (pool.size === 0) clients.delete(npsn);
    }, 60 * 60 * 1000);

    connectionTimers.set(res, timer);

    res.on('close', () => {
        const t = connectionTimers.get(res);
        if (t) clearTimeout(t);
        pool.delete(res);
        if (pool.size === 0) clients.delete(npsn);
    });
}

export function broadcast(npsn: string, event: string, data: any) {
    const pool = clients.get(npsn);
    if (!pool || pool.size === 0) return;
    const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    pool.forEach(res => {
        try { res.write(msg); } catch { /* client gone */ }
    });
}

export function getClientCount(npsn: string): number {
    return clients.get(npsn)?.size || 0;
}
