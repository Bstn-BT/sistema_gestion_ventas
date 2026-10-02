import { useEffect, useRef, useState } from 'react';

export interface JuegoSteam {
  appid: number;
  nombre: string;
  imagen: string;
  precio_referencia_clp: number | null;
  plataformas: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  url_tienda: string;
}

interface Props {
  juego: JuegoSteam | null;
  onJuegoChange: (juego: JuegoSteam | null) => void;
  error?: string;
}

export const BuscadorJuegoSteam = ({ juego, onJuegoChange, error }: Props) => {
  const [termino, setTermino] = useState('');
  const [resultados, setResultados] = useState<JuegoSteam[]>([]);
  const [buscando, setBuscando] = useState(false);
  const [mensajeError, setMensajeError] = useState('');
  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (juego && termino === juego.nombre) return;
    if (termino.trim().length < 2) {
      setResultados([]);
      setBuscando(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setBuscando(true);
      setMensajeError('');
      try {
        const response = await fetch(
          `http://localhost:3000/api/steam/juegos?q=${encodeURIComponent(termino.trim())}`,
          { signal: controller.signal },
        );
        const data = await response.json();
        if (!response.ok || !data.exito) throw new Error(data.mensaje || 'No se pudo buscar en Steam');
        setResultados(data.juegos || []);
        setAbierto(true);
      } catch (fetchError) {
        if ((fetchError as Error).name !== 'AbortError') {
          setResultados([]);
          setMensajeError((fetchError as Error).message);
        }
      } finally {
        if (!controller.signal.aborted) setBuscando(false);
      }
    }, 350);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [termino, juego]);

  useEffect(() => {
    const cerrar = (event: MouseEvent) => {
      if (contenedorRef.current && !contenedorRef.current.contains(event.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const seleccionarJuego = (seleccion: JuegoSteam) => {
    onJuegoChange(seleccion);
    setTermino(seleccion.nombre);
    setResultados([]);
    setAbierto(false);
    setMensajeError('');
  };

  return (
    <div className="mt-5 max-w-xl" ref={contenedorRef} data-error={!!error}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Juego recibido de Steam</label>
      <div className="relative">
        <img src="/steam.svg" alt="" className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5" />
        <input
          type="text"
          value={termino}
          onFocus={() => resultados.length > 0 && setAbierto(true)}
          onChange={(event) => {
            const value = event.target.value;
            setTermino(value);
            if (juego && value !== juego.nombre) onJuegoChange(null);
          }}
          placeholder="Escribe el nombre del juego..."
          autoComplete="off"
          className={`w-full pl-11 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
            error ? 'border-red-500 bg-red-50 focus:ring-red-400' : 'border-slate-300 bg-white focus:ring-blue-500'
          }`}
        />
        {buscando && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
        )}

        {abierto && !buscando && (
          <div className="absolute z-30 top-full mt-1 w-full max-h-80 overflow-y-auto bg-white border border-slate-200 rounded-xl shadow-xl">
            {resultados.length > 0 ? resultados.map((resultado) => (
              <button
                type="button"
                key={resultado.appid}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => seleccionarJuego(resultado)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-blue-50 border-b border-slate-100 last:border-b-0 cursor-pointer"
              >
                <img src={resultado.imagen} alt="" className="h-12 w-24 rounded object-cover bg-slate-100 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-slate-800 truncate">{resultado.nombre}</span>
                  <span className="block text-xs text-slate-400 mt-0.5">
                    App ID {resultado.appid}
                    {resultado.precio_referencia_clp !== null
                      ? ` • Referencia $${resultado.precio_referencia_clp.toLocaleString('es-CL')} CLP`
                      : ' • Sin precio publicado'}
                  </span>
                </span>
              </button>
            )) : (
              <p className="p-4 text-sm text-slate-500 text-center">No se encontraron juegos con ese nombre.</p>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-slate-400 mt-1.5">Selecciona un resultado de Steam.</p>
      {(error || mensajeError) && <p className="text-red-500 text-xs mt-1.5 font-medium">▲ {error || mensajeError}</p>}

      {juego && (
        <div className="mt-3 flex gap-3 items-center rounded-xl border border-blue-200 bg-blue-50 p-3">
          <img src={juego.imagen} alt="" className="h-16 w-28 rounded-lg object-cover bg-slate-100" />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 truncate">{juego.nombre}</p>
            <p className="text-xs text-slate-500 mt-0.5">Steam App ID: {juego.appid}</p>
            <p className="text-xs text-slate-500 mt-1">
              {[
                juego.plataformas.windows && 'Windows',
                juego.plataformas.mac && 'macOS',
                juego.plataformas.linux && 'Linux',
              ].filter(Boolean).join(' • ') || 'Plataformas no informadas'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
