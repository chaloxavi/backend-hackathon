export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  res.status(200).send('🚀 Ready! Available at http://localhost:3000');
}
