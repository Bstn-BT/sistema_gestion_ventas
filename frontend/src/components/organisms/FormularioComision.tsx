import { useState } from 'react';
import { InputDolar } from '../molecules/InputDolar';
import { SelectEstilo } from '../molecules/SelectEstilo';
import { ListaModificadores } from '../molecules/ListaModificadores';

export const FormularioComision = () => {
  // Estados de control de las moléculas
  const [valorDolar, setValorDolar] = useState(0);
  const [idEstilo, setIdEstilo] = useState(0);
  const [modificadores, setModificadores] = useState<any[]>([]);
  
  // Nuevos estados para los datos que exige la Base de Datos
  const [nombreCliente, setNombreCliente] = useState('');
  const [plataforma, setPlataforma] = useState('VGen');
  const [metodoPago, setMetodoPago] = useState('PayPal');
  const [moneda, setMoneda] = useState('USD');
  const [totalUsd, setTotalUsd] = useState('');

  const handleRegistrarVenta = async () => {
    if (!valorDolar || !idEstilo || !totalUsd || !nombreCliente.trim()) {
      alert('Por favor completa el nombre del cliente, el valor del dólar, el estilo y el monto total.');
      return;
    }

    // Cálculo automático del valor de la celda CLP
    const totalClp = Math.round(Number(totalUsd) * valorDolar);

    const payload = {
      total_usd: Number(totalUsd),
      valor_dolar: valorDolar,
      total_clp: totalClp,
      id_estilo: idEstilo,
      modificadores: modificadores,
      nombre_cliente: nombreCliente.trim(),
      plataforma_origen: plataforma,
      metodo_pago: metodoPago,
      moneda_origen: moneda
    };

    try {
      const res = await fetch('http://localhost:3000/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (data.exito) {
        alert('¡Comisión guardada exitosamente en PostgreSQL!');
        window.location.reload(); 
      } else {
        alert('Error: ' + data.mensaje);
      }
    } catch (error) {
      console.error('Error enviando la venta:', error);
      alert('Error de conexión con el servidor.');
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm w-full max-w-2xl">
      <h2 className="text-lg font-semibold text-slate-800 mb-6 border-b pb-4">
        Detalles del Encargo y Finanzas
      </h2>
      
      {/* Datos del Cliente */}
      <div className="mb-4 flex flex-col w-full max-w-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Cliente / User</label>
        <input 
          type="text"
          placeholder=""
          value={nombreCliente}
          onChange={(e) => setNombreCliente(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
      </div>

      {/* Grid de Origen (Plataforma, Método de Pago y Moneda) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4 max-w-xl">
        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Plataforma</label>
          <select 
            value={plataforma} 
            onChange={(e) => setPlataforma(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="VGen">VGen</option>
            <option value="Artistree">Artistree</option>
            <option value="Twitter / X">Twitter / X</option>
            <option value="Discord">Discord</option>
            <option value="Instagram">Instagram</option>
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
            <option value="Sencillito / Mach">MACH / Tenpo</option>
          </select>
        </div>

        <div className="flex flex-col">
          <label className="block text-sm font-semibold text-gray-700 mb-1">Moneda Cobro</label>
          <select 
            value={moneda} 
            onChange={(e) => setMoneda(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USD">USD (Dólares)</option>
            <option value="CLP">CLP (Pesos)</option>
          </select>
        </div>
      </div>

      {/* Componentes atómicos/moleculares previos */}
      <hr className="border-slate-100 my-5" />
      
      <InputDolar onValorChange={setValorDolar} />
      <SelectEstilo onEstiloChange={setIdEstilo} />
      <ListaModificadores onExtrasChange={setModificadores} />

      {/* Precio Total de la Operación */}
      <div className="mt-6 flex flex-col w-full max-w-sm">
        <label className="block text-sm font-semibold text-gray-700 mb-1">
          Total Neto Recibido o Cobrado
        </label>
        <div className="relative rounded-lg shadow-xs">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-blue-500 font-bold text-sm">{moneda === 'USD' ? '$' : 'CLP'}</span>
          </div>
          <input 
            type="number"
            placeholder="0.00"
            value={totalUsd}
            onChange={(e) => setTotalUsd(e.target.value)}
            className="w-full pl-12 pr-4 py-2 border border-blue-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 bg-blue-50 text-blue-900 font-bold"
          />
        </div>
      </div>

      {/* Botón de envío transaccional */}
      <button 
        onClick={handleRegistrarVenta}
        className="mt-8 w-full bg-blue-600 text-white font-bold py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md cursor-pointer"
      >
        Registrar Comisión en Base de Datos
      </button>
    </div>
  );
};