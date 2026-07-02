import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, FolderOpen } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={18} strokeWidth={2.2} /> },
  { to: '/nueva-comision', label: 'Nueva Comisión', icon: <PlusCircle size={18} strokeWidth={2.2} /> },
  { to: '/historial', label: 'Historial', icon: <History size={18} strokeWidth={2.2} /> },
  { to: '/catalogo', label: 'Catálogo', icon: <FolderOpen size={18} strokeWidth={2.2} /> },
];

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      
      {/* Barra lateral */}
      <aside className="w-64 bg-gradient-to-b from-[#1f1f2e] via-[#1f1f2e] to-[#086455] text-white flex flex-col hidden md:flex border-r border-[#086455]/30 shadow-2xl relative overflow-hidden">
        
        {/* Patrón animado de murciélagos */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-luminosity" 
          style={{ 
            backgroundImage: 'url(https://64.media.tumblr.com/d65212d0050b2057686a31a3033377a4/9a5e59d4a20102aa-17/s75x75_c1/f537b0a0585d89556f1dfac7a609449e0dcd6813.gif)', 
            backgroundSize: '75px 75px',
            backgroundRepeat: 'repeat'
          }} 
        />

        {/* Cabecera del Sidebar con ícono personalizado */}
        <div className="h-16 flex items-center px-6 border-b border-[#086455]/30 relative z-10 shadow-sm bg-[#1f1f2e]/40 backdrop-blur-sm">
          <div className="w-9 h-9 rounded-lg overflow-hidden shadow-lg shadow-[#0e8571]/30 mr-3 border border-[#0e8571]/40 flex-shrink-0">
            <img 
              src="/chuuyaicon.jpg" 
              alt="Logo Chuuya" 
              className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
            />
          </div>
          <span className="text-xl font-bold tracking-wide drop-shadow-md">
            Art<span className="text-[#0e8571]">Commissions</span>
          </span>
        </div>
        
        {/* Navegación */}
        <nav className="flex-1 px-4 py-6 space-y-2 relative z-10">
          <h3 className="px-2 text-[10px] font-black text-[#0e8571] uppercase tracking-[0.2em] mb-4 drop-shadow-sm">
            Menú Principal
          </h3>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium backdrop-blur-sm ${
                  isActive
                    ? 'bg-gradient-to-b from-[#0e8571] to-[#0b6354] text-white shadow-md shadow-[#0e8571]/20 border border-[#0e8571]/50 translate-x-1'
                    : 'text-slate-300 hover:bg-[#1f1f2e]/80 hover:text-white hover:translate-x-1 border border-transparent'
                }`
              }
            >
              {item.icon}
              <span className="drop-shadow-sm">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Cabecera */}
        <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 z-10 sticky top-0 transition-all duration-300">
          <div className="flex items-center w-1/3 group">
            <div className="relative w-full transition-all duration-300 focus-within:w-[110%]">
              <input 
                type="text" 
                placeholder="Buscar comisiones..." 
                className="w-full bg-slate-100/50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0e8571]/50 focus:border-[#0e8571] transition-all duration-300 placeholder:text-slate-400"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-700">Bastián</p>
              <p className="text-xs text-[#0e8571] font-medium">Administrador</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#0e8571] to-[#0b6354] flex items-center justify-center text-white font-bold shadow-md shadow-[#0e8571]/20 hover:scale-105 transition-transform cursor-pointer">
              B
            </div>
          </div>
        </header>

        {/* Area de contenido */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-8">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};