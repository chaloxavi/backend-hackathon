import { initializeApp } from 'firebase/app';
import { getDatabase, ref, update, get } from 'firebase/database';

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email, code } = req.body;
  const cleanEmail = email.replace(/[.#$[\]]/g, '_');

  try {
    const otpRef = ref(db, `otp/${cleanEmail}`);
    const snapshot = await get(otpRef);

    if (!snapshot.exists()) {
      return res.status(400).json({ error: 'No se encontró un código para este email' });
    }

    const data = snapshot.val();

    if (Date.now() > data.expiresAt) {
      return res.status(400).json({ error: 'El código ha expirado' });
    }

    if (data.code !== code) {
      return res.status(400).json({ error: 'Código incorrecto' });
    }

    await update(otpRef, { verified: true });

    res.status(200).json({ message: 'OTP verificado correctamente' });
  } catch (error) {
    console.error('Error verificando OTP:', error);
    res.status(500).json({ error: 'Error interno al verificar OTP' });
  }
}
