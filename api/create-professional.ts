import admin from 'firebase-admin';

// Initialize Firebase Admin
let credential;
if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
  try {
    const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
    credential = admin.credential.cert(serviceAccount);
  } catch (e) {
    console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64', e);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: credential || admin.credential.applicationDefault(),
    projectId: "irisagenda-b6e66",
    storageBucket: "irisagenda-b6e66.appspot.com"
  });
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, password, name, empresaId, profissionalId } = req.body;

  if (!email || !password || !name || !empresaId || !profissionalId) {
    return res.status(400).json({ error: 'Dados incompletos' });
  }

  try {
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: name,
    });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      role: 'profissional',
      empresaId: empresaId
    });

    const db = admin.firestore();
    await db.collection('users').doc(userRecord.uid).set({
      id: userRecord.uid,
      name,
      email,
      role: 'profissional',
      empresaId,
      createdAt: Date.now(),
      isActive: true
    });

    await db.collection('profissionais').doc(profissionalId).update({
      userId: userRecord.uid,
      email: email
    });

    return res.status(200).json({ success: true, userId: userRecord.uid });
  } catch (error: any) {
    console.error('Vercel Create Professional Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno no servidor' });
  }
}
