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

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    const VALID_SECRET = process.env.API_SECRET_KEY || 'Arriba_los_qlos_cloi_123';

    let providedKey = apiKey;
    if (!providedKey && authHeader && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.split(' ')[1];
    }

    if (providedKey !== VALID_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const orderData = req.body;
        if (!orderData || typeof orderData !== 'object') {
            return res.status(400).json({ error: 'Invalid JSON data' });
        }

        const docRef = await addDoc(collection(db, "pending_orders"), {
            ...orderData,
            receivedAt: new Date().toISOString(),
            syncStatus: 'PENDING'
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Order queued',
            firestoreId: docRef.id 
        });

    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}