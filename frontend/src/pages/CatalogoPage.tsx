import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import {
  Check,
  LoaderCircle,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

const API_CATALOGOS = 'http://localhost:3000/api/catalogos';

type TipoCatalogo = 'estilos' | 'modificadores';

interface ItemCatalogo {
  id: number;
  nombre: string;
  activo: boolean;
}

interface SeccionCatalogoProps {
  titulo: string;
  descripcion: string;
  singular: string;
  placeholder: string;
  icono: ReactNode;
  items: ItemCatalogo[];
  procesando: boolean;
  onCrear: (nombre: string) => Promise<boolean>;
  onEditar: (item: ItemCatalogo, nombre: string) => Promise<boolean>;
  onEliminar: (item: ItemCatalogo) => Promise<void>;
  onRestaurar: (item: ItemCatalogo) => Promise<void>;
}

const SeccionCatalogo = ({
  titulo,
  descripcion,
  singular,
  placeholder,
  icono,
  items,
  procesando,
  onCrear,
  onEditar,
  onEliminar,
  onRestaurar
}: SeccionCatalogoProps) => {
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [nombreEditado, setNombreEditado] = useState('');
  const activos = items.filter(item => item.activo).length;

  const crear = async (event: FormEvent) => {
    event.preventDefault();
    if (!nuevoNombre.trim()) return;

    if (await onCrear(nuevoNombre.trim())) {
      setNuevoNombre('');
    }
  };

  const comenzarEdicion = (item: ItemCatalogo) => {
    setEditandoId(item.id);
    setNombreEditado(item.nombre);
  };

  const guardarEdicion = async (item: ItemCatalogo) => {
    if (!nombreEditado.trim()) return;

    if (await onEditar(item, nombreEditado.trim())) {
      setEditandoId(null);
      setNombreEditado('');
    }
  };

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-xl bg-[#0e8571]/10 p-2.5 text-[#0e8571]">
              {icono}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">{titulo}</h2>
              <p className="mt-1 text-sm text-slate-500">{descripcion}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
            {activos} {activos === 1 ? 'activo' : 'activos'}
          </span>
        </div>

        <form onSubmit={crear} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <input
            value={nuevoNombre}
            onChange={event => setNuevoNombre(event.target.value)}
            placeholder={placeholder}
            maxLength={80}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
          />
          <button
            type="submit"
            disabled={procesando || !nuevoNombre.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1f1f2e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#0e8571] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {procesando ? <LoaderCircle size={16} className="animate-spin" /> : <Plus size={16} />}
            Añadir {singular}
          </button>
        </form>
      </div>

      <div className="divide-y divide-slate-100">
        {items.length === 0 && (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-medium text-slate-500">Aún no hay elementos en esta sección.</p>
            <p className="mt-1 text-xs text-slate-400">Añade el primero usando el campo superior.</p>
          </div>
        )}

        {items.map(item => {
          const editando = editandoId === item.id;

          return (
            <div
              key={item.id}
              className={`flex min-h-16 items-center gap-3 px-6 py-3 transition ${item.activo ? 'hover:bg-slate-50/80' : 'bg-slate-50/70'}`}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${item.activo ? 'bg-emerald-500' : 'bg-slate-300'}`} />

              {editando ? (
                <input
                  autoFocus
                  value={nombreEditado}
                  onChange={event => setNombreEditado(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') guardarEdicion(item);
                    if (event.key === 'Escape') setEditandoId(null);
                  }}
                  maxLength={80}
                  className="min-w-0 flex-1 rounded-lg border border-[#0e8571] bg-white px-3 py-2 text-sm text-slate-700 outline-none ring-2 ring-[#0e8571]/10"
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <p className={`truncate text-sm font-semibold ${item.activo ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                    {item.nombre}
                  </p>
                  {!item.activo && <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">Archivado</p>}
                </div>
              )}

              <div className="flex shrink-0 items-center gap-1">
                {editando ? (
                  <>
                    <button
                      type="button"
                      onClick={() => guardarEdicion(item)}
                      disabled={procesando || !nombreEditado.trim()}
                      title="Guardar cambios"
                      className="rounded-lg p-2 text-emerald-600 transition hover:bg-emerald-50 disabled:opacity-40"
                    >
                      <Check size={17} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoId(null)}
                      title="Cancelar edición"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X size={17} />
                    </button>
                  </>
                ) : item.activo ? (
                  <>
                    <button
                      type="button"
                      onClick={() => comenzarEdicion(item)}
                      title={`Editar ${singular}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onEliminar(item)}
                      disabled={procesando}
                      title={`Eliminar ${singular}`}
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 size={16} />
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => onRestaurar(item)}
                    disabled={procesando}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-bold text-[#0e8571] transition hover:bg-[#0e8571]/10 disabled:opacity-40"
                  >
                    <RotateCcw size={14} />
                    Restaurar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const CatalogoPage = () => {
  const [estilos, setEstilos] = useState<ItemCatalogo[]>([]);
  const [modificadores, setModificadores] = useState<ItemCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(false);
  const [errorCarga, setErrorCarga] = useState('');
  const [confirmacion, setConfirmacion] = useState<{
    tipo: TipoCatalogo;
    item: ItemCatalogo;
  } | null>(null);

  const cargarCatalogo = useCallback(async () => {
    try {
      setErrorCarga('');
      const response = await fetch(API_CATALOGOS);
      const data = await response.json();

      if (!response.ok || !data.exito) {
        throw new Error(data.mensaje || 'No fue posible cargar el catálogo');
      }

      setEstilos((data.estilos || []).map((item: any) => ({
        id: item.id_tipo_comision,
        nombre: item.nombre_estilo,
        activo: item.activo !== false
      })));
      setModificadores((data.modificadores || []).map((item: any) => ({
        id: item.id_modificador,
        nombre: item.nombre_modificador,
        activo: item.activo !== false
      })));
    } catch (error) {
      setErrorCarga(error instanceof Error ? error.message : 'No fue posible cargar el catálogo');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCatalogo();
  }, [cargarCatalogo]);

  useEffect(() => {
    if (!confirmacion) return;

    const cerrarConEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !procesando) {
        setConfirmacion(null);
      }
    };

    window.addEventListener('keydown', cerrarConEscape);
    return () => window.removeEventListener('keydown', cerrarConEscape);
  }, [confirmacion, procesando]);

  const nombreCampo = (tipo: TipoCatalogo) => tipo === 'estilos' ? 'nombre_estilo' : 'nombre_modificador';

  const solicitar = async (
    tipo: TipoCatalogo,
    metodo: 'POST' | 'PUT' | 'DELETE',
    nombre?: string,
    id?: number,
    activo = true
  ) => {
    setProcesando(true);
    try {
      const response = await fetch(`${API_CATALOGOS}/${tipo}${id ? `/${id}` : ''}`, {
        method: metodo,
        headers: metodo === 'DELETE' ? undefined : { 'Content-Type': 'application/json' },
        body: metodo === 'DELETE' ? undefined : JSON.stringify({
          [nombreCampo(tipo)]: nombre,
          activo
        })
      });
      const data = await response.json();

      if (!response.ok || !data.exito) {
        throw new Error(data.mensaje || 'No fue posible guardar los cambios');
      }

      toast.success(data.mensaje);
      await cargarCatalogo();
      return true;
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar los cambios');
      return false;
    } finally {
      setProcesando(false);
    }
  };

  const propiedades = (tipo: TipoCatalogo) => ({
    onCrear: (nombre: string) => solicitar(tipo, 'POST', nombre),
    onEditar: (item: ItemCatalogo, nombre: string) => solicitar(tipo, 'PUT', nombre, item.id, item.activo),
    onEliminar: async (item: ItemCatalogo) => {
      setConfirmacion({ tipo, item });
    },
    onRestaurar: async (item: ItemCatalogo) => {
      await solicitar(tipo, 'PUT', item.nombre, item.id, true);
    }
  });

  const confirmarEliminacion = async () => {
    if (!confirmacion) return;

    const eliminado = await solicitar(
      confirmacion.tipo,
      'DELETE',
      undefined,
      confirmacion.item.id
    );

    if (eliminado) {
      setConfirmacion(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catálogo</h1>
          <p className="mt-1 text-sm text-slate-500">Administra los estilos de dibujo y extras disponibles al crear una comisión.</p>
        </div>
      </div>

      {cargando ? (
        <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <LoaderCircle className="animate-spin text-[#0e8571]" size={28} />
        </div>
      ) : errorCarga ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
          <p className="text-sm font-semibold text-red-700">{errorCarga}</p>
          <button
            type="button"
            onClick={cargarCatalogo}
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
          <SeccionCatalogo
            titulo="Estilos de dibujo"
            descripcion="Tipos principales disponibles para cada encargo."
            singular="estilo"
            placeholder="Ej. Ilustración de cuerpo completo"
            icono={<Palette size={20} />}
            items={estilos}
            procesando={procesando}
            {...propiedades('estilos')}
          />

          <SeccionCatalogo
            titulo="Extras y modificadores"
            descripcion="Detalles adicionales que pueden sumarse al encargo."
            singular="extra"
            placeholder="Ej. Fondo detallado"
            icono={<Sparkles size={20} />}
            items={modificadores}
            procesando={procesando}
            {...propiedades('modificadores')}
          />
        </div>
      )}

      {confirmacion && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-confirmacion-eliminar"
          onMouseDown={event => {
            if (event.target === event.currentTarget && !procesando) {
              setConfirmacion(null);
            }
          }}
        >
          <div className="absolute inset-0 bg-black opacity-75 backdrop-blur-sm" />

          <div className="relative w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="absolute inset-x-0 top-0 h-2 bg-[#0e8571]" />

            <button
              type="button"
              onClick={() => setConfirmacion(null)}
              disabled={procesando}
              aria-label="Cerrar confirmación"
              className="absolute right-4 top-4 z-10 rounded-full border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
            >
              <X size={17} />
            </button>

            <div className="relative px-7 pb-6 pt-9 text-center sm:px-9">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-lg">
                <Trash2 size={27} strokeWidth={2.2} />
              </div>

              <p className="mt-5 text-xs font-black uppercase tracking-widest text-red-500">
                Confirmar eliminación
              </p>
              <h2 id="titulo-confirmacion-eliminar" className="mt-2 text-xl font-extrabold text-slate-800">
                ¿Eliminar este {confirmacion.tipo === 'estilos' ? 'estilo' : 'extra'}?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">
                Este elemento dejará de estar disponible al registrar nuevas comisiones.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5">
                <p className="truncate text-sm font-bold text-slate-700">{confirmacion.item.nombre}</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  {confirmacion.tipo === 'estilos' ? 'Estilo de dibujo' : 'Extra / Modificador'}
                </p>
              </div>

              <div className="mt-4 flex items-start gap-2 rounded-2xl border border-slate-200 bg-emerald-50 px-4 py-3 text-left">
                <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#0e8571] text-[11px] font-black text-white">i</div>
                <p className="text-xs leading-5 text-[#086455]">
                  Tus comisiones antiguas conservarán este dato y podrás restaurarlo cuando quieras.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50/80 px-7 py-5 sm:px-9">
              <button
                type="button"
                onClick={() => setConfirmacion(null)}
                disabled={procesando}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={procesando}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {procesando ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
                {procesando ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
