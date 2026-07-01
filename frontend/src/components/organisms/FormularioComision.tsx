import { useState, useMemo, useRef, useEffect } from 'react';
import { SelectEstilo } from '../molecules/SelectEstilo';
import { ListaModificadores } from '../molecules/ListaModificadores';
import toast from 'react-hot-toast';

const COMISIONES_PLATAFORMA: Record<string, number> = {
  'VGen': 0.05,
  'TikTok': 0,
  'Twitter / X': 0,
  'Discord': 0,
  'Instagram': 0,
  'Facebook': 0,
};

// Dropdown para plataformas usando imágenes desde public/
const PlatformDropdown = ({ plataforma, setPlataforma }: { plataforma: string; setPlataforma: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const options = [
    { label: 'VGen', value: 'VGen', img: '/Vgen.png' },
    { label: 'TikTok', value: 'TikTok', img: '/tiktok.webp' },
    { label: 'Twitter / X', value: 'Twitter / X', img: '/twitter.png' },
    { label: 'Discord', value: 'Discord', img: '/discord.svg' },
    { label: 'Instagram', value: 'Instagram', img: '/Instagram.png' },
    { label: 'Facebook', value: 'Facebook', img: '/facebook.png' },
  ];

  const selected = options.find(o => o.value === plataforma) || options[0];

  return (
    <div className="flex flex-col relative" ref={ref}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Plataforma</label>
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm flex items-center justify-between">
        <div className="flex items-center">
          {selected.img ? (
            <img
              src={selected.img}
              alt={selected.label}
              className="h-5 w-5 mr-3 rounded-sm object-contain"
              style={selected.value === 'Twitter / X' ? { transform: 'scale(2.2)' } : undefined}
            />
          ) : <span className="inline-block h-5 w-5 mr-3 bg-slate-200 rounded-sm" />}
          <span className="text-sm">{selected.label}</span>
        </div>
        <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open && (
        <ul className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-56 overflow-auto">
          {options.map(opt => (
            <li key={opt.value} className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center" onClick={() => { setPlataforma(opt.value); setOpen(false); }}>
              {opt.img ? (
                <img
                  src={opt.img}
                  alt={opt.label}
                  className="h-5 w-5 mr-3 rounded-sm object-contain"
                  style={opt.value === 'Twitter / X' ? { transform: 'scale(2.2)' } : undefined}
                />
              ) : <span className="inline-block h-5 w-5 mr-3 bg-slate-200 rounded-sm" />}
              <span className="text-sm text-slate-700">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

// Dropdown para métodos de pago (incluye PayPal en public/)
const PaymentDropdown = ({ metodoPago, setMetodoPago }: { metodoPago: string; setMetodoPago: (v: string) => void }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('click', onDoc);
    return () => document.removeEventListener('click', onDoc);
  }, []);

  const options = [
    { label: 'PayPal', value: 'PayPal', img: '/PayPal.png' },
    { label: 'Transferencia Bancaria', value: 'Transferencia Bancaria', img: '/transferencia.png' },
  ];

  const selected = options.find(o => o.value === metodoPago) || options[0];

  return (
    <div className="flex flex-col relative" ref={ref}>
      <label className="block text-sm font-semibold text-gray-700 mb-1">Método de Pago</label>
      <button type="button" onClick={() => setOpen(!open)} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm flex items-center justify-between">
        <div className="flex items-center">
          {selected.img ? <img src={selected.img} alt={selected.label} className="h-5 w-5 mr-3 rounded-sm" /> : <span className="inline-block h-5 w-5 mr-3 bg-slate-200 rounded-sm" />}
          <span className="text-sm">{selected.label}</span>
        </div>
        <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open && (
        <ul className="absolute z-20 mt-2 w-full bg-white border border-slate-200 rounded-lg shadow-md max-h-56 overflow-auto">
          {options.map(opt => (
            <li key={opt.value} className="px-3 py-2 cursor-pointer hover:bg-slate-50 flex items-center" onClick={() => { setMetodoPago(opt.value); setOpen(false); }}>
              {opt.img ? <img src={opt.img} alt={opt.label} className="h-5 w-5 mr-3 rounded-sm" /> : <span className="inline-block h-5 w-5 mr-3 bg-slate-200 rounded-sm" />}
              <span className="text-sm text-slate-700">{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export const FormularioComision = () => {
  const [idEstilo, setIdEstilo] = useState(0);
  const [modificadores, setModificadores] = useState<any[]>([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [plataforma, setPlataforma] = useState('VGen');
  const [metodoPago, setMetodoPago] = useState('PayPal');
  const [precioBase, setPrecioBase] = useState('');
  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState<Record<string, string>>({});

  const [mostrarPopup, setMostrarPopup] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

  const esTransferenciaCLP = metodoPago === 'Transferencia Bancaria';
  const divisa = esTransferenciaCLP ? 'CLP' : 'USD';

  const resumen = useMemo(() => {
    const base = parseFloat(precioBase) || 0;
    const sumaModificadores = modificadores.reduce((acc, mod) => acc + (parseFloat(mod.precio) || 0), 0);
    const bruto = base + sumaModificadores;
    
    const comisionPlataforma = esTransferenciaCLP ? 0 : parseFloat((bruto * (COMISIONES_PLATAFORMA[plataforma] ?? 0)).toFixed(2));
    const neto = esTransferenciaCLP ? bruto : parseFloat((bruto - comisionPlataforma).toFixed(2));
    
    return { base, sumaModificadores, bruto, comisionPlataforma, neto };
  }, [precioBase, modificadores, plataforma, esTransferenciaCLP]);

  const formatearDinero = (monto: number) => {
    return esTransferenciaCLP ? monto.toLocaleString('es-CL') : monto.toFixed(2);
  };

  const validar = () => {
    const nuevosErrores: Record<string, string> = {};
    
    if (!nombreCliente.trim()) {
      nuevosErrores.nombreCliente = 'Debes ingresar el nombre del cliente o usuario.';
    }
    
    if (!idEstilo || idEstilo === 0) {
      nuevosErrores.idEstilo = 'Por favor selecciona un estilo para el encargo.';
    }
    
    if (!precioBase) {
      nuevosErrores.precioBase = 'Ingresa el precio base del estilo.';
    } else if (resumen.bruto <= 0) {
      nuevosErrores.precioBase = 'El monto total debe ser mayor a 0.';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  const handleRegistrarVenta = async () => {
    if (!validar()) {
      toast.error('Faltan campos por completar', { icon: '⚠️' });
      setTimeout(() => {
        const primerError = document.querySelector('[data-error="true"]');
        if (primerError) {
          primerError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return;
    }

    setCargando(true);

    const payload = {
      nombre_cliente: nombreCliente.trim(),
      plataforma_origen: plataforma,
      metodo_pago: metodoPago,
      moneda_origen: divisa,
      id_estilo: idEstilo,
      modificadores: modificadores,
      total_bruto_usd: resumen.bruto,
      precio_base: resumen.base,
    };

    try {
      const res = await fetch('http://localhost:3000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.exito) {
        setMensajeExito(data.mensaje);
        setMostrarPopup(true);
      } else {
        toast.error(data.mensaje);
      }
    } catch (error) {
      console.error('Error enviando la venta:', error);
      toast.error('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full max-w-2xl relative">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4">
        Detalles del Encargo y Finanzas
      </h2>

      <div className="mb-4 flex flex-col w-full max-w-sm" data-error={!!errores.nombreCliente}>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre del Cliente / User
        </label>
        <input
          type="text"
          value={nombreCliente}
          onChange={(e) => {
            setNombreCliente(e.target.value);
            if (errores.nombreCliente) setErrores({ ...errores, nombreCliente: '' });
          }}
          className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
            errores.nombreCliente 
              ? 'border-red-500 focus:ring-red-400 bg-red-50' 
              : 'border-gray-300 focus:ring-blue-500 bg-white'
          }`}
          placeholder="..."
        />
        {errores.nombreCliente && (
          <span className="text-red-500 text-xs mt-1.5 font-medium animate-pulse flex items-center">
            <span className="mr-1">▲</span> {errores.nombreCliente}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 max-w-xl">
        {/* Plataformas dropdown with icons from public/ */}
        <PlatformDropdown
          plataforma={plataforma}
          setPlataforma={setPlataforma}
        />

        {/* Métodos de pago dropdown with PayPal icon */}
        <PaymentDropdown
          metodoPago={metodoPago}
          setMetodoPago={setMetodoPago}
        />
      </div>

      <hr className="border-slate-100 my-5" />

      <div data-error={!!errores.idEstilo} className="relative">
        <SelectEstilo onEstiloChange={(id) => {
          setIdEstilo(id);
          if (errores.idEstilo) setErrores({ ...errores, idEstilo: '' });
        }} />
        {errores.idEstilo && (
          <span className="text-red-500 text-xs mt-1 font-medium animate-pulse flex items-center">
            <span className="mr-1">▲</span> {errores.idEstilo}
          </span>
        )}
      </div>

      <ListaModificadores onExtrasChange={setModificadores} divisa={divisa} />

      <div className="mt-6 flex flex-col w-full max-w-sm" data-error={!!errores.precioBase}>
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Precio Base del Estilo ({divisa})
        </label>
        <div className="relative rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={`font-bold text-sm ${errores.precioBase ? 'text-red-500' : 'text-blue-500'}`}>$</span>
          </div>
          <input
            type="number"
            placeholder={esTransferenciaCLP ? "15000" : "0.00"}
            value={precioBase}
            onChange={(e) => {
              setPrecioBase(e.target.value);
              if (errores.precioBase) setErrores({ ...errores, precioBase: '' });
            }}
            className={`w-full pl-8 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 font-bold transition-colors ${
              errores.precioBase 
                ? 'border-red-500 focus:ring-red-400 bg-red-50 text-red-900' 
                : 'border-blue-400 focus:ring-blue-600 bg-blue-50 text-blue-900'
            }`}
          />
        </div>
        {errores.precioBase && (
          <span className="text-red-500 text-xs mt-1.5 font-medium animate-pulse flex items-center">
            <span className="mr-1">▲</span> {errores.precioBase}
          </span>
        )}
      </div>

      {resumen.bruto > 0 && (
        <div className="mt-4 max-w-sm bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2 text-sm">
          <p className="font-semibold text-slate-700 mb-3">Desglose automático</p>

          <div className="flex justify-between text-slate-600">
            <span>Precio Base</span>
            <span className="font-medium">${formatearDinero(resumen.base)}</span>
          </div>

          {resumen.sumaModificadores > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Modificadores (+{modificadores.length})</span>
              <span className="font-medium">${formatearDinero(resumen.sumaModificadores)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2 flex justify-between text-slate-800 font-bold">
            <span>Total Bruto ({divisa})</span>
            <span>${formatearDinero(resumen.bruto)}</span>
          </div>

          {resumen.comisionPlataforma > 0 && !esTransferenciaCLP && (
            <div className="flex justify-between text-red-500">
              <span>Comisión {plataforma} ({(COMISIONES_PLATAFORMA[plataforma] * 100).toFixed(0)}%)</span>
              <span>- ${formatearDinero(resumen.comisionPlataforma)}</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2 flex justify-between text-green-700 font-bold">
            <span>{esTransferenciaCLP ? 'Ingreso a cuenta' : 'Neto estimado (sin retirar)'}</span>
            <span>${formatearDinero(resumen.neto)}</span>
          </div>
        </div>
      )}

      <button
        onClick={handleRegistrarVenta}
        disabled={cargando}
        className="mt-8 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {cargando ? 'Guardando...' : 'Registrar Comisión'}
      </button>

      {mostrarPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl border border-slate-100">
            <div className="mx-auto flex items-center justify-center h-14 w-14 rounded-full bg-green-100 text-green-600 mb-4 shadow-inner">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2 tracking-tight">¡Comisión Registrada!</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium leading-relaxed">
              {mensajeExito}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-green-600/20 cursor-pointer"
            >
              Continuar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};