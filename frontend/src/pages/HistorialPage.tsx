import { useEffect, useState } from 'react';

interface Venta {
  id_venta: number;
  nombre_cliente: string;
  plataforma_origen: string;
  metodo_pago: string;
  fecha_venta: string;
  total_bruto_usd: string;
  comision_plataforma_usd: string;
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

export const HistorialPage = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  
  const [seleccionadas, setSeleccionadas] = useState<number[]>([]);
  const [procesandoMasivo, setProcesandoMasivo] = useState(false);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<DetalleVenta | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  // NUEVO: Estado para controlar cuál boleta se está visualizando ('comercial' o 'bancaria')
  const [boletaVista, setBoletaVista] = useState<'comercial' | 'bancaria'>('comercial');

  const cargarVentas = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/ventas');
      const data = await res.json();
      if (data.exito) setVentas(data.ventas);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarVentas(); }, []);

  const toggleSeleccion = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSeleccionadas(prev => 
      prev.includes(id) ? prev.filter(v => v !== id) : [...prev, id]
    );
  };

  const handleRetiroMasivo = async () => {
    const valorDolarStr = window.prompt(`Estás a punto de retirar ${seleccionadas.length} comisiones a tu cuenta bancaria.\n\nEsto calculará automáticamente el 3.5% de PayPal y descontará los $800 CLP fijos distribuyéndolos entre todas las ventas.\n\nPor favor, ingresa a cuánto está el DÓLAR HOY (Ej: 950):`);
    
    if (!valorDolarStr) return;
    
    const valorDolar = parseFloat(valorDolarStr);
    if (isNaN(valorDolar) || valorDolar <= 0) {
      return alert('Debes ingresar un valor de dólar válido.');
    }

    setProcesandoMasivo(true);
    try {
      const res = await fetch('http://localhost:3000/api/ventas/retirar-masivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: seleccionadas, valor_dolar: valorDolar }),
      });
      const data = await res.json();

      if (data.exito) {
        alert(data.mensaje);
        setSeleccionadas([]);
        await cargarVentas();
      } else {
        alert('Error: ' + data.mensaje);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setProcesandoMasivo(false);
    }
  };

  const abrirModalVenta = async (id: number) => {
    setModalAbierto(true);
    setCargandoDetalle(true);
    setDetalleVenta(null);
    setBoletaVista('comercial'); // Forzamos a que siempre abra primero en la boleta comercial
    try {
      const res = await fetch(`http://localhost:3000/api/ventas/${id}`);
      const data = await res.json();
      if (data.exito) setDetalleVenta(data.venta);
    } catch (error) {} finally { setCargandoDetalle(false); }
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
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex justify-between items-center mb-6 shadow-sm">
          <div>
            <span className="font-bold text-blue-800 text-lg">{seleccionadas.length}</span>
            <span className="text-blue-700 ml-2 font-medium">ventas seleccionadas listas para retirar en bloque.</span>
          </div>
          <button 
            onClick={handleRetiroMasivo}
            disabled={procesandoMasivo}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors shadow disabled:opacity-50"
          >
            {procesandoMasivo ? 'Procesando banco...' : 'Ejecutar Retiro Masivo'}
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-slate-400">Cargando ventas...</div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No tienes comisiones registradas.</div>
        ) : (
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
                {ventas.map((v) => {
                  const esTransferenciaCLP = v.metodo_pago === 'Transferencia Bancaria';
                  const estaRetirado = v.estado_retiro === 'retirado';
                  
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
                      <td className="px-4 py-3 text-slate-600">{v.plataforma_origen}</td>
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
        )}
      </div>

      {/* MODAL CON INTERCAMBIO POR FLECHAS */}
      {modalAbierto && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" 
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
                
                const subtotalBruto = esCLP ? detalleVenta.total_final_clp : detalleVenta.total_bruto_usd;
                const totalFinal = esCLP ? detalleVenta.total_final_clp : detalleVenta.total_neto_usd;

                return (
                  <>
                    {/* BARRA SUPERIOR DE INTERCAMBIO (Solo aparece si la venta es de PayPal y ya fue retirada) */}
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

                    {/* VISTA 1: RECIBO COMERCIAL */}
                    {(!tieneDobleBoleta || boletaVista === 'comercial') && (
                      <div 
                        className={`w-full bg-[#fafafa] relative font-mono text-slate-800 p-8 pb-6 ${tieneDobleBoleta ? 'rounded-b-lg shadow-2xl' : 'rounded-lg shadow-2xl'}`}
                      >
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold tracking-widest uppercase mb-1">Saturnalita</h2>
                          <p className="text-xs text-slate-500">RECIBO COMERCIAL ({divisa})</p>
                          <p className="text-xs text-slate-500 mt-2">
                            FECHA: {new Date(detalleVenta.fecha_venta).toLocaleDateString('es-CL')}
                          </p>
                          <p className="text-xs text-slate-500">TICKET #: {String(detalleVenta.id_venta).padStart(5, '0')}</p>
                        </div>

                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>

                        <div className="mb-4 text-sm">
                          <p><strong>CLIENTE:</strong> {detalleVenta.nombre_cliente}</p>
                          <p><strong>ORIGEN:</strong> {detalleVenta.plataforma_origen}</p>
                          <p><strong>PAGO:</strong> {detalleVenta.metodo_pago}</p>
                        </div>

                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between font-bold">
                            <span>DESCRIPCIÓN</span>
                            <span>IMPORTE</span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span>1x {detalleVenta.nombre_estilo || 'Estilo Base'}</span>
                            <span>${formatearDinero(detalleVenta.precio_estilo, esCLP)}</span>
                          </div>
                          
                          {detalleVenta.modificadores.map((mod, index) => (
                            <div key={index} className="flex justify-between pl-4 text-slate-600">
                              <span>+ {mod.nombre}</span>
                              <span>${formatearDinero(mod.precio, esCLP)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex justify-between text-sm font-bold mt-4 pt-2 border-t border-slate-300">
                          <span>SUBTOTAL BRUTO</span>
                          <span>${formatearDinero(subtotalBruto, esCLP)}</span>
                        </div>

                        {!esCLP && (
                          <div className="space-y-1 text-sm mt-4 mb-4 text-slate-600">
                            {parseFloat(detalleVenta.comision_plataforma_usd) > 0 && (
                              <div className="flex justify-between">
                                <span>Tarifa {detalleVenta.plataforma_origen}</span>
                                <span>-${formatearDinero(detalleVenta.comision_plataforma_usd, esCLP)}</span>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="border-t-2 border-dashed border-slate-300 mb-4 mt-4"></div>

                        <div className="flex justify-between items-center mb-6">
                          <span className="text-base font-bold">NETO USD</span>
                          <span className="text-2xl font-black">
                            ${formatearDinero(totalFinal, esCLP)}
                          </span>
                        </div>

                        <button 
                          onClick={() => setModalAbierto(false)}
                          className="w-full bg-slate-800 hover:bg-black text-white font-sans font-semibold py-3 rounded-md transition-colors mt-2 cursor-pointer"
                        >
                          Cerrar Recibo
                        </button>
                        
                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmYiIHBvaW50cz0iMCA4IDQgMCA4IDggMCA4Ii8+PC9zdmc+')] bg-repeat-x rotate-180 translate-y-full opacity-50"></div>
                      </div>
                    )}

                    {/* VISTA 2: LIQUIDACIÓN BANCARIA (CLP) */}
                    {tieneDobleBoleta && boletaVista === 'bancaria' && (
                      <div 
                        className="w-full bg-[#f0f4f8] rounded-b-lg shadow-2xl relative font-mono text-slate-800 p-8 pb-6"
                      >
                        <div className="text-center mb-6">
                          <h2 className="text-xl font-bold tracking-widest uppercase mb-1">MercadoPago</h2>
                          <p className="text-xs text-slate-500">LIQUIDACIÓN DE DIVISAS</p>
                          <p className="text-xs text-slate-500 mt-2">
                            FECHA RETIRO: {detalleVenta.fecha_retiro ? new Date(detalleVenta.fecha_retiro).toLocaleDateString('es-CL') : '—'}
                          </p>
                          <p className="text-xs text-slate-500">REF TICKET #: {String(detalleVenta.id_venta).padStart(5, '0')}</p>
                        </div>

                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>

                        <div className="mb-4 text-sm">
                          <p><strong>ORIGEN:</strong> {detalleVenta.metodo_pago}</p>
                          <p><strong>OPERACIÓN:</strong> Retiro Internacional</p>
                        </div>

                        <div className="border-t-2 border-dashed border-slate-300 mb-4"></div>

                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between font-bold">
                            <span>CONCEPTO</span>
                            <span>MONTO</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Fondo Comercial</span>
                            <span>${parseFloat(detalleVenta.total_neto_usd).toFixed(2)} USD</span>
                          </div>
                        </div>

                        <div className="space-y-1 text-sm mt-4 mb-4 text-slate-600">
                          {parseFloat(detalleVenta.comision_retiro_usd) > 0 && (
                            <div className="flex justify-between">
                              <span>Tarifa {detalleVenta.metodo_pago} (3.5%)</span>
                              <span>-${parseFloat(detalleVenta.comision_retiro_usd).toFixed(2)} USD</span>
                            </div>
                          )}
                          <div className="text-xs mt-2 italic text-slate-400">
                            * El tipo de cambio y los $800 fijos de PayPal se aplicaron en el bloque acumulado.
                          </div>
                        </div>

                        <div className="border-t-2 border-dashed border-slate-300 mb-4 mt-4"></div>

                        <div className="flex justify-between items-center mb-6">
                          <span className="text-base font-bold">LIQUIDO CLP</span>
                          <span className="text-2xl font-black text-blue-700">
                            ${Number(detalleVenta.total_final_clp).toLocaleString('es-CL')} CLP
                          </span>
                        </div>

                        <button 
                          onClick={() => setModalAbierto(false)}
                          className="w-full bg-blue-700 hover:bg-blue-800 text-white font-sans font-semibold py-3 rounded-md transition-colors mt-2 cursor-pointer"
                        >
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