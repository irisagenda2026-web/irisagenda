import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const bucket = admin.storage().bucket();

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for Upload (Bypasses CORS and Security Rules)
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      const { path: storagePath } = req.body;
      
      if (!storagePath || !req.file) {
        return res.status(400).json({ error: 'Dados incompletos' });
      }

      const uploadToBucket = async (targetBlob: any) => {
        const blobStream = targetBlob.createWriteStream({
          metadata: {
            contentType: req.file?.mimetype,
          },
          resumable: false
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', reject);
          blobStream.on('finish', resolve);
          blobStream.end(req.file?.buffer);
        });
      };

      let finalBlob = bucket.file(storagePath);
      try {
        await uploadToBucket(finalBlob);
      } catch (uploadError: any) {
        if (uploadError.message?.includes('bucket') || uploadError.code === 404) {
          const altBucket = admin.storage().bucket("irisagenda-b6e66.firebasestorage.app");
          finalBlob = altBucket.file(storagePath);
          await uploadToBucket(finalBlob);
        } else {
          throw uploadError;
        }
      }

      await finalBlob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${finalBlob.bucket.name}/${storagePath}`;

      res.status(200).json({ url: publicUrl });
    } catch (error: any) {
      console.error('Server Upload Error:', error);
      res.status(500).json({ error: error.message || 'Erro interno no servidor' });
    }
  });

  // API Route for creating professional accounts
  app.post('/api/create-professional', async (req, res) => {
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

      res.status(200).json({ success: true, userId: userRecord.uid });
    } catch (error: any) {
      console.error('Server Create Professional Error:', error);
      res.status(500).json({ error: error.message || 'Erro interno no servidor' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
