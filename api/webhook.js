import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc } from "firebase/firestore";

// Re-initialize Firebase for the serverless context
// Using the same config as the frontend
const firebaseConfig = {
  apiKey: "AIzaSyBkL7U7ZabhGQrNz36MMviVH4syM_GOOPY",
  authDomain: "prodcontrol-ed074.firebaseapp.com",
  projectId: "prodcontrol-ed074",
  storageBucket: "prodcontrol-ed074.firebasestorage.app",
  messagingSenderId: "251913732698",
  appId: "1:251913732698:web:eea529d2ef531ced2fce63"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default async function handler(req, res) {
    // 1. Handle CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // 2. Validate Credentials
    // Checks header 'x-api-key' or 'Authorization' (Bearer ...)
    const apiKey = req.headers['x-api-key'];
    const authHeader = req.headers['authorization'];
    
    // In Vercel environment, set API_SECRET_KEY, but we fallback to provided password for immediate use
    const VALID_SECRET = process.env.API_SECRET_KEY || 'Arriba_los_qlos_cloi_123';

    let providedKey = apiKey;
    
    // Support Bearer token if x-api-key is missing
    if (!providedKey && authHeader && authHeader.startsWith('Bearer ')) {
        providedKey = authHeader.split(' ')[1];
    }

    if (providedKey !== VALID_SECRET) {
        return res.status(401).json({ error: 'Unauthorized: Invalid Credentials' });
    }

    // 3. Process Data
    try {
        const orderData = req.body;

        if (!orderData) {
            return res.status(400).json({ error: 'No data provided' });
        }

        // 4. Save to Firestore "pending_orders" collection
        // The frontend will pull from here
        const docRef = await addDoc(collection(db, "pending_orders"), {
            ...orderData,
            receivedAt: new Date().toISOString(),
            status: 'PENDING_SYNC'
        });

        return res.status(200).json({ 
            success: true, 
            message: 'Order received and queued for synchronization',
            id: docRef.id 
        });

    } catch (error) {
        console.error("API Error:", error);
        return res.status(500).json({ error: 'Internal Server Error', details: error.message });
    }
}