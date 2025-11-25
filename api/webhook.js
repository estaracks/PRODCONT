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

// PREVENCIÓN DE ERROR: Comprobar si la app ya está inicializada para evitar
// "Firebase App named '[DEFAULT]' already exists" en entornos serverless (Vercel)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
    // 1. Configuración CORS (Permitir peticiones externas)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');

    // Manejar pre-flight request de CORS
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Solo permitir método POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Validación de Credenciales
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    
    // Contraseña definida por el usuario
    const VALID_SECRET = process.env.API_SECRET_KEY || 'Arriba_los_qlos_cloi_123';

    let providedKey = apiKey;
    
    // Soporte para Bearer token si no se envía x-api-key
    if (!providedKey && authHeader && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.split(' ')[1];
    }

    // Verificar contraseña (comparación simple)
    if (providedKey !== VALID_SECRET) {
        console.warn('Intento de acceso no autorizado al Webhook');
        return res.status(401).json({ error: 'Unauthorized: Invalid Credentials' });
    }

    // 3. Procesamiento de Datos
    try {
        const orderData = req.body;

        if (!orderData || typeof orderData !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON data provided' });
        }

        console.log("Recibiendo orden externa:", orderData.external_id || 'Sin ID');

        // 4. Guardar en Firestore "pending_orders"
        // La app frontend leerá de esta colección cuando el usuario pulse "Sincronizar"
        const docRef = await addDoc(collection(db, "pending_orders"), {
            ...orderData,
            receivedAt: new Date().toISOString(),
            syncStatus: 'PENDING'
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Order received and queued for synchronization',
            firestoreId: docRef.id 
        });

    } catch (error) {
        console.error("API Webhook Error:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}