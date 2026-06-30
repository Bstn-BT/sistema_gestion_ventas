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
  estado_retiro: 'pendiente' | 'retirado';
  fecha_retiro: string | null;
  nombre_estilo: string | null;
}

export const HistorialPage = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);

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

  const handleMarcarRetirada = async (id: number) => {
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

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Historial</h1>
        <p className="text-slate-500 text-sm mt-1">Todas tus comisiones registradas</p>
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
                  <th className="px-4 py-3 text-right">Bruto</th>
                  <th className="px-4 py-3 text-right">Neto</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {ventas.map((venta) => (
                  <tr key={venta.id_venta} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{venta.nombre_cliente}</td>
                    <td className="px-4 py-3 text-slate-600">{venta.nombre_estilo || '—'}</td>
                    <td className="px-4 py-3 text-slate-600">{venta.plataforma_origen}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {new Date(venta.fecha_venta).toLocaleDateString('es-CL')}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-800 font-medium">
                      ${parseFloat(venta.total_bruto_usd).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-green-700">
                      ${parseFloat(venta.total_neto_usd).toFixed(2)}
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
                          onClick={() => handleMarcarRetirada(venta.id_venta)}
                          disabled={procesandoId === venta.id_venta}
                          className="px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};