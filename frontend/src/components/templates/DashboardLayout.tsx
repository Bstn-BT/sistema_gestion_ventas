import React from 'react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Barra lateral - Oscura */}
      <aside className="w-64 bg-gradient-to-b from-[#1f1f2e] via-[#1f1f2e] to-[#086455] text-white flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold tracking-wide">ArtCommissions</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="#" className="flex items-center px-4 py-3 bg-gradient-to-b from-[#0e8571] to-[#0b6354] text-white rounded-lg">
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
            <span className="font-medium">Nueva Comisión</span>
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
            <span className="font-medium">Historial</span>
          </a>
          <a href="#" className="flex items-center px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-lg transition-colors">
            <span className="font-medium">Catálogo</span>
          </a>
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Cabecera */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center w-1/3">
            <input 
              type="text" 
              placeholder="Buscar comisiones..." 
              className="w-full bg-slate-100 border-none rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">Bastián</p>
              <p className="text-xs text-slate-500">Administrador</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
              B
            </div>
          </div>
        </header>

        {/* Area de contenido (formulario o los gráficos) */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8">
          {children}
        </main>
      </div>
    </div>
  );
};