import { useEffect, useState } from 'react';

// Define la forma de los datos
interface Modificador {
  id: number;
  nombre: string;
}

// Define las props para comunicarnos con el padre (FormularioComision)
interface ListaModificadoresProps {
  onExtrasChange: (extras: any[]) => void;
}

export const ListaModificadores = ({ onExtrasChange }: ListaModificadoresProps) => {
  const [modificadores, setModificadores] = useState<Modificador[]>([]);
  const [seleccionados, setSeleccionados] = useState<{ [key: number]: boolean }>({});
  const [preciosLocales, setPreciosLocales] = useState<{ [key: number]: string }>({});
  const [nuevoExtra, setNuevoExtra] = useState('');

  // Carga extras desde el backend
  const cargarModificadores = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/catalogos');
      const data = await res.json();
      const mapeo = data.modificadores.map((m: any) => ({
        id: m.id_modificador,
        nombre: m.nombre_modificador
      }));
      setModificadores(mapeo);
    } catch (error) {
      console.error('Error cargando modificadores:', error);
    }
  };

  // Carga inicial al montar el componente
  useEffect(() => {
    cargarModificadores();
  }, []);

  // Avisa al componente padre cada vez que seleccionados o preciosLocales cambien
  useEffect(() => {
    const extrasActivos = Object.keys(seleccionados)
      .filter(id => seleccionados[Number(id)])
      .map(id => ({
        id: Number(id),
        precio: preciosLocales[Number(id)] || 0 // Si no le puso precio, enviamos 0
      }));
      
    // Dispara la función del padre
    onExtrasChange(extrasActivos);
  }, [seleccionados, preciosLocales, onExtrasChange]); 

  // Maneja el cambio de estado del checkbox
  const handleCheckboxChange = (id: number) => {
    setSeleccionados(prev => ({ ...prev, [id]: !prev[id] }));
    if (seleccionados[id]) {
      // Si el usuario desmarca el checkbox, limpia el precio que había escrito
      setPreciosLocales(prev => {
        const copia = { ...prev };
        delete copia[id];
        return copia;
      });
    }
  };

  // Guarda un nuevo modificador en la base de datos PostgreSQL
  const handleAgregarNuevoExtra = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoExtra.trim()) return;

    try {
      const res = await fetch('http://localhost:3000/api/catalogos/modificadores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre_modificador: nuevoExtra.trim() })
      });
      const data = await res.json();

      if (data.exito) {
        setNuevoExtra('');
        await cargarModificadores(); // Recarga la lista directo de la base de datos
      } else {
        alert(data.mensaje);
      }
    } catch (error) {
      console.error('Error al crear modificador:', error);
    }
  };

  return (
    <div className="mt-6">
      <p className="text-sm font-semibold text-slate-700 mb-3">Extras / Modificadores</p>
      
      {/* Lista de modificadores dinámicos */}
      <div className="space-y-2 max-h-60 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50 mb-4">
        {modificadores.map((mod) => (
          <div key={mod.id} className="flex items-center justify-between p-2 bg-white rounded-md border border-slate-100 shadow-xs">
            
            <label className="flex items-center space-x-3 cursor-pointer flex-1">
              <input 
                type="checkbox" 
                checked={!!seleccionados[mod.id]}
                onChange={() => handleCheckboxChange(mod.id)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded" 
              />
              <span className="text-sm text-slate-700 font-medium">{mod.nombre}</span>
            </label>

            {/* Si está seleccionado, muestra el input de precio */}
            {seleccionados[mod.id] && (
              <div className="flex items-center space-x-1">
                <span className="text-xs text-slate-400 font-semibold">USD</span>
                <input 
                  type="number"
                  placeholder="Precio"
                  value={preciosLocales[mod.id] || ''}
                  onChange={(e) => setPreciosLocales(prev => ({ ...prev, [mod.id]: e.target.value }))}
                  className="w-20 px-2 py-1 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-right"
                />
              </div>
            )}
            
          </div>
        ))}
      </div>

      {/* Formulario interno para agregar una opción nueva */}
      <form onSubmit={handleAgregarNuevoExtra} className="flex space-x-2">
        <input 
          type="text"
          placeholder="Añadir nuevo extra personalizado..."
          value={nuevoExtra}
          onChange={(e) => setNuevoExtra(e.target.value)}
          className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        />
        <button 
          type="submit"
          className="px-4 py-2 bg-slate-800 text-white text-sm font-semibold rounded-lg hover:bg-slate-700 transition-colors"
        >
          + Añadir
        </button>
      </form>
    </div>
  );
};