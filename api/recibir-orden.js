import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Configuración de Firebase (Mismas credenciales que en frontend)
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
    // Configuración CORS para permitir peticiones desde Fabrimueble
    res.setHeader('Access-Control-Allow-Origin', 'https://fabrimueble.vercel.app');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Manejo de Preflight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method === 'POST') {
        try {
            const data = req.body;
            console.log("--- PROCESANDO ORDEN DE FABRIMUEBLE ---");
            
            if (!data) {
                return res.status(400).json({ status: 'error', message: 'Payload vacío' });
            }

            // Guardar en Firestore para que el frontend pueda leerlo
            // Usamos la misma colección 'pending_orders' que lee storageService.ts
            const docRef = await addDoc(collection(db, "pending_orders"), {
                ...data,
                receivedAt: new Date().toISOString(),
                source: 'fabrimueble'
            });

            console.log(`Orden guardada en Firestore con ID: ${docRef.id}`);

            return res.status(200).json({ 
                status: 'ok', 
                message: 'Orden recibida y almacenada en la nube correctamente',
                id: docRef.id
            });
        } catch (error) {
            console.error("Error al guardar en Firestore:", error);
            return res.status(500).json({ status: 'error', message: error.message });
        }
    }

    return res.status(405).json({ status: 'error', message: 'Method Not Allowed' });
}