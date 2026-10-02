import { useEffect, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Modificador {
  id: number;
  nombre: string;
}

interface ListaModificadoresProps {
  onExtrasChange: (extras: any[]) => void;
  divisa: string;
  esPagoEnJuego?: boolean;
}

export const ListaModificadores = ({ onExtrasChange, divisa, esPagoEnJuego = false }: ListaModificadoresProps) => {
  const [modificadores, setModificadores] = useState<Modificador[]>([]);
  const [seleccionados, setSeleccionados] = useState<{ [key: number]: boolean }>({});
  const [preciosLocales, setPreciosLocales] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    const cargarModificadores = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/catalogos');
        const data = await res.json();
        const mapeo = (data.modificadores || [])
          .filter((m: any) => m.activo !== false)
          .map((m: any) => ({
            id: m.id_modificador,
            nombre: m.nombre_modificador
          }));
        setModificadores(mapeo);
      } catch (error) {
        console.error('Error cargando modificadores:', error);
      }
    };

    cargarModificadores();
  }, []);

  useEffect(() => {
    const extrasActivos = Object.keys(seleccionados)
      .filter(id => seleccionados[Number(id)])
      .map(id => ({
        id: Number(id),
        precio: esPagoEnJuego ? 0 : (preciosLocales[Number(id)] || 0)
      }));

    onExtrasChange(extrasActivos);
  }, [seleccionados, preciosLocales, onExtrasChange, esPagoEnJuego]);

  const handleCheckboxChange = (id: number) => {
    setSeleccionados(prev => ({ ...prev, [id]: !prev[id] }));
    if (seleccionados[id]) {
      setPreciosLocales(prev => {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      });
    }
  };

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-700 mb-3">Extras / Modificadores</p>

      <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50 mb-3">
        {modificadores.length === 0 && (
          <p className="py-5 text-center text-sm text-slate-400">No hay extras activos en el catálogo.</p>
        )}

        {modificadores.map((mod) => (
          <div key={mod.id} className={`grid ${esPagoEnJuego ? 'grid-cols-1' : 'grid-cols-[1fr_120px]'} items-center gap-3 p-2 bg-white rounded-md border border-slate-100 shadow-xs`}>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!seleccionados[mod.id]}
                onChange={() => handleCheckboxChange(mod.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              />
              <span className="text-sm text-slate-700 font-medium">{mod.nombre}</span>
            </label>

            {!esPagoEnJuego && (
              <div className="flex items-center justify-end space-x-1">
                <span className={seleccionados[mod.id] ? 'text-xs text-slate-400 font-semibold' : 'text-xs text-transparent font-semibold'}>{divisa}</span>
                <input
                  type="number"
                  placeholder={divisa === 'CLP' ? '5000' : 'Precio'}
                  value={preciosLocales[mod.id] || ''}
                  onChange={(e) => setPreciosLocales(prev => ({ ...prev, [mod.id]: e.target.value }))}
                  className={`w-20 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right ${seleccionados[mod.id] ? '' : 'opacity-0 pointer-events-none'}`}
                  disabled={!seleccionados[mod.id]}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end">
        <Link
          to="/catalogo"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0e8571] hover:text-[#086455] transition-colors"
        >
          <SlidersHorizontal size={14} />
          Administrar extras en Catálogo
        </Link>
      </div>
    </div>
  );
};
