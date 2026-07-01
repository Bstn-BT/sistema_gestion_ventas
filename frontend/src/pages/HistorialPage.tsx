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
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  
  const [modalAbierto, setModalAbierto] = useState(false);
  const [detalleVenta, setDetalleVenta] = useState<DetalleVenta | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  const cargarVentas = async () => {
    setCargando(true);
    try {
      const res = await fetch('http://localhost:3000/api/ventas');
      const data = await res.json();
      if (data.exito) {
        setVentas(data.ventas);
      }
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  const handleMarcarRetirada = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); 
    if (!confirm('¿Confirmas que ya transferiste este dinero a tu banco? Esto calculará la comisión de retiro.')) {
      return;
    }

    setProcesandoId(id);
    try {
      const res = await fetch(`http://localhost:3000/api/ventas/${id}/retirar`, {
        method: 'PATCH',
      });
      const data = await res.json();

      if (data.exito) {
        await cargarVentas();
      } else {
        alert('Error: ' + data.mensaje);
      }
    } catch (error) {
      console.error('Error marcando como retirada:', error);
      alert('Error de conexión con el servidor.');
    } finally {
      setProcesandoId(null);
    }
  };

  const abrirModalVenta = async (id: number) => {
    setModalAbierto(true);
    setCargandoDetalle(true);
    setDetalleVenta(null);
    
    try {
      const res = await fetch(`http://localhost:3000/api/ventas/${id}`);
      const data = await res.json();
      
      if (data.exito) {
        setDetalleVenta(data.venta);
      }
    } catch (error) {
      console.error('Error al obtener el detalle de la venta:', error);
    } finally {
      setCargandoDetalle(false);
    }
  };

  // Función de ayuda para la boleta
  const formatearDinero = (monto: string, esCLP: boolean) => {
    if (esCLP) return Number(monto).toLocaleString('es-CL');
    return parseFloat(monto || '0').toFixed(2);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
        <p className="text-slate-500 text-sm mt-1">Todas tus comisiones registradas (Haz clic en una fila para ver el recibo)</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {cargando ? (
          <div className="p-8 text-center text-slate-400">Cargando ventas...</div>
        ) : ventas.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            Aún no tienes comisiones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 text-left">Cliente</th>
                  <th className="px-4 py-3 text-left">Estilo</th>
                  <th className="px-4 py-3 text-left">Plataforma</th>
                  <th className="px-4 py-3 text-left">Fecha</th>
                  <th className="px-4 py-3 text-right">Neto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventas.map((venta) => {
                  const esTransferenciaCLP = venta.metodo_pago === 'Transferencia Bancaria';
                  
                  return (
                    <tr 
                      key={venta.id_venta} 
                      onClick={() => abrirModalVenta(venta.id_venta)}
                      className="hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-slate-800">{venta.nombre_cliente}</td>
                      <td className="px-4 py-3 text-slate-600">{venta.nombre_estilo || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{venta.plataforma_origen}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {new Date(venta.fecha_venta).toLocaleDateString('es-CL')}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-green-700">
                        {esTransferenciaCLP 
                          ? `$${Number(venta.total_final_clp).toLocaleString('es-CL')} CLP` 
                          : `$${parseFloat(venta.total_neto_usd).toFixed(2)} USD`
                        }
                      </td>
                      <td className="px-4 py-3 text-center">
                        {venta.estado_retiro === 'retirado' ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                            Retirado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {venta.estado_retiro === 'pendiente' ? (
                          <button
                            onClick={(e) => handleMarcarRetirada(venta.id_venta, e)}
                            disabled={procesandoId === venta.id_venta}
                            className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {procesandoId === venta.id_venta ? 'Procesando...' : 'Marcar Retirada'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            {venta.fecha_retiro ? new Date(venta.fecha_retiro).toLocaleDateString('es-CL') : '—'}
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

      {/* MODAL ESTILO BOLETA DE TIENDA */}
      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm" onClick={() => setModalAbierto(false)}>
          
          <div 
            className="w-full max-w-sm bg-[#fafafa] shadow-2xl relative font-mono text-slate-800" 
            onClick={e => e.stopPropagation()}
            style={{ boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
          >
            {cargandoDetalle ? (
              <div className="p-12 text-center text-slate-500 animate-pulse">Imprimiendo...</div>
            ) : detalleVenta ? (
              (() => {
                const esCLP = detalleVenta.metodo_pago === 'Transferencia Bancaria';
                const divisa = esCLP ? 'CLP' : 'USD';
                
                const subtotalBruto = esCLP ? detalleVenta.total_final_clp : detalleVenta.total_bruto_usd;
                const totalFinal = esCLP ? detalleVenta.total_final_clp : detalleVenta.total_neto_usd;

                return (
                  <div className="p-8">
                    <div className="text-center mb-6">
                      <h2 className="text-xl font-bold tracking-widest uppercase mb-1">Saturnalita</h2>
                      <p className="text-xs text-slate-500">RECIBO DE COMISIÓN</p>
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

                    {/* Mostrar comisiones solo si es USD (Las transferencias no tienen comisiones en tu lógica actual) */}
                    {!esCLP && (
                      <div className="space-y-1 text-sm mt-4 mb-4 text-slate-600">
                        {parseFloat(detalleVenta.comision_plataforma_usd) > 0 && (
                          <div className="flex justify-between">
                            <span>Tarifa {detalleVenta.plataforma_origen}</span>
                            <span>-${formatearDinero(detalleVenta.comision_plataforma_usd, esCLP)}</span>
                          </div>
                        )}
                        
                        {parseFloat(detalleVenta.comision_retiro_usd) > 0 && (
                          <div className="flex justify-between">
                            <span>Tarifa {detalleVenta.metodo_pago}</span>
                            <span>-${formatearDinero(detalleVenta.comision_retiro_usd, esCLP)}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="border-t-2 border-dashed border-slate-300 mb-4 mt-4"></div>

                    <div className="flex justify-between items-center mb-8">
                      <span className="text-base font-bold">TOTAL NETO ({divisa})</span>
                      <span className="text-2xl font-black">
                        ${formatearDinero(totalFinal, esCLP)}
                      </span>
                    </div>

                    <button 
                      onClick={() => setModalAbierto(false)}
                      className="w-full bg-slate-800 hover:bg-black text-white font-sans font-semibold py-3 rounded-md transition-colors"
                    >
                      Cerrar
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="p-8 text-center text-red-500">Error al leer la boleta.</div>
            )}
            
            <div className="absolute bottom-0 left-0 right-0 h-2 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxwb2x5Z29uIGZpbGw9IiNmZmYiIHBvaW50cz0iMCA4IDQgMCA4IDggMCA4Ii8+PC9zdmc+')] bg-repeat-x rotate-180 translate-y-full opacity-50"></div>
          </div>
        </div>
      )}

    </div>
  );
};