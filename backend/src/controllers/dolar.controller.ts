import { Request, Response } from 'express';

export const obtenerDolarPayPal = async (req: Request, res: Response) => {
    try {
        // Solicitud a la API de mindicador.cl para obtener el valor del dólar
        const respuesta = await fetch('https://mindicador.cl/api/dolar');
        const data = await respuesta.json();

        // Extrae el valor oficial del dólar desde la respuesta de la API
        const valorOficial = data.serie[0].valor;

        // Calcula el descuento aplicado por PayPal (3.5% de spread)
        const spreadPayPal = 0.035;
        const valorPayPal = valorOficial * (1 - spreadPayPal);

        // Devuelve la respuesta con el valor oficial y el valor estimado de PayPal
        res.json({
            exito: true,
            oficial: valorOficial,
            paypal_estimado: parseFloat(valorPayPal.toFixed(2)), // Redondeado a 2 decimales
            fecha: data.serie[0].fecha
        });
    } catch (error) {
        console.error('Error al obtener el dólar:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al consultar el valor del dólar'
        });
    }
};