import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder inmediatamente a la petición "preflight"
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. MODO DE PRUEBA (GET) - Para verificar estado online
  if (req.method === 'GET') {
    return res.status(200).json({ 
        status: 'online', 
        message: 'Servidor Estaracks listo.',
        timestamp: new Date().toISOString()
    });
  }

  // 3. VALIDACIÓN (POST)
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo se permite POST' });
  }

  try {
    const orden = req.body;
    console.log("📥 Recibiendo orden:", JSON.stringify(orden));

    if (!orden || !orden.external_id || !orden.items) {
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requiere external_id y items.',
        received: orden 
      });
    }

    // 4. GUARDADO EN FIREBASE
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
    return res.status(500).json({ 
        error: 'Error interno al procesar la orden.', 
        details: error.message 
    });
  }
}