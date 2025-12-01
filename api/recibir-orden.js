import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBkL7U7ZabhGQrNz36MMviVH4syM_GOOPY",
  authDomain: "prodcontrol-ed074.firebaseapp.com",
  projectId: "prodcontrol-ed074",
  storageBucket: "prodcontrol-ed074.firebasestorage.app",
  messagingSenderId: "251913732698",
  appId: "1:251913732698:web:eea529d2ef531ced2fce63"
};

// Inicializar Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
  // ------------------------------------------------------------------
  // 1. CONFIGURACIÓN DE SEGURIDAD (CORS SIMPLIFICADO)
  // Para arreglar el error de conexión, permitimos acceso universal temporalmente.
  // Esto elimina el problema de "Bloqueo por CORS" entre dominios.
  // ------------------------------------------------------------------
  res.setHeader('Access-Control-Allow-Origin', '*'); 
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responder inmediatamente a la petición "preflight" del navegador
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ------------------------------------------------------------------
  // 2. VALIDACIÓN
  // ------------------------------------------------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Solo se permite POST' });
  }

  try {
    const orden = req.body;
    console.log("📥 Intentando recibir orden:", JSON.stringify(orden));

    // Validación básica
    if (!orden || !orden.external_id || !orden.items) {
      console.error("❌ Orden rechazada: Faltan datos obligatorios (external_id o items)");
      return res.status(400).json({ 
        error: 'Datos incompletos. Se requiere external_id y items.',
        received: orden 
      });
    }

    // ------------------------------------------------------------------
    // 3. GUARDADO EN FIREBASE
    // ------------------------------------------------------------------
    const docRef = await addDoc(collection(db, "pending_orders"), {
        ...orden,
        receivedAt: new Date().toISOString(),
        source: 'fabrimueble_api',
        syncStatus: 'PENDING'
    });
    
    console.log(`✅ ÉXITO: Orden guardada en Firestore con ID: ${docRef.id}`);

    return res.status(200).json({
      success: true,
      message: 'Orden recibida correctamente en Fábrica.',
      internal_id: docRef.id
    });

  } catch (error) {
    console.error("🔥 ERROR CRÍTICO EN SERVIDOR:", error);
    return res.status(500).json({ 
        error: 'Error interno al procesar la orden.', 
        details: error.message 
    });
  }
}