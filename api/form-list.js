import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, child } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_APP_ID,
  databaseURL: process.env.FIREBASE_DATABASE_URL,
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const snapshot = await get(child(ref(db), 'solicitudes'));
    if (!snapshot.exists()) {
      return res.status(200).json([]);
    }
    res.status(200).json(snapshot.val());
  } catch (error) {
    console.error('Error obteniendo formularios:', error);
    res.status(500).json({ error: 'No se pudo obtener la lista de formularios' });
  }
}
