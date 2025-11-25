export default function handler(req, res) {
    // CRÍTICO: Configuración CORS para Fabrimueble
    // Esto permite que el navegador acepte la respuesta cuando la petición viene de tu otra app
    res.setHeader('Access-Control-Allow-Origin', 'https://fabrimueble.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejo de la solicitud "Preflight" (OPTIONS)
    // Los navegadores envían esto primero para verificar si el servidor permite la conexión
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Procesamiento de la petición POST con los datos
    if (req.method === 'POST') {
        try {
            const data = req.body;

            // Log solicitado para verificar la llegada de datos
            console.log("--- NUEVA ORDEN RECIBIDA DE FABRIMUEBLE ---");
            console.log(JSON.stringify(data, null, 2));
            console.log("-------------------------------------------");

            // Respuesta de éxito
            return res.status(200).json({ 
                status: 'ok', 
                message: 'Orden recibida correctamente en ProControl' 
            });
        } catch (error) {
            console.error("Error al procesar la orden:", error);
            return res.status(500).json({ status: 'error', message: 'Error interno al procesar datos' });
        }
    }

    // Si intentan acceder con otro método (GET, PUT, etc.)
    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
}