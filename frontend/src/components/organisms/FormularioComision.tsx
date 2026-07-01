import { useState, useMemo } from 'react';
import { SelectEstilo } from '../molecules/SelectEstilo';
import { ListaModificadores } from '../molecules/ListaModificadores';

const COMISIONES_PLATAFORMA: Record<string, number> = {
  'VGen': 0.05,
  'TikTok': 0,
  'Twitter / X': 0,
  'Discord': 0,
  'Instagram': 0,
  'Facebook': 0,
};

export const FormularioComision = () => {
  const [idEstilo, setIdEstilo] = useState(0);
  const [modificadores, setModificadores] = useState<any[]>([]);
  const [nombreCliente, setNombreCliente] = useState('');
  const [plataforma, setPlataforma] = useState('VGen');
  const [metodoPago, setMetodoPago] = useState('PayPal');
  
  // Cambiamos 'totalBruto' por 'precioBase'
  const [precioBase, setPrecioBase] = useState('');
  const [cargando, setCargando] = useState(false);

  const esTransferenciaCLP = metodoPago === 'Transferencia Bancaria';
  const divisa = esTransferenciaCLP ? 'CLP' : 'USD';

  // Lógica de cálculo automático
  const resumen = useMemo(() => {
    const base = parseFloat(precioBase) || 0;
    
    // Sumamos todos los extras que tengan un precio
    const sumaModificadores = modificadores.reduce((acc, mod) => acc + (parseFloat(mod.precio) || 0), 0);
    
    // El Bruto ahora es la suma automática de la Base + Extras
    const bruto = base + sumaModificadores;
    
    const comisionPlataforma = esTransferenciaCLP ? 0 : parseFloat((bruto * (COMISIONES_PLATAFORMA[plataforma] ?? 0)).toFixed(2));
    const neto = esTransferenciaCLP ? bruto : parseFloat((bruto - comisionPlataforma).toFixed(2));
    
    return { base, sumaModificadores, bruto, comisionPlataforma, neto };
  }, [precioBase, modificadores, plataforma, esTransferenciaCLP]);

  const formatearDinero = (monto: number) => {
    return esTransferenciaCLP ? monto.toLocaleString('es-CL') : monto.toFixed(2);
  };

  const handleRegistrarVenta = async () => {
    if (!nombreCliente.trim() || !idEstilo || !precioBase) {
      alert('Por favor completa el nombre del cliente, el estilo y el precio base.');
      return;
    }

    if (resumen.bruto <= 0) {
      alert('El monto total debe ser mayor a 0.');
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
        alert(data.mensaje);
        window.location.reload();
      } else {
        alert('Error: ' + data.mensaje);
      }
    } catch (error) {
      console.error('Error enviando la venta:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4">
        Detalles del Encargo y Finanzas
      </h2>

      <div className="mb-4 flex flex-col w-full max-w-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Nombre del Cliente / User
        </label>
        <input
          type="text"
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Ej: JohnDoe123"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 max-w-xl">
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Plataforma</label>
          <select
            value={plataforma}
            onChange={(e) => setPlataforma(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VGen">VGen</option>
            <option value="TikTok">TikTok</option>
            <option value="Twitter / X">Twitter / X</option>
            <option value="Discord">Discord</option>
            <option value="Instagram">Instagram</option>
            <option value="Facebook">Facebook</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Método de Pago</label>
          <select
            value={metodoPago}
            onChange={(e) => setMetodoPago(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="PayPal">PayPal</option>
            <option value="Transferencia Bancaria">Transferencia Bancaria</option>
          </select>
        </div>
      </div>

      <hr className="border-slate-100 my-5" />

      <SelectEstilo onEstiloChange={setIdEstilo} />
      <ListaModificadores onExtrasChange={setModificadores} divisa={divisa} />

      <div className="mt-6 flex flex-col w-full max-w-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Precio Base del Estilo ({divisa})
        </label>
        <div className="relative rounded-lg">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-blue-500 font-bold text-sm">$</span>
          </div>
          <input
            type="number"
            placeholder={esTransferenciaCLP ? "15000" : "0.00"}
            value={precioBase}
            onChange={(e) => setPrecioBase(e.target.value)}
            className="w-full pl-8 pr-4 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-blue-50 text-blue-900 font-bold"
          />
        </div>
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
        {cargando ? 'Guardando...' : 'Registrar Comisión en Base de Datos'}
      </button>
    </div>
  );
};