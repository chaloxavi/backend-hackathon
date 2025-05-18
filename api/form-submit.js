import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set, get } from 'firebase/database';

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

  let formData;
  try {
    formData = req.body;
  } catch (err) {
    return res.status(400).json({ error: 'JSON inválido en el cuerpo de la solicitud' });
  }

  const email = formData?.datosPersonales?.email;
  const cleanEmail = email?.replace(/[.#$\[\]]/g, '_');

  if (!cleanEmail) {
    return res.status(400).json({ error: 'El campo email es obligatorio' });
  }

  try {
    const otpSnapshot = await get(ref(db, `otp/${cleanEmail}`));
    if (!otpSnapshot.exists()) {
      return res.status(403).json({ error: 'No se encontró OTP para este correo' });
    }

    const otpData = otpSnapshot.val();
    if (!otpData.verified) {
      return res.status(403).json({ error: 'Debes verificar tu OTP antes de enviar el formulario' });
    }

    await set(ref(db, `solicitudes/${cleanEmail}`), formData);
    res.status(200).json({ message: 'Formulario guardado correctamente' });
  } catch (error) {
    console.error('Error guardando el formulario:', error);
    res.status(500).json({ error: 'No se pudo guardar el formulario' });
  }
}
