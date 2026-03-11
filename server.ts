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
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: "irisagenda-b6e66",
    storageBucket: "irisagenda-b6e66.firebasestorage.app"
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

      const blob = bucket.file(storagePath);
      const blobStream = blob.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
        resumable: false
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', reject);
        blobStream.on('finish', resolve);
        blobStream.end(req.file?.buffer);
      });

      await blob.makePublic();
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${storagePath}`;

      res.status(200).json({ url: publicUrl });
    } catch (error: any) {
      console.error('Server Upload Error:', error);
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
