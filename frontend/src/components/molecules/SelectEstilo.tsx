import { useEffect, useState } from 'react';
import { Label } from '../atoms/Label';
import { Select } from '../atoms/Select';

export const SelectEstilo = ( { onEstiloChange }: { onEstiloChange: (value: number) => void }) => {
  const [estilos, setEstilos] = useState<{ id: number; nombre: string }[]>([]);

  useEffect(() => {
    const fetchEstilos = async () => {
      try {
        const res = await fetch('http://localhost:3000/api/catalogos');
        const data = await res.json();
        // Mapea los datos de Postgres a lo que nuestro Select espera
        const mapeo = data.estilos.map((e: any) => ({
          id: e.id_tipo_comision,
          nombre: e.nombre_estilo
        }));
        setEstilos(mapeo);
      } catch (error) {
        console.error('Error cargando estilos:', error);
      }
    };
    fetchEstilos();
  }, []);

  return (
    <div className="flex flex-col mb-4 w-full max-w-sm">
      <Label htmlFor="estilo" texto="Estilo de Dibujo" />
      <Select id="estilo" opciones={estilos} onChange={(e) => onEstiloChange(Number(e.target.value))}/>
    </div>
  );
};