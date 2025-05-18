import { initializeApp } from 'firebase/app';
import { getDatabase, ref, set } from 'firebase/database';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

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

const otps = new Map();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000;

  otps.set(email, { code, expiresAt, verified: false });

  try {
    await transporter.sendMail({
      from: `OTP <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Tu código de verificación',
      text: `Tu código es: ${code}. Expira en 5 minutos.`,
    });

    await set(ref(db, `otp/${email.replace(/[.#$\[\]]/g, '_')}`), {
      code,
      verified: false,
      expiresAt,
      createdAt: Date.now(),
    });

    res.status(200).json({ message: 'OTP enviado' });
  } catch (error) {
    console.error('Error al enviar OTP:', error);
    res.status(500).json({ error: 'No se pudo enviar el OTP' });
  }
}
