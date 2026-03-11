import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded config to match src/services/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBpnKkcq_g2CYBaCEq2cFujKcElHtdkxXc",
  authDomain: "irisagenda-b6e66.firebaseapp.com",
  projectId: "irisagenda-b6e66",
  storageBucket: "irisagenda-b6e66.firebasestorage.app",
  messagingSenderId: "93194618911",
  appId: "1:93194618911:web:47980aa43241bfa00b6d2a",
  measurementId: "G-RZJYD594L9"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Route for Upload (Bypasses CORS)
  app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
      const { path: storagePath } = req.body;
      
      if (!storagePath) {
        return res.status(400).json({ error: 'Caminho de destino não fornecido' });
      }

      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const storageRef = ref(storage, storagePath);
      const metadata = {
        contentType: req.file.mimetype,
      };

      // Upload the buffer
      const snapshot = await uploadBytes(storageRef, req.file.buffer, metadata);
      const downloadURL = await getDownloadURL(snapshot.ref);

      res.status(200).json({ url: downloadURL });
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
