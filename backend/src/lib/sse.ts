import { Response } from 'express';

// In-memory SSE client registry, keyed by school NPSN
const clients = new Map<string, Set<Response>>();

export function addClient(npsn: string, res: Response) {
    if (!clients.has(npsn)) clients.set(npsn, new Set());
    clients.get(npsn)!.add(res);
    res.on('close', () => {
        clients.get(npsn)?.delete(res);
        if (clients.get(npsn)?.size === 0) clients.delete(npsn);
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
