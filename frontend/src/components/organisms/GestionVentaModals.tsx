import type { FormEvent } from 'react';
import { AlertTriangle, LoaderCircle, Pencil, Save, Trash2, X } from 'lucide-react';

export interface EstiloEdicion {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface FormularioEdicionVenta {
  nombre_cliente: string;
  plataforma_origen: string;
  fecha_venta: string;
  id_estilo: string;
  total_bruto: string;
  comision_vgen_usd: string;
  comision_recepcion_paypal_usd: string;
}

export interface VentaEditable {
  id_venta: number;
  nombre_cliente: string;
  plataforma_origen: string;
  metodo_pago: string;
  estado_retiro: 'pendiente' | 'retirado';
}

interface PlataformaEdicion {
  label: string;
  value: string;
  img: string;
}

interface ModalEditarVentaProps {
  venta: VentaEditable;
  formulario: FormularioEdicionVenta;
  estilos: EstiloEdicion[];
  plataformas: PlataformaEdicion[];
  guardando: boolean;
  onChange: (campo: keyof FormularioEdicionVenta, valor: string) => void;
  onClose: () => void;
  onSubmit: () => void;
}

export const ModalEditarVenta = ({
  venta,
  formulario,
  estilos,
  plataformas,
  guardando,
  onChange,
  onClose,
  onSubmit
}: ModalEditarVentaProps) => {
  const esSteam = venta.metodo_pago === 'Juego de Steam';
  const esTransferencia = venta.metodo_pago === 'Transferencia Bancaria';
  const aplicaComisiones = venta.metodo_pago === 'PayPal' && formulario.plataforma_origen === 'VGen';
  const esRetiradaEditable = venta.estado_retiro === 'retirado' && !esSteam && !esTransferencia;

  const enviar = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black opacity-75 backdrop-blur-sm" onMouseDown={() => !guardando && onClose()} />

      <form
        onSubmit={enviar}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
      >
        <div className="h-2 shrink-0 bg-[#0e8571]" />

        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-[#0e8571]">
              <Pencil size={20} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-slate-800">Editar comisión</h2>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Ticket #{String(venta.id_venta).padStart(5, '0')} · {venta.metodo_pago}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            aria-label="Cerrar edición"
            className="rounded-full border border-slate-200 p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-40"
          >
            <X size={17} />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Cliente</span>
              <input
                value={formulario.nombre_cliente}
                onChange={event => onChange('nombre_cliente', event.target.value)}
                maxLength={100}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Fecha de registro</span>
              <input
                type="date"
                value={formulario.fecha_venta}
                onChange={event => onChange('fecha_venta', event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Plataforma de origen</span>
              <select
                value={formulario.plataforma_origen}
                onChange={event => onChange('plataforma_origen', event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
              >
                {plataformas.map(plataforma => (
                  <option key={plataforma.value} value={plataforma.value}>{plataforma.label}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-bold text-slate-600">Estilo de dibujo</span>
              <select
                value={formulario.id_estilo}
                onChange={event => onChange('id_estilo', event.target.value)}
                required
                className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-700 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
              >
                {estilos.map(estilo => (
                  <option key={estilo.id} value={estilo.id}>
                    {estilo.nombre}{estilo.activo ? '' : ' (archivado)'}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-slate-500">Método de pago</p>
                <p className="mt-1 text-sm font-extrabold text-slate-700">{venta.metodo_pago}</p>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
                No modificable
              </span>
            </div>
          </div>

          {!esSteam && (
            <div className="mt-5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold text-slate-600">
                  {esTransferencia ? 'Monto total (CLP)' : 'Monto bruto (USD)'}
                </span>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-sm font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    min={esTransferencia ? '1' : '0.01'}
                    step={esTransferencia ? '1' : '0.01'}
                    value={formulario.total_bruto}
                    onChange={event => onChange('total_bruto', event.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-8 pr-14 text-lg font-extrabold text-slate-800 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
                  />
                  <span className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-xs font-bold text-slate-400">
                    {esTransferencia ? 'CLP' : 'USD'}
                  </span>
                </div>
              </label>

              {aplicaComisiones && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">Comisión de VGen (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formulario.comision_vgen_usd}
                      onChange={event => onChange('comision_vgen_usd', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-bold text-slate-600">Comisión al recibir en PayPal (USD)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formulario.comision_recepcion_paypal_usd}
                      onChange={event => onChange('comision_recepcion_paypal_usd', event.target.value)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-bold text-slate-700 outline-none focus:border-[#0e8571] focus:ring-2 focus:ring-[#0e8571]/15"
                    />
                  </label>
                </div>
              )}
            </div>
          )}

          {esSteam && (
            <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Los juegos de Steam no tienen un monto monetario asociado. Puedes corregir el cliente, la fecha, la plataforma y el estilo.
            </div>
          )}

          {esRetiradaEditable && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3">
              <AlertTriangle className="mt-0.5 shrink-0 text-amber-700" size={18} />
              <p className="text-xs leading-5 text-amber-800">
                Si cambias el monto o las comisiones, el retiro volverá a pendiente para evitar conservar una conversión a CLP incorrecta.
              </p>
            </div>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={guardando}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0e8571] px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-[#086455] disabled:opacity-60"
          >
            {guardando ? <LoaderCircle size={16} className="animate-spin" /> : <Save size={16} />}
            {guardando ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  );
};

interface ModalEliminarVentaProps {
  venta: VentaEditable;
  eliminando: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ModalEliminarVenta = ({ venta, eliminando, onClose, onConfirm }: ModalEliminarVentaProps) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-black opacity-75 backdrop-blur-sm" onMouseDown={() => !eliminando && onClose()} />
    <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
      <div className="h-2 bg-red-600" />
      <div className="px-7 py-7 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-100 bg-red-50 text-red-600 shadow-lg">
          <Trash2 size={27} />
        </div>
        <p className="mt-5 text-xs font-black uppercase tracking-widest text-red-500">Eliminar definitivamente</p>
        <h2 className="mt-2 text-xl font-extrabold text-slate-800">¿Eliminar esta comisión?</h2>
        <p className="mt-3 text-sm leading-6 text-slate-500">
          Se eliminará el registro de <strong className="text-slate-700">{venta.nombre_cliente}</strong> y dejará de aparecer en el historial y las estadísticas.
        </p>
        <div className="mt-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-xs font-semibold text-red-700">
          Esta acción no se puede deshacer.
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5">
        <button
          type="button"
          onClick={onClose}
          disabled={eliminando}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={eliminando}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:bg-red-700 disabled:opacity-60"
        >
          {eliminando ? <LoaderCircle size={16} className="animate-spin" /> : <Trash2 size={16} />}
          {eliminando ? 'Eliminando...' : 'Eliminar'}
        </button>
      </div>
    </div>
  </div>
);
