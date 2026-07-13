import { useEffect, useState, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';

interface Venta {
  id_venta: number;
  nombre_cliente: string;
  plataforma_origen: string;
  metodo_pago: string;
  fecha_venta: string;
  total_bruto_usd: string;
  comision_plataforma_usd: string;
  comision_vgen_usd?: string;
  comision_recepcion_paypal_usd?: string;
  comision_retiro_usd: string;
  total_neto_usd: string;
  total_final_clp: string;
  estado_retiro: 'pendiente' | 'retirado';
  fecha_retiro: string | null;
  nombre_estilo: string | null;
}

interface DetalleVenta extends Venta {
  precio_estilo: string;
  modificadores: { nombre: string; precio: string }[];
}

interface Filtros {
  busqueda: string;
  plataforma: string;
  metodoPago: string;
  estado: string;
  fechaDesde: string;
  fechaHasta: string;
}

const FILTROS_INICIALES: Filtros = {
  busqueda: '',
  plataforma: '',
  metodoPago: '',
  estado: '',
  fechaDesde: '',
  fechaHasta: '',
};

// Iconos
const PLATAFORMAS = [
  { label: 'VGen', value: 'VGen', img: '/Vgen.png' },
  { label: 'TikTok', value: 'TikTok', img: '/tiktok.webp' },
  { label: 'Twitter / X', value: 'Twitter / X', img: '/twitter.png' },
  { label: 'Discord', value: 'Discord', img: '/discord.svg' },
  { label: 'Instagram', value: 'Instagram', img: '/Instagram.png' },
  { label: 'Facebook', value: 'Facebook', img: '/facebook.png' },
];

// Iconos de métodos de pago
const METODOS_PAGO = [
  { label: 'PayPal', value: 'PayPal', img: '/PayPal.png' },
  { label: 'Transferencia Bancaria', value: 'Transferencia Bancaria', img: '/transferencia.png' },
];

const getPlataformaIcon = (nombre: string) => PLATAFORMAS.find((p) => p.value === nombre)?.img;
const getMetodoIcon = (nombre: string) => METODOS_PAGO.find((m) => m.value === nombre)?.img;

const VENTAS_POR_PAGINA = 10;

const IconSearch = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.75" />
    <path d="m20 20-3.2-3.2" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconFilter = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 5h16M7 12h10M10 19h4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconX = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
  </svg>
);

const IconChevron = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Dropdown de filtro con ícono — Plataforma
const PlataformaFiltroDropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const opciones = [{ label: 'Todas', value: '', img: null as string | null }, ...PLATAFORMAS];
  const seleccionada = opciones.find((o) => o.value === value) || opciones[0];

  return (
    <div className="flex flex-col relative" ref={ref}>
      <label className="text-xs font-semibold text-slate-500 mb-1.5">Plataforma</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <div className="flex items-center min-w-0">
          {seleccionada.img ? (
            <img
              src={seleccionada.img}
              alt=""
              className="h-4 w-4 mr-2 rounded-sm object-contain shrink-0"
              style={seleccionada.value === 'Twitter / X' ? { transform: 'scale(1.8)' } : undefined}
            />
          ) : (
            <span className="inline-block h-4 w-4 mr-2 shrink-0" />
          )}
          <span className="text-slate-700 truncate">{seleccionada.label}</span>
        </div>
        <IconChevron className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {opciones.map((opt) => (
            <li
              key={opt.value || 'todas'}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center ${opt.value === value ? 'bg-blue-50' : ''}`}
            >
              {opt.img ? (
                <img
                  src={opt.img}
                  alt=""
                  className="h-4 w-4 mr-2 rounded-sm object-contain shrink-0"
                  style={opt.value === 'Twitter / X' ? { transform: 'scale(1.8)' } : undefined}
                />
              ) : (
                <span className="inline-block h-4 w-4 mr-2 shrink-0" />
              )}
              <span className="text-sm text-slate-700">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Dropdown de filtro con ícono — Método de pago
const MetodoPagoFiltroDropdown = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const opciones = [{ label: 'Todos', value: '', img: null as string | null }, ...METODOS_PAGO];
  const seleccionada = opciones.find((o) => o.value === value) || opciones[0];

  return (
    <div className="flex flex-col relative" ref={ref}>
      <label className="text-xs font-semibold text-slate-500 mb-1.5">Método de pago</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-white text-sm flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
      >
        <div className="flex items-center min-w-0">
          {seleccionada.img ? (
            <img src={seleccionada.img} alt="" className="h-4 w-4 mr-2 rounded-sm object-contain shrink-0" />
          ) : (
            <span className="inline-block h-4 w-4 mr-2 shrink-0" />
          )}
          <span className="text-slate-700 truncate">{seleccionada.label}</span>
        </div>
        <IconChevron className="h-4 w-4 text-slate-400 shrink-0" />
      </button>

      {open && (
        <ul className="absolute z-20 top-full mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-auto">
          {opciones.map((opt) => (
            <li
              key={opt.value || 'todos'}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center ${opt.value === value ? 'bg-blue-50' : ''}`}
            >
              {opt.img ? (
                <img src={opt.img} alt="" className="h-4 w-4 mr-2 rounded-sm object-contain shrink-0" />
              ) : (
                <span className="inline-block h-4 w-4 mr-2 shrink-0" />
              )}
              <span className="text-sm text-slate-700">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const HistorialPage = () => {
  // Estados principales
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);

  // Estado de filtros
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIALES);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);

  // Estado de paginación
  const [paginaActual, setPaginaActual] = useState(1);

  // Estados para selección de ventas y retiro masivo
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);

  // Modal de detalle de venta
  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<DetalleVenta | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [boletaVista, setBoletaVista] = useState<'comercial' | 'bancaria'>('comercial');

  // Modal de retiro masivo
  const [modalDolar, setModalDolar] = useState(false);
  const [valorDolarInput, setValorDolarInput] = useState('');
  const [errorDolar, setErrorDolar] = useState('');
  const [modalExito, setModalExito] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');
  const [cargandoDolarEnVivo, setCargandoDolarEnVivo] = useState(false);

  // Funciones para cargar ventas y manejar filtros
  const cargarVentas = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/ventas');
      const data = await res.json();
      if (data.exito) setVentas(data.ventas);
    } catch (error) {
      console.error('Error cargando historial:', error);
      toast.error('Error al cargar el historial');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  // Filtros
  const hayFiltrosActivos = useMemo(() => {
    return Object.values(filtros).some((v) => v !== '');
  }, [filtros]);

  const actualizarFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
    setPaginaActual(1); // Al filtrar, siempre se vuelve a la primera página
  };

  const limpiarFiltros = () => {
    setFiltros(FILTROS_INICIALES);
    setPaginaActual(1);
  };

  // Filtrado de ventas según los filtros activos
  const ventasFiltradas = useMemo(() => {
    const busquedaNormalizada = filtros.busqueda.trim().toLowerCase();

    return ventas.filter((v) => {
      if (busquedaNormalizada) {
        const coincideCliente = v.nombre_cliente.toLowerCase().includes(busquedaNormalizada);
        const coincideEstilo = (v.nombre_estilo || '').toLowerCase().includes(busquedaNormalizada);
        if (!coincideCliente && !coincideEstilo) return false;
      }

      if (filtros.plataforma && v.plataforma_origen !== filtros.plataforma) return false;
      if (filtros.metodoPago && v.metodo_pago !== filtros.metodoPago) return false;
      if (filtros.estado && v.estado_retiro !== filtros.estado) return false;

      if (filtros.fechaDesde) {
        const desde = new Date(filtros.fechaDesde);
        if (new Date(v.fecha_venta) < desde) return false;
      }
      if (filtros.fechaHasta) {
        const hasta = new Date(filtros.fechaHasta);
        hasta.setHours(23, 59, 59, 999);
        if (new Date(v.fecha_venta) > hasta) return false;
      }

      return true;
    });
  }, [ventas, filtros]);

  // Paginacion
  const totalPaginas = Math.max(1, Math.ceil(ventasFiltradas.length / VENTAS_POR_PAGINA));

  useEffect(() => {
    if (paginaActual > totalPaginas) {
      setPaginaActual(totalPaginas);
    }
  }, [totalPaginas, paginaActual]);

  const ventasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * VENTAS_POR_PAGINA;
    return ventasFiltradas.slice(inicio, inicio + VENTAS_POR_PAGINA);
  }, [ventasFiltradas, paginaActual]);

  const irAPagina = (pagina: number) => {
    const paginaValida = Math.min(Math.max(1, pagina), totalPaginas);
    setPaginaActual(paginaValida);
  };

  const numerosDePagina = useMemo(() => {
    const rango: number[] = [];
    const inicio = Math.max(1, paginaActual - 2);
    const fin = Math.min(totalPaginas, inicio + 4);
    const inicioAjustado = Math.max(1, fin - 4);
    for (let i = inicioAjustado; i <= fin; i++) rango.push(i);
    return rango;
  }, [paginaActual, totalPaginas]);

  const toggleSeleccion = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const iniciarRetiroMasivo = async () => {
    setValorDolarInput('');
    setErrorDolar('');
    setModalDolar(true);
    setCargandoDolarEnVivo(true);

    try {
      const res = await fetch('https://mindicador.cl/api/dolar');
      const data = await res.json();
      if (data && data.serie && data.serie.length > 0) {
        const valorOficial = Math.round(data.serie[0].valor);
        setValorDolarInput(valorOficial.toString());
      }
    } catch (error) {
      console.error('No se pudo obtener el dólar automáticamente:', error);
      toast.error('No se pudo conectar con el Banco Central', { icon: '⚠️' });
    } finally {
      setCargandoDolarEnVivo(false);
    }
  };

  const ejecutarRetiroMasivo = async () => {
    const valorDolar = parseFloat(valorDolarInput);
    if (isNaN(valorDolar) || valorDolar <= 0) {
      toast.error('Ingresa un valor de dólar válido mayor a 0');
      setErrorDolar('Ingresa un valor válido mayor a 0.');
      return;
    }

    setProcesandoMasivo(true);
    setErrorDolar('');

    try {
      const res = await fetch('http://localhost:3000/api/ventas/retirar-masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids: seleccionadas,
          valor_dolar: valorDolar,
        }),
      });
      const data = await res.json();

      if (data.exito) {
        setModalDolar(false); 
        setMensajeExito(data.mensaje);
        setModalExito(true); 
        setSeleccionadas([]);
        await cargarVentas(); 
      } else {
        toast.error(data.mensaje);
        setErrorDolar(data.mensaje);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error de conexión con el servidor');
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const abrirModalVenta = async (id: number) => {
    setModalAbierto(true);
    setCargandoDetalle(true);
    setDetalleVenta(null);
    setBoletaVista('comercial');
    try {
      const res = await fetch(`http://localhost:3000/api/ventas/${id}`);
      const data = await res.json();
      if (data.exito) setDetalleVenta(data.venta);
    } catch (error) {
      toast.error('Error al abrir la boleta');
    } finally { 
      setCargandoDetalle(false); 
    }
  };

  const formatearDinero = (monto: string | number, esCLP: boolean) => {
    if (esCLP) return Number(monto).toLocaleString('es-CL');
    return parseFloat(String(monto) || '0').toFixed(2);
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
        <p className="text-slate-500 text-sm mt-1">Todas tus comisiones registradas.</p>
      </div>

      {seleccionadas.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center mb-6 shadow-sm animate-fade-in">
          <div>
            <span className="font-bold text-blue-800 text-lg">{seleccionadas.length}</span>
            <span className="text-blue-700 ml-2 font-medium">ventas seleccionadas listas para retirar en bloque.</span>
          </div>
          <button 
            onClick={iniciarRetiroMasivo}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-lg shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-200 cursor-pointer"
          >
            Ejecutar Retiro Masivo
          </button>
        </div>
      )}

      {/* PANEL DE FILTROS */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-6 overflow-visible">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-4">
          <div className="relative flex-1">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente o estilo..."
              value={filtros.busqueda}
              onChange={(e) => actualizarFiltro('busqueda', e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-colors"
            />
          </div>

          <button
            onClick={() => setFiltrosAbiertos(!filtrosAbiertos)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold border transition-colors cursor-pointer whitespace-nowrap ${
              filtrosAbiertos || hayFiltrosActivos
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <IconFilter className="h-4 w-4" />
            Filtros
            {hayFiltrosActivos && (
              <span className="flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-blue-600 text-white text-[11px] font-bold">
                {Object.values(filtros).filter((v) => v !== '').length}
              </span>
            )}
          </button>

          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer whitespace-nowrap"
            >
              <IconX className="h-4 w-4" />
              Limpiar
            </button>
          )}
        </div>

        {filtrosAbiertos && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 px-4 pb-4 pt-1 border-t border-slate-100">
            <PlataformaFiltroDropdown
              value={filtros.plataforma}
              onChange={(v) => actualizarFiltro('plataforma', v)}
            />

            <MetodoPagoFiltroDropdown
              value={filtros.metodoPago}
              onChange={(v) => actualizarFiltro('metodoPago', v)}
            />

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 mb-1.5">Estado</label>
              <select
                value={filtros.estado}
                onChange={(e) => actualizarFiltro('estado', e.target.value)}
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="pendiente">Pendiente</option>
                <option value="retirado">Retirado</option>
              </select>
            </div>

            <div className="flex flex-col">
              <label className="text-xs font-semibold text-slate-500 mb-1.5">Rango de fechas</label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={filtros.fechaDesde}
                  onChange={(e) => actualizarFiltro('fechaDesde', e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-slate-300 text-xs">–</span>
                <input
                  type="date"
                  value={filtros.fechaHasta}
                  onChange={(e) => actualizarFiltro('fechaHasta', e.target.value)}
                  className="w-full px-2 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-slate-400">Cargando ventas...</div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No tienes comisiones registradas.</div>
        ) : ventasFiltradas.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-slate-400 text-sm mb-3">Ningún resultado coincide con los filtros aplicados.</p>
            <button
              onClick={limpiarFiltros}
              className="text-blue-600 hover:text-blue-700 text-sm font-semibold cursor-pointer"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3 text-center w-12">Sel.</th>
                    <th className="px-4 py-3 text-left">Cliente</th>
                    <th className="px-4 py-3 text-left">Estilo</th>
                    <th className="px-4 py-3 text-left">Plataforma</th>
                    <th className="px-4 py-3 text-left">Fecha</th>
                    <th className="px-4 py-3 text-right">Monto</th>
                    <th className="px-4 py-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ventasPaginadas.map((v) => {
                    const esTransferenciaCLP = v.metodo_pago === 'Transferencia Bancaria';
                    const estaRetirado = v.estado_retiro === 'retirado';
                    const iconoPlataforma = getPlataformaIcon(v.plataforma_origen);
                    
                    return (
                      <tr 
                        key={v.id_venta} 
                        onClick={() => abrirModalVenta(v.id_venta)}
                        className={`cursor-pointer transition-colors ${seleccionadas.includes(v.id_venta) ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-slate-50'}`}
                      >
                        <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                          {!estaRetirado && !esTransferenciaCLP ? (
                            <input 
                              type="checkbox" 
                              className="w-4 h-4 cursor-pointer text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              checked={seleccionadas.includes(v.id_venta)}
                              onChange={(e) => toggleSeleccion(v.id_venta, e as any)}
                            />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">{v.nombre_cliente}</td>
                        <td className="px-4 py-3 text-slate-600">{v.nombre_estilo || '—'}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="flex items-center gap-2">
                            {iconoPlataforma && (
                              <img
                                src={iconoPlataforma}
                                alt=""
                                className="h-4 w-4 rounded-sm object-contain shrink-0"
                                style={v.plataforma_origen === 'Twitter / X' ? { transform: 'scale(1.8)' } : undefined}
                              />
                            )}
                            <span>{v.plataforma_origen}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{new Date(v.fecha_venta).toLocaleDateString('es-CL')}</td>
                        
                        <td className="px-4 py-3 text-right font-bold text-green-700">
                          {esTransferenciaCLP
                            ? `$${Number(v.total_final_clp).toLocaleString('es-CL')} CLP` 
                            : `$${parseFloat(v.total_neto_usd).toFixed(2)} USD`
                          }
                        </td>
                        
                        <td className="px-4 py-3 text-center">
                          {estaRetirado ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              Retirado
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                              Pendiente
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Controles de paginación */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/60">
              <p className="text-xs text-slate-500 order-2 sm:order-1">
                Mostrando{' '}
                <span className="font-semibold text-slate-700">
                  {(paginaActual - 1) * VENTAS_POR_PAGINA + 1}
                  –
                  {Math.min(paginaActual * VENTAS_POR_PAGINA, ventasFiltradas.length)}
                </span>{' '}
                de <span className="font-semibold text-slate-700">{ventasFiltradas.length}</span> ventas
                {hayFiltrosActivos && (
                  <span className="text-slate-400"> (de {ventas.length} en total)</span>
                )}
              </p>

              <div className="flex items-center gap-1 order-1 sm:order-2">
                <button
                  onClick={() => irAPagina(paginaActual - 1)}
                  disabled={paginaActual === 1}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {numerosDePagina[0] > 1 && (
                  <>
                    <button
                      onClick={() => irAPagina(1)}
                      className="h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      1
                    </button>
                    <span className="px-1 text-slate-300 select-none">…</span>
                  </>
                )}

                {numerosDePagina.map((num) => (
                  <button
                    key={num}
                    onClick={() => irAPagina(num)}
                    className={`h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                      num === paginaActual
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {num}
                  </button>
                ))}

                {numerosDePagina[numerosDePagina.length - 1] < totalPaginas && (
                  <>
                    <span className="px-1 text-slate-300 select-none">…</span>
                    <button
                      onClick={() => irAPagina(totalPaginas)}
                      className="h-8 min-w-8 px-2 flex items-center justify-center rounded-lg text-sm font-medium text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      {totalPaginas}
                    </button>
                  </>
                )}

                <button
                  onClick={() => irAPagina(paginaActual + 1)}
                  disabled={paginaActual === totalPaginas}
                  className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
                  aria-label="Página siguiente"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {modalDolar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-100">
            <h3 className="text-xl font-bold text-slate-800 mb-1">Retiro Bancario</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">
              Vas a retirar <strong className="text-blue-600">{seleccionadas.length} comisiones</strong>. Se convertirán a CLP usando el valor del dólar y se descontarán $800 CLP por todo el bloque.
            </p>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                ¿A cuánto está el Dólar HOY?
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-bold">$</span>
                <input
                  type="number"
                  placeholder={cargandoDolarEnVivo ? "Buscando en vivo..." : "Ej: 950"}
                  value={valorDolarInput}
                  onChange={(e) => {
                    setValorDolarInput(e.target.value);
                    if (errorDolar) setErrorDolar('');
                  }}
                  disabled={cargandoDolarEnVivo}
                  className={`w-full pl-8 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 font-bold text-lg transition-colors ${
                    errorDolar 
                      ? 'border-red-400 focus:ring-red-500 bg-red-50' 
                      : cargandoDolarEnVivo 
                        ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-wait'
                        : 'border-slate-300 focus:ring-blue-500 bg-slate-50 text-slate-800'
                  }`}
                />
              </div>
              
              {cargandoDolarEnVivo ? (
                <p className="text-blue-500 text-xs mt-2 font-medium flex items-center animate-pulse">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Consultando Banco Central...
                </p>
              ) : (
                <p className="text-slate-400 text-xs mt-2 font-medium">
                  Valor sugerido en tiempo real. Puedes modificarlo si es necesario.
                </p>
              )}
              
              {errorDolar && <p className="text-red-500 text-xs mt-2 font-medium animate-pulse">▲ {errorDolar}</p>}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setModalDolar(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors cursor-pointer"
                disabled={procesandoMasivo || cargandoDolarEnVivo}
              >
                Cancelar
              </button>
              <button
                onClick={ejecutarRetiroMasivo}
                disabled={procesandoMasivo || cargandoDolarEnVivo}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer disabled:opacity-50"
              >
                {procesandoMasivo ? 'Procesando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {modalExito && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100 transform scale-100 transition-transform duration-200 ease-out">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 text-green-600 mb-4 shadow-inner">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">¡Retiro Exitoso!</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              {mensajeExito}
            </p>
            <button
              onClick={() => setModalExito(false)}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-600/20 active:scale-95 cursor-pointer"
            >
              Cerrar y continuar
            </button>
          </div>
        </div>
      )}

      {modalAbierto && (
        <div 
          className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" 
          onClick={() => setModalAbierto(false)}
        >
          <div className="w-full max-w-sm flex flex-col relative" onClick={e => e.stopPropagation()}>
            
            {cargandoDetalle ? (
              <div className="p-12 bg-white rounded-lg shadow-xl text-center text-slate-500 animate-pulse font-mono">Imprimiendo...</div>
            ) : detalleVenta ? (
              (() => {
                const esCLP = detalleVenta.metodo_pago === 'Transferencia Bancaria';
                const divisa = esCLP ? 'CLP' : 'USD';
                const tieneDobleBoleta = !esCLP && detalleVenta.estado_retiro === 'retirado';
                const iconoPlataformaDetalle = getPlataformaIcon(detalleVenta.plataforma_origen);
                const iconoMetodoDetalle = getMetodoIcon(detalleVenta.metodo_pago);
                
                const subtotalBruto = esCLP ? detalleVenta.total_final_clp : detalleVenta.total_bruto_usd;
                const totalFinal = esCLP
                  ? detalleVenta.total_final_clp
                  : Number(detalleVenta.total_bruto_usd) - Number(detalleVenta.comision_plataforma_usd);
                const comisionVGenDetalle = Number(
                  detalleVenta.comision_vgen_usd
                    ?? (detalleVenta.plataforma_origen === 'VGen' ? detalleVenta.comision_plataforma_usd : 0)
                );
                const comisionRecepcionPayPalDetalle = Number(detalleVenta.comision_recepcion_paypal_usd ?? 0);

                return (
                  <>
                    {tieneDobleBoleta && (
                      <div className="flex items-center justify-between bg-slate-800 text-white px-4 py-2 rounded-t-lg font-sans text-xs tracking-wider border-b border-slate-700 select-none shadow-md">
                        <button 
                          onClick={() => setBoletaVista(boletaVista === 'comercial' ? 'bancaria' : 'comercial')}
                          className="hover:text-blue-400 transition-colors p-1 font-bold text-sm bg-slate-700/50 rounded h-7 w-7 flex items-center justify-center cursor-pointer"
                        >
                          ←
                        </button>
                        <span className="font-bold uppercase tracking-widest text-slate-300">
                          {boletaVista === 'comercial' ? '1/2 • Recibo Comercial' : '2/2 • Liquidación CLP'}
                        </span>
                        <button 
                          onClick={() => setBoletaVista(boletaVista === 'comercial' ? 'bancaria' : 'comercial')}
                          className="hover:text-blue-400 transition-colors p-1 font-bold text-sm bg-slate-700/50 rounded h-7 w-7 flex items-center justify-center cursor-pointer"
                        >
                          →
                        </button>
                      </div>
                    )}

                    {(!tieneDobleBoleta || boletaVista === 'comercial') && (
                      <div className={`w-full bg-[#fafafa] relative font-mono text-slate-800 p-8 pb-6 ${tieneDobleBoleta ? 'rounded-b-lg shadow-2xl' : 'rounded-lg shadow-2xl'}`}>
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold tracking-widest uppercase mb-1">Saturnalita</h2>
                          <p className="text-xs text-slate-500">RECIBO COMERCIAL ({divisa})</p>
                          <p className="text-xs text-slate-500 mt-2">FECHA: {new Date(detalleVenta.fecha_venta).toLocaleDateString('es-CL')}</p>
                          <p className="text-xs text-slate-500">TICKET #: {String(detalleVenta.id_venta).padStart(5, '0')}</p>
                        </div>
                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>
                        <div className="mb-4 text-sm space-y-1.5">
                          <p><strong>CLIENTE:</strong> {detalleVenta.nombre_cliente}</p>
                          <p className="flex items-center gap-1.5">
                            <strong>ORIGEN:</strong>
                            {iconoPlataformaDetalle && (
                              <img
                                src={iconoPlataformaDetalle}
                                alt=""
                                className="h-3.5 w-3.5 object-contain inline-block"
                                style={detalleVenta.plataforma_origen === 'Twitter / X' ? { transform: 'scale(1.8)' } : undefined}
                              />
                            )}
                            {detalleVenta.plataforma_origen}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <strong>PAGO:</strong>
                            {iconoMetodoDetalle && (
                              <img src={iconoMetodoDetalle} alt="" className="h-3.5 w-3.5 object-contain inline-block" />
                            )}
                            {detalleVenta.metodo_pago}
                          </p>
                        </div>
                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between font-bold"><span>DESCRIPCIÓN</span><span>IMPORTE</span></div>
                          <div className="flex justify-between"><span>1x {detalleVenta.nombre_estilo || 'Estilo Base'}</span><span>${formatearDinero(detalleVenta.precio_estilo, esCLP)}</span></div>
                          {detalleVenta.modificadores.map((mod, index) => (
                            <div key={index} className="flex justify-between pl-4 text-slate-600"><span>+ {mod.nombre}</span><span>${formatearDinero(mod.precio, esCLP)}</span></div>
                          ))}
                        </div>
                        <div className="flex justify-between text-sm font-bold mt-4 pt-2 border-t border-slate-300">
                          <span>SUBTOTAL BRUTO</span><span>${formatearDinero(subtotalBruto, esCLP)}</span>
                        </div>
                        {!esCLP && (
                          <div className="space-y-1 text-sm mt-4 mb-4 text-slate-600">
                            {detalleVenta.plataforma_origen === 'VGen' ? (
                              <>
                                <div className="flex justify-between">
                                  <span>Comisión VGen</span>
                                  <span>-${formatearDinero(comisionVGenDetalle, false)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Comisión al recibir en PayPal</span>
                                  <span>-${formatearDinero(comisionRecepcionPayPalDetalle, false)}</span>
                                </div>
                              </>
                            ) : parseFloat(detalleVenta.comision_plataforma_usd) > 0 ? (
                              <div className="flex justify-between">
                                <span>Tarifa {detalleVenta.plataforma_origen}</span>
                                <span>-${formatearDinero(detalleVenta.comision_plataforma_usd, false)}</span>
                              </div>
                            ) : null}
                          </div>
                        )}
                        <div className="border-t-2 border-dashed border-slate-300 mb-4 mt-4"></div>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-base font-bold">NETO USD</span><span className="text-2xl font-black">${formatearDinero(totalFinal, esCLP)}</span>
                        </div>
                        <button onClick={() => setModalAbierto(false)} className="w-full bg-slate-800 hover:bg-black text-white font-sans font-semibold py-3 rounded-md transition-colors mt-2 cursor-pointer">
                          Cerrar Recibo
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmYiIHBvaW50cz0iMCA4IDQgMCA4IDggMCA4Ii8+PC9zdmc+')] bg-repeat-x rotate-180 translate-y-full opacity-50"></div>
                      </div>
                    )}

                    {tieneDobleBoleta && boletaVista === 'bancaria' && (
                      <div className="w-full bg-[#f0f4f8] rounded-b-lg shadow-2xl relative font-mono text-slate-800 p-8 pb-6">
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold tracking-widest uppercase mb-1">Saturnalita</h2>
                          <p className="text-xs text-slate-500">LIQUIDACIÓN DE DIVISAS</p>
                          <p className="text-xs text-slate-500 mt-2">FECHA RETIRO: {detalleVenta.fecha_retiro ? new Date(detalleVenta.fecha_retiro).toLocaleDateString('es-CL') : '—'}</p>
                          <p className="text-xs text-slate-500">REF TICKET #: {String(detalleVenta.id_venta).padStart(5, '0')}</p>
                        </div>
                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>
                        <div className="mb-4 text-sm space-y-1.5">
                          <p className="flex items-center gap-1.5">
                            <strong>ORIGEN:</strong>
                            {iconoMetodoDetalle && (
                              <img src={iconoMetodoDetalle} alt="" className="h-3.5 w-3.5 object-contain inline-block" />
                            )}
                            {detalleVenta.metodo_pago}
                          </p>
                          <p><strong>OPERACIÓN:</strong> Retiro Internacional</p>
                        </div>
                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between font-bold"><span>CONCEPTO</span><span>MONTO</span></div>
                          <div className="flex justify-between"><span>Saldo recibido en {detalleVenta.metodo_pago}</span><span>${Number(totalFinal).toFixed(2)} USD</span></div>
                        </div>
                        <div className="space-y-1 text-sm mt-4 mb-4 text-slate-600">
                          <div className="flex justify-between"><span>Costo fijo PayPal</span><span>$800 CLP por bloque</span></div>
                          <div className="text-xs mt-2 italic text-slate-400">* El monto USD se convirtió usando el valor del dólar ingresado al retirar. Los $800 CLP se distribuyeron entre las comisiones del bloque.</div>
                        </div>
                        <div className="border-t-2 border-dashed border-slate-300 mb-4 mt-4"></div>
                        <div className="flex justify-between items-center mb-6">
                          <span className="text-base font-bold">LIQUIDO CLP</span><span className="text-2xl font-black text-blue-700">${Number(detalleVenta.total_final_clp).toLocaleString('es-CL')} CLP</span>
                        </div>
                        <button onClick={() => setModalAbierto(false)} className="w-full bg-slate-800 hover:bg-black text-white font-sans font-semibold py-3 rounded-md transition-colors mt-2 cursor-pointer">
                          Cerrar Comprobantes
                        </button>
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmYiIHBvaW50cz0iMCA4IDQgMCA4IDggMCA4Ii8+PC9zdmc+')] bg-repeat-x rotate-180 translate-y-full opacity-50"></div>
                      </div>
                    )}
                  </>
                );
              })()
            ) : (
              <div className="p-8 bg-white rounded text-center text-red-500">Error al leer la boleta.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
