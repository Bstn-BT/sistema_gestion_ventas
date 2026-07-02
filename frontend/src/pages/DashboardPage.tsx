import { useEffect, useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Venta {
  id_venta: number;
  plataforma_origen: string;
  metodo_pago: string;
  fecha_venta: string;
  total_neto_usd: string;
  total_final_clp: string;
  estado_retiro: 'pendiente' | 'retirado';
}

// Tooltip personalizado para el gráfico de barras
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 backdrop-blur-sm px-4 py-3 rounded-xl shadow-lg border border-slate-100">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-lg font-black" style={{ color: '#1B4361' }}>
          ${payload[0].value.toFixed(2)} <span className="text-xs font-medium text-slate-400">USD</span>
        </p>
      </div>
    );
  }
  return null;
};

export const DashboardPage = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarVentas = async () => {
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
    cargarVentas();
  }, []);

  // --- PROCESAMIENTO DE DATOS PARA EL DASHBOARD ---
  const metricas = useMemo(() => {
    let clpGanado = 0;
    let usdPendiente = 0;
    let usdRetirado = 0;
    const conteoPlataformas: Record<string, number> = {};
    const ingresosPorMes: Record<string, number> = {};

    ventas.forEach((v) => {
      // 1. Tarjetas de Resumen
      clpGanado += Number(v.total_final_clp || 0);
      
      if (v.estado_retiro === 'pendiente') {
        usdPendiente += Number(v.total_neto_usd || 0);
      } else {
        usdRetirado += Number(v.total_neto_usd || 0);
      }

      // 2. Gráfico de Pastel (De dónde vienen los clientes)
      conteoPlataformas[v.plataforma_origen] = (conteoPlataformas[v.plataforma_origen] || 0) + 1;

      // 3. Gráfico de Barras (Ingresos en USD por mes)
      // Agrupamos usando el formato 'YYYY-MM'
      const fecha = new Date(v.fecha_venta);
      const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
      
      if (v.metodo_pago !== 'Transferencia Bancaria') {
        ingresosPorMes[mes] = (ingresosPorMes[mes] || 0) + Number(v.total_neto_usd || 0);
      }
    });

    // Formatear datos para Recharts
    const datosPlataformas = Object.keys(conteoPlataformas).map(key => ({
      name: key,
      value: conteoPlataformas[key]
    }));

    // Ordenar los meses cronológicamente para el gráfico de barras
    const datosMeses = Object.keys(ingresosPorMes).sort().map(mes => {
      // Convertir '2026-06' a 'Jun 2026'
      const [year, month] = mes.split('-');
      const nombreMes = new Date(Number(year), Number(month) - 1).toLocaleString('es-ES', { month: 'short' });
      return {
        mes: `${nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1)} ${year}`,
        ingresos: parseFloat(ingresosPorMes[mes].toFixed(2))
      };
    });

    return { clpGanado, usdPendiente, usdRetirado, datosPlataformas, datosMeses };
  }, [ventas]);

  // Paleta de la marca aplicada a ambos gráficos
  const COLORES_PASTEL = ['#1B4361', '#AB273B', '#0C2245', '#52171E'];

  if (cargando) {
    return <div className="p-8 text-center text-slate-500">Cargando métricas...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Panel Financiero</h1>
        <p className="text-slate-500 text-sm mt-1">Resumen general de tus comisiones artísticas</p>
      </div>

      {/* TARJETAS DE RESUMEN (KPIs) */}
      {/* #AB273B */}
      {/* #52171E */}
      {/* #1B4361 */}
      {/* #0C2245 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4" style={{ borderLeftColor: '#1B4361' }}>
          <p className="text-sm font-semibold text-slate-500 mb-1">Total CLP Generado</p>
          <h3 className="text-3xl font-black" style={{ color: '#1B4361' }}>
            ${metricas.clpGanado.toLocaleString('es-CL')}
          </h3>
          <p className="text-xs text-green-600 font-medium mt-2">↑ Ingresos limpios en cuenta</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4" style={{ borderLeftColor: '#AB273B' }}>
          <p className="text-sm font-semibold text-slate-500 mb-1">USD Pendiente (Por Retirar)</p>
          <h3 className="text-3xl font-black" style={{ color: '#AB273B' }}>
            ${metricas.usdPendiente.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-2">PayPal</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm border-l-4" style={{ borderLeftColor: '#52171E' }}>
          <p className="text-sm font-semibold text-slate-500 mb-1">USD Histórico Retirado</p>
          <h3 className="text-3xl font-black" style={{ color: '#52171E' }}>
            ${metricas.usdRetirado.toFixed(2)}
          </h3>
          <p className="text-xs text-slate-400 font-medium mt-2">Dinero procesado</p>
        </div>
      </div>

      {/* ZONA DE GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* GRÁFICO DE BARRAS: Ingresos mensuales */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-slate-800">Evolución de Ingresos (USD)</h3>
              <p className="text-xs text-slate-400 mt-0.5">Neto mensual recibido por plataformas digitales</p>
            </div>
          </div>
          <div className="h-72 w-full">
            {metricas.datosMeses.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas.datosMeses} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1B4361" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0C2245" stopOpacity={0.9} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis
                    dataKey="mes"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#64748B', fontWeight: 500 }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: '#94A3B8' }}
                    tickFormatter={(v) => `$${v}`}
                  />
                  <Tooltip cursor={{ fill: '#F8FAFC' }} content={<CustomTooltip />} />
                  <Bar
                    dataKey="ingresos"
                    fill="url(#barGradient)"
                    radius={[8, 8, 0, 0]}
                    name="Neto USD"
                    maxBarSize={48}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm gap-2">
                <span className="text-3xl">📊</span>
                No hay datos suficientes para graficar.
              </div>
            )}
          </div>
        </div>

        {/* GRÁFICO DE PASTEL: Distribución de plataformas */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="text-base font-bold text-slate-800 mb-6">Comisiones por Plataforma</h3>
          <div className="h-72 w-full">
            {metricas.datosPlataformas.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metricas.datosPlataformas}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {metricas.datosPlataformas.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORES_PASTEL[index % COLORES_PASTEL.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    itemStyle={{ fontWeight: 'bold' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No hay datos suficientes para graficar.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};