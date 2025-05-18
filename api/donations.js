import { initializeApp } from 'firebase/app';
import { getDatabase, ref, push, get, child, set } from 'firebase/database';

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
  // 👉 Encabezados CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  const donationsRef = ref(db, 'donations');

  if (req.method === 'POST') {
    const { nombre, email, monto, fecha, pais, origen } = req.body;

    if (!nombre || !email || !monto || !fecha || !pais || !origen) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    try {
      // Obtener el número de donaciones actuales para generar un ID secuencial
      const snapshot = await get(donationsRef);
      const count = snapshot.exists() ? Object.keys(snapshot.val()).length : 0;
      const newId = (count + 1).toString().padStart(4, '0'); // ej: '0001', '0002'

      await set(ref(db, `donations/${newId}`), {
        id: newId,
        nombre,
        email,
        monto,
        fecha,
        pais,
        origen
      });

      return res.status(201).json({ message: 'Donación registrada exitosamente', id: newId });
    } catch (error) {
      console.error('Error insertando donación:', error);
      return res.status(500).json({ error: 'No se pudo guardar la donación' });
    }
  }

  if (req.method === 'GET') {
    const { id } = req.query;

    try {
      if (id) {
        const snapshot = await get(child(ref(db), `donations/${id}`));
        if (!snapshot.exists()) {
          return res.status(404).json({ error: 'Donación no encontrada' });
        }
        return res.status(200).json(snapshot.val());
      } else {
        const snapshot = await get(child(ref(db), 'donations'));
        if (!snapshot.exists()) {
          return res.status(200).json([]);
        }
        return res.status(200).json(snapshot.val());
      }
    } catch (error) {
      console.error('Error obteniendo donaciones:', error);
      return res.status(500).json({ error: 'No se pudo obtener la lista de donaciones' });
    }
  }

  return res.status(405).json({ error: 'Método no permitido' });
}