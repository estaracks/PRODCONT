import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Configuración de Vercel para permitir payloads grandes (50MB)
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};

// Configuración de Firebase (Sistema Estaracks)
const firebaseConfig = {
  apiKey: "AIzaSyALVFWSOuFyr_8ZfL0guyCL-qAdMsf1JrM",
  authDomain: "sistemaestaracks.firebaseapp.com",
  projectId: "sistemaestaracks",
  storageBucket: "sistemaestaracks.firebasestorage.app",
  messagingSenderId: "449707813338",
  appId: "1:449707813338:web:5458cdb0abdbc23f7e78e3",
  measurementId: "G-MRGVQDR3QM"
};

// Inicializar Firebase (Singleton para evitar reinicializaciones en Vercel)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // 1. Configuración de Seguridad (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Responder inmediatamente a la petición "preflight"
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. MODO DE PRUEBA (GET) - Para verificar estado online
  if (req.method === 'GET') {
    return res.status(200).json({ 
        status: 'online', 
        message: 'Servidor Estaracks listo (Límite 50MB configurado).',
        timestamp: new Date().toISOString()
    });
  }

  // 3. VALIDACIÓN (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo se permite POST' });
  }

  try {
    const orden = req.body;
    
    // Log básico sin imprimir todo el base64 para no saturar la consola
    const logOrden = { ...orden };
    if (logOrden.items) {
        logOrden.items = logOrden.items.map(item => ({
            ...item,
            attachment: item.attachment ? '[BASE64_DATA_PRESENT]' : undefined
        }));
    }
    console.log("📥 Recibiendo orden:", JSON.stringify(logOrden));

    if (!orden || !orden.external_id || !orden.items) {
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requiere external_id y items.',
        received: logOrden 
      });
    }

    // 4. GUARDADO EN FIREBASE
    // Nota: Firebase tiene un límite de 1MB por documento.
    // Si el base64 excede esto, Firestore fallará.
    // Idealmente se debería subir a Storage, pero para MVP intentamos guardar directo.
    
    const docRef = await addDoc(collection(db, "pending_orders"), {
        ...orden,
        receivedAt: new Date().toISOString(),
        source: 'api_externa',
        syncStatus: 'PENDING'
    });
    
    return res.status(200).json({
      success: true,
      message: 'Orden guardada correctamente.',
      internal_id: docRef.id
    });

  } catch (error) {
    console.error("🔥 Error en servidor:", error);
    
    // Manejo específico de error de tamaño de Firestore
    if (error.code === 'invalid-argument' && error.message.includes('maximum size')) {
        return res.status(413).json({
            error: 'El archivo adjunto es demasiado grande para la base de datos (Límite Firestore 1MB).',
            details: error.message
        });
    }

    return res.status(500).json({ 
        error: 'Error interno al procesar la orden.', 
        details: error.message 
    });
  }
}