import { useEffect, useState } from 'react';
import { Label } from '../atoms/Label';
import { Input } from '../atoms/Input';

export const InputDolar = () => {
  // Estado para guardar el valor numérico (o un texto mientras carga)
  const [valorDolar, setValorDolar] = useState<number | string>('Calculando...');

  // El useEffect se ejecuta una sola vez cuando el componente aparece en pantalla
  useEffect(() => {
    const obtenerDolar = async () => {
      try {
        // Llama al backend para obtener el valor del dólar
        const respuesta = await fetch('http://localhost:3000/api/dolar');
        const data = await respuesta.json();
        
        if (data.exito) {
          setValorDolar(data.paypal_estimado);
        }
      } catch (error) {
        console.error('Error conectando al backend:', error);
        setValorDolar(''); // Si falla, queda vacío para que el usuario pueda ingresar manualmente
      }
    };

    obtenerDolar();
  }, []);

  return (
    <div className="flex flex-col mb-4 w-full max-w-sm">
      <Label htmlFor="dolar_paypal" texto="Valor Dólar a CLP (PayPal -3.5%)" />
      <Input 
        id="dolar_paypal"
        type="number" 
        step="0.01"
        value={valorDolar}
        onChange={(e) => setValorDolar(e.target.value)} // Permite que sea editable
        placeholder="Ej: 915.50"
      />
      <p className="text-xs text-gray-500 mt-2">
        En caso de que el valor no se pueda obtener automáticamente, puedes ingresarlo manualmente.
      </p>
    </div>
  );
};