import { Request, Response } from 'express';

interface SteamStoreItem {
    type: string;
    id: number;
    name: string;
    tiny_image?: string;
    price?: {
        currency: string;
        initial: number;
        final: number;
    };
    platforms?: {
        windows?: boolean;
        mac?: boolean;
        linux?: boolean;
    };
}

interface SteamSearchResponse {
    total: number;
    items?: SteamStoreItem[];
}

interface CacheEntry {
    expiresAt: number;
    juegos: ReturnType<typeof mapearJuego>[];
}

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_CACHE_ENTRIES = 100;
const cache = new Map<string, CacheEntry>();

const mapearJuego = (item: SteamStoreItem) => ({
    appid: item.id,
    nombre: item.name,
    imagen: item.tiny_image || `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${item.id}/capsule_231x87.jpg`,
    precio_referencia_clp: item.price?.currency === 'CLP' ? Math.round(item.price.final / 100) : null,
    plataformas: {
        windows: Boolean(item.platforms?.windows),
        mac: Boolean(item.platforms?.mac),
        linux: Boolean(item.platforms?.linux),
    },
    url_tienda: `https://store.steampowered.com/app/${item.id}`,
});

export const buscarJuegosSteam = async (req: Request, res: Response) => {
    const termino = String(req.query.q || '').trim();

    if (termino.length < 2) {
        return res.status(200).json({ exito: true, juegos: [] });
    }
    if (termino.length > 80) {
        return res.status(400).json({ exito: false, mensaje: 'El nombre del juego es demasiado largo' });
    }

    const cacheKey = termino.toLocaleLowerCase('es');
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return res.status(200).json({ exito: true, juegos: cached.juegos });
    }

    try {
        const url = new URL('https://store.steampowered.com/api/storesearch/');
        url.searchParams.set('term', termino);
        url.searchParams.set('l', 'spanish');
        url.searchParams.set('cc', 'CL');

        const respuesta = await fetch(url, {
            headers: { 'User-Agent': 'SistemaGestionComisiones/1.0' },
            signal: AbortSignal.timeout(10000),
        });

        if (!respuesta.ok) {
            throw new Error(`Steam respondió con estado ${respuesta.status}`);
        }

        const data = await respuesta.json() as SteamSearchResponse;
        const juegos = (data.items || [])
            .filter((item) => item.type === 'app' && item.id > 0 && item.name?.trim())
            .slice(0, 12)
            .map(mapearJuego);

        if (cache.size >= MAX_CACHE_ENTRIES) {
            const oldestKey = cache.keys().next().value;
            if (oldestKey) cache.delete(oldestKey);
        }
        cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, juegos });

        return res.status(200).json({ exito: true, juegos });
    } catch (error) {
        console.error('Error buscando juegos en Steam:', error);
        return res.status(502).json({
            exito: false,
            mensaje: 'Steam no está disponible en este momento. Intenta nuevamente.'
        });
    }
};
