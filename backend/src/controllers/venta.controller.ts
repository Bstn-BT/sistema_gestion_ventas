import { Request, Response } from 'express';
import { pool } from '../config/database';

export const registrarVenta = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const {
            nombre_cliente,
            plataforma_origen,
            metodo_pago,
            moneda_origen,
            id_estilo,
            modificadores,
            total_bruto_usd,
            comision_vgen_usd: comisionVGenIngresada,
            comision_recepcion_paypal_usd: comisionRecepcionPayPalIngresada,
            steam_app_id: steamAppIdIngresado,
            steam_game_name: steamGameNameIngresado,
            steam_game_image: steamGameImageIngresada,
            steam_game_price_clp: steamGamePriceIngresado,
        } = req.body;

        // Validaciones
        if (!nombre_cliente?.trim() || !plataforma_origen || !metodo_pago || !id_estilo) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Faltan datos obligatorios para registrar la comisión'
            });
        }

        const esPagoSteam = metodo_pago === 'Juego de Steam';
        const bruto = esPagoSteam ? 0 : Number(total_bruto_usd);
        if (!esPagoSteam && (!Number.isFinite(bruto) || bruto <= 0)) {
            return res.status(400).json({
                exito: false,
                mensaje: 'El monto total debe ser un número mayor a 0'
            });
        }

        const steamAppId = esPagoSteam ? Number(steamAppIdIngresado) : null;
        const steamGameName = esPagoSteam ? String(steamGameNameIngresado || '').trim() : null;
        const steamGameImage = esPagoSteam && typeof steamGameImageIngresada === 'string' && steamGameImageIngresada.startsWith('https://')
            ? steamGameImageIngresada
            : null;
        const steamGamePrice = esPagoSteam && Number.isFinite(Number(steamGamePriceIngresado)) && Number(steamGamePriceIngresado) >= 0
            ? Math.round(Number(steamGamePriceIngresado))
            : null;

        if (esPagoSteam && (!Number.isSafeInteger(steamAppId) || Number(steamAppId) <= 0 || !steamGameName)) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Debes seleccionar un juego válido desde el buscador de Steam'
            });
        }

        const aplicaComisionesVGen = plataforma_origen === 'VGen' && metodo_pago === 'PayPal';

        if (aplicaComisionesVGen && (comisionVGenIngresada === undefined || comisionRecepcionPayPalIngresada === undefined)) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Debes ingresar manualmente las comisiones de VGen y recepción en PayPal'
            });
        }

        const tarifaVGen = aplicaComisionesVGen ? Number(comisionVGenIngresada ?? 0) : 0;
        const tarifaRecepcionPayPal = aplicaComisionesVGen ? Number(comisionRecepcionPayPalIngresada ?? 0) : 0;
        const tarifaPlataforma = tarifaVGen + tarifaRecepcionPayPal;

        if (!Number.isFinite(tarifaVGen) || tarifaVGen < 0 || !Number.isFinite(tarifaRecepcionPayPal) || tarifaRecepcionPayPal < 0) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Las comisiones de VGen y PayPal deben ser montos válidos'
            });
        }
        if (tarifaPlataforma > bruto) {
            return res.status(400).json({
                exito: false,
                mensaje: 'Las comisiones de VGen y PayPal no pueden superar el total bruto'
            });
        }
        
        // --- LÓGICA DE MONEDAS Y ESTADOS ---
        let bruto_usd = bruto;
        let comision_vgen_usd = parseFloat(tarifaVGen.toFixed(2));
        let comision_recepcion_paypal_usd = parseFloat(tarifaRecepcionPayPal.toFixed(2));
        let comision_plataforma_usd = parseFloat((comision_vgen_usd + comision_recepcion_paypal_usd).toFixed(2));
        let neto_usd = parseFloat((bruto - comision_plataforma_usd).toFixed(2));
        let final_clp = 0; 
        
        let estado_retiro = 'pendiente';

        // Si es transferencia bancaria, intercepta los datos
        if (esPagoSteam) {
            estado_retiro = 'retirado';
            bruto_usd = 0;
            neto_usd = 0;
            final_clp = 0;
            comision_plataforma_usd = 0;
            comision_vgen_usd = 0;
            comision_recepcion_paypal_usd = 0;
        } else if (metodo_pago === 'Transferencia Bancaria') {
            estado_retiro = 'retirado';
            
            // Mueve el valor digitado a CLP y vaciamos los USD para que no se mezclen
            final_clp = bruto; 
            bruto_usd = 0;
            neto_usd = 0;
            comision_plataforma_usd = 0;
            comision_vgen_usd = 0;
            comision_recepcion_paypal_usd = 0;
        }

        await client.query('BEGIN');

        const queryVenta = `
            INSERT INTO VENTA (
                nombre_cliente,
                plataforma_origen,
                metodo_pago,
                moneda_origen,
                fecha_venta,
                total_bruto_usd,
                comision_plataforma_usd,
                comision_vgen_usd,
                comision_recepcion_paypal_usd,
                steam_app_id,
                steam_game_name,
                steam_game_image,
                steam_game_price_clp,
                comision_retiro_usd,
                total_neto_usd,
                total_final_clp,
                estado_retiro,
                fecha_retiro
            )
            VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6, $7, $8, $9, $10, $11, $12, 0, $13, $14, $15, ${estado_retiro === 'retirado' ? 'CURRENT_DATE' : 'NULL'})
            RETURNING id_venta;
        `;

        const resVenta = await client.query(queryVenta, [
            nombre_cliente.trim(),
            plataforma_origen,
            metodo_pago,
            esPagoSteam ? 'STM' : (metodo_pago === 'Transferencia Bancaria' ? 'CLP' : (moneda_origen || 'USD')),
            bruto_usd,
            comision_plataforma_usd,
            comision_vgen_usd,
            comision_recepcion_paypal_usd,
            steamAppId,
            steamGameName,
            steamGameImage,
            steamGamePrice,
            neto_usd,
            final_clp,
            estado_retiro
        ]);

        const idVenta = resVenta.rows[0].id_venta;

        const queryDetalle = `
            INSERT INTO DETALLE_VENTA (id_venta, id_tipo_comision, precio_acordado)
            VALUES ($1, $2, $3)
            RETURNING id_detalle;
        `;

        const resDetalle = await client.query(queryDetalle, [idVenta, id_estilo, esPagoSteam ? 0 : bruto]);
        const idDetalle = resDetalle.rows[0].id_detalle;

        if (modificadores && modificadores.length > 0) {
            const queryModificador = `
                INSERT INTO DETALLE_MODIFICADOR (id_detalle, id_modificador, precio_acordado)
                VALUES ($1, $2, $3);
            `;
            for (const mod of modificadores) {
                const precioMod = esPagoSteam ? 0 : (parseFloat(mod.precio) || 0);
                await client.query(queryModificador, [idDetalle, mod.id, precioMod]);
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            exito: true,
            mensaje: esPagoSteam
                ? `¡Comisión registrada! Se guardó ${steamGameName} como juego recibido.`
                : estado_retiro === 'retirado'
                    ? '¡Comisión registrada! Al ser transferencia, se guardó directamente en CLP y está marcada como retirada.'
                    : '¡Comisión registrada con éxito! Recuerda marcarla como "retirada" cuando muevas el dinero a tu banco.',
            id_venta: idVenta,
            resumen: {
                total_bruto_usd: bruto_usd,
                comision_plataforma_usd,
                comision_vgen_usd,
                comision_recepcion_paypal_usd,
                total_neto_usd: neto_usd,
                total_final_clp: final_clp,
                estado_retiro,
                steam_app_id: steamAppId,
                steam_game_name: steamGameName,
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar venta:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno al guardar la comisión en la base de datos'
        });
    } finally {
        client.release();
    }
};

export const marcarComoRetirada = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        const ventaActual = await client.query(
            'SELECT total_bruto_usd, metodo_pago, estado_retiro FROM VENTA WHERE id_venta = $1',
            [id]
        );

        if (ventaActual.rows.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Venta no encontrada' });
        }

        const venta = ventaActual.rows[0];

        if (venta.metodo_pago === 'Juego de Steam') {
            return res.status(400).json({ exito: false, mensaje: 'Los juegos de Steam no requieren retiro' });
        }

        if (venta.estado_retiro === 'retirado') {
            return res.status(400).json({ exito: false, mensaje: 'Esta venta ya fue marcada como retirada' });
        }

        const bruto = parseFloat(venta.total_bruto_usd);
        const ventaCompleta = await client.query(
            'SELECT comision_plataforma_usd FROM VENTA WHERE id_venta = $1',
            [id]
        );
        const comisionPlataforma = parseFloat(ventaCompleta.rows[0].comision_plataforma_usd);
        const comision_retiro_usd = 0;
        const total_neto_usd = parseFloat((bruto - comisionPlataforma).toFixed(2));

        await client.query(
            `UPDATE VENTA 
             SET comision_retiro_usd = $1, 
                 total_neto_usd = $2, 
                 estado_retiro = 'retirado', 
                 fecha_retiro = CURRENT_DATE
             WHERE id_venta = $3`,
            [comision_retiro_usd, total_neto_usd, id]
        );

        res.status(200).json({
            exito: true,
            mensaje: 'Venta marcada como retirada exitosamente',
            resumen: {
                comision_retiro_usd,
                total_neto_usd,
            }
        });

    } catch (error) {
        console.error('Error al marcar venta como retirada:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al actualizar la venta' });
    } finally {
        client.release();
    }
};

export const obtenerVentas = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT 
                v.id_venta,
                v.nombre_cliente,
                v.plataforma_origen,
                v.metodo_pago,
                v.fecha_venta,
                v.total_bruto_usd,
                v.comision_plataforma_usd,
                v.comision_vgen_usd,
                v.comision_recepcion_paypal_usd,
                v.steam_app_id,
                v.steam_game_name,
                v.steam_game_image,
                v.steam_game_price_clp,
                v.comision_retiro_usd,
                v.total_neto_usd,
                v.total_final_clp,
                v.estado_retiro,
                v.fecha_retiro,
                tc.nombre_estilo
            FROM VENTA v
            LEFT JOIN DETALLE_VENTA dv ON v.id_venta = dv.id_venta
            LEFT JOIN TIPO_COMISION tc ON dv.id_tipo_comision = tc.id_tipo_comision
            ORDER BY v.fecha_venta DESC, v.id_venta DESC
        `);

        res.status(200).json({
            exito: true,
            ventas: result.rows
        });
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener el historial de ventas'
        });
    }
};

export const obtenerVentaPorId = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const result = await pool.query(`
            SELECT 
                v.*,
                tc.nombre_estilo,
                dv.precio_acordado AS precio_estilo,
                COALESCE(
                    json_agg(
                        json_build_object(
                            'nombre', m.nombre_modificador,
                            'precio', dm.precio_acordado
                        )
                    ) FILTER (WHERE m.nombre_modificador IS NOT NULL),
                    '[]'
                ) AS modificadores
            FROM VENTA v
            LEFT JOIN DETALLE_VENTA dv ON v.id_venta = dv.id_venta
            LEFT JOIN TIPO_COMISION tc ON dv.id_tipo_comision = tc.id_tipo_comision
            LEFT JOIN DETALLE_MODIFICADOR dm ON dv.id_detalle = dm.id_detalle
            LEFT JOIN MODIFICADOR m ON dm.id_modificador = m.id_modificador
            WHERE v.id_venta = $1
            GROUP BY v.id_venta, tc.nombre_estilo, dv.precio_acordado
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ exito: false, mensaje: 'Venta no encontrada' });
        }

        res.status(200).json({ exito: true, venta: result.rows[0] });
    } catch (error) {
        console.error('Error al obtener venta:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al obtener la venta' });
    }
};

// Estadística: modificadores más solicitados en todas las comisiones
export const obtenerModificadoresMasSolicitados = async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT m.nombre_modificador AS nombre, COUNT(*)::int AS cantidad
            FROM DETALLE_MODIFICADOR dm
            JOIN MODIFICADOR m ON dm.id_modificador = m.id_modificador
            GROUP BY m.nombre_modificador
            ORDER BY cantidad DESC
        `);

        res.status(200).json({ exito: true, modificadores: result.rows });
    } catch (error) {
        console.error('Error al obtener modificadores más solicitados:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error al obtener estadísticas de modificadores'
        });
    }
};

// Retiro Masivo
export const retirarMasivo = async (req: Request, res: Response) => {
    const client = await pool.connect();

    try {
        const { ids, valor_dolar } = req.body;

        if (!Array.isArray(ids) || ids.length === 0 || !valor_dolar) {
            return res.status(400).json({ exito: false, mensaje: 'Faltan datos para el retiro masivo' });
        }

        const valorDolar = Number(valor_dolar);
        if (!Number.isFinite(valorDolar) || valorDolar <= 0) {
            return res.status(400).json({ exito: false, mensaje: 'El valor del dólar debe ser mayor a 0' });
        }

        await client.query('BEGIN');

        // Busca todas las ventas seleccionadas que estén pendientes
        const queryVentas = `
            SELECT id_venta, total_bruto_usd, comision_plataforma_usd
            FROM VENTA
            WHERE id_venta = ANY($1)
              AND estado_retiro = 'pendiente'
              AND metodo_pago <> 'Juego de Steam'
        `;
        const resultVentas = await client.query(queryVentas, [ids]);
        const ventas = resultVentas.rows;

        if (ventas.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ exito: false, mensaje: 'No hay ventas válidas para retirar' });
        }

        const TARIFA_FIJA_CLP = 800;     // $800 pesos por TODO el bloque

        const saldosDisponibles = ventas.map((venta) => (
            parseFloat(venta.total_bruto_usd) - parseFloat(venta.comision_plataforma_usd)
        ));
        const totalDisponible = saldosDisponibles.reduce((total, saldo) => total + saldo, 0);

        if (!Number.isFinite(totalDisponible) || totalDisponible <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ exito: false, mensaje: 'Las ventas seleccionadas no tienen saldo disponible' });
        }

        // Divide los $800 equitativamente entre las comisiones que estamos retirando
        const tarifaFijaPorVentaCLP = TARIFA_FIJA_CLP / ventas.length;

        for (let index = 0; index < ventas.length; index++) {
            const venta = ventas[index];
            const saldoDisponible = saldosDisponibles[index];
            const netoUSDFinal = parseFloat(saldoDisponible.toFixed(2));
            
            // Convierte a CLP y le restamos su "cuota" de los $800 pesos
            const clpConvertido = netoUSDFinal * valorDolar;
            const totalFinalCLP = Math.max(0, Math.round(clpConvertido - tarifaFijaPorVentaCLP));

            // Actualiza la base de datos
            await client.query(`
                UPDATE VENTA 
                SET comision_retiro_usd = $1,
                    total_neto_usd = $2,
                    total_final_clp = $3,
                    estado_retiro = 'retirado',
                    fecha_retiro = CURRENT_DATE
                WHERE id_venta = $4
            `, [0, netoUSDFinal, totalFinalCLP, venta.id_venta]);
        }

        await client.query('COMMIT');
        res.status(200).json({
            exito: true,
            mensaje: `¡Se retiraron ${ventas.length} ventas usando el valor del dólar y descontando $800 CLP por el bloque!`
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error en retiro masivo:', error);
        res.status(500).json({ exito: false, mensaje: 'Error al procesar el retiro masivo' });
    } finally {
        client.release();
    }
};
