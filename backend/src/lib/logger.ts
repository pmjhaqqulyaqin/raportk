/**
 * Simple structured logger — replaces raw console.log/error.
 * Outputs [LEVEL] [timestamp] [tag] message format.
 * Easy to upgrade to pino/winston later without changing call sites.
 */

const ts = () => new Date().toISOString().substring(11, 23); // HH:mm:ss.SSS

export const log = {
    info: (tag: string, msg: string, data?: any) => {
        console.log(`[INFO]  ${ts()} [${tag}] ${msg}`, data !== undefined ? data : '');
    },
    warn: (tag: string, msg: string, data?: any) => {
        console.warn(`[WARN]  ${ts()} [${tag}] ${msg}`, data !== undefined ? data : '');
    },
    error: (tag: string, msg: string, data?: any) => {
        console.error(`[ERROR] ${ts()} [${tag}] ${msg}`, data !== undefined ? data : '');
    },
    debug: (tag: string, msg: string, data?: any) => {
        if (process.env.NODE_ENV !== 'production') {
            console.debug(`[DEBUG] ${ts()} [${tag}] ${msg}`, data !== undefined ? data : '');
        }
    },
};
