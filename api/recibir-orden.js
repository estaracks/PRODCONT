import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Configuración de Firebase (debe coincidir con la del frontend)
const firebaseConfig = {
  apiKey: "AIzaSyBkL7U7ZabhGQrNz36MMviVH4syM_GOOPY",
  authDomain: "prodcontrol-ed074.firebaseapp.com",
  projectId: "prodcontrol-ed074",
  storageBucket: "prodcontrol-ed074.firebasestorage.app",
  messagingSenderId: "251913732698",
  appId: "1:251913732698:web:eea529d2ef531ced2fce63"
};

// Inicializar Firebase (Singleton para evitar errores en serverless)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // ------------------------------------------------------------------
  // 1. CONFIGURACIÓN DE SEGURIDAD (CORS)
  // Permitir el acceso exclusivamente a la App de Diseño
  // ------------------------------------------------------------------
  const origenesPermitidos = [
    'https://fabrimueble.vercel.app', // Tu app en producción
    'http://localhost:5173'           // Tu app en modo pruebas
  ];

  const origenSolicitante = req.headers.origin;

  if (origenesPermitidos.includes(origenSolicitante)) {
    res.setHeader('Access-Control-Allow-Origin', origenSolicitante);
  } else {
    // Fallback seguro por si el navegador no envía origen o es una herramienta server-side
    res.setHeader('Access-Control-Allow-Origin', 'https://fabrimueble.vercel.app');
  }

  // Permitir tipos de peticiones y cabeceras estándar
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Si el navegador pregunta "¿Puedo pasar?", decimos "Sí" (Preflight request)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ------------------------------------------------------------------
  // 2. VALIDACIÓN DEL MÉTODO
  // Solo aceptamos recibir datos (POST), no lecturas (GET)
  // ------------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido. Use POST.' });
  }

  try {
    const orden = req.body;

    // ------------------------------------------------------------------
    // 3. VALIDACIÓN DE DATOS CRÍTICOS
    // Si falta el folio o los muebles, rechazamos la orden
    // ------------------------------------------------------------------
    if (!orden || !orden.external_id || !orden.items || !Array.isArray(orden.items)) {
      console.error("Orden rechazada por datos incompletos o mal formados");
      return res.status(400).json({ 
        error: 'Estructura inválida. Se requiere external_id y un array de items.' 
      });
    }

    // ------------------------------------------------------------------
    // 4. LÓGICA DE FÁBRICA (Guardar en Firebase)
    // ------------------------------------------------------------------
    console.log(`✅ Orden Recibida: ${orden.external_id} | Cliente: ${orden.client}`);
    
    // Guardamos en la colección 'pending_orders' para que el frontend la descargue
    const docRef = await addDoc(collection(db, "pending_orders"), {
        ...orden,
        receivedAt: new Date().toISOString(),
        source: 'fabrimueble_api',
        syncStatus: 'PENDING'
    });
    
    console.log(`Persistido en Firestore ID: ${docRef.id}`);

    // ------------------------------------------------------------------
    // 5. RESPUESTA DE ÉXITO
    // ------------------------------------------------------------------
    return res.status(200).json({
      success: true,
      message: 'Orden recibida y encolada para producción.',
      received_id: orden.external_id,
      internal_trace: docRef.id
    });

  } catch (error) {
    console.error("Error interno:", error);
    return res.status(500).json({ error: 'Error interno del servidor de fábrica.', details: error.message });
  }
}