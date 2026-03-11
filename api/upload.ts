import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import formidable from 'formidable';
import fs from 'fs';

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

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const form = formidable({
    maxFileSize: 10 * 1024 * 1024, // 10MB
  });

  try {
    const { fields, files } = await new Promise<{fields: any, files: any}>((resolve, reject) => {
      form.parse(req, (err, fields, files) => {
        if (err) {
          console.error('Formidable Parse Error:', err);
          reject(err);
        } else {
          resolve({ fields, files });
        }
      });
    });

    const storagePath = Array.isArray(fields.path) ? fields.path[0] : fields.path;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!storagePath) {
      return res.status(400).json({ error: 'Caminho de destino não fornecido' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Nenhum arquivo enviado' });
    }

    const fileBuffer = fs.readFileSync(file.filepath);
    const storageRef = ref(storage, storagePath);
    const metadata = {
      contentType: file.mimetype || 'image/png',
    };

    const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
    const downloadURL = await getDownloadURL(snapshot.ref);

    return res.status(200).json({ url: downloadURL });
  } catch (error: any) {
    console.error('Vercel Upload Error:', error);
    // Ensure we always return JSON
    return res.status(500).json({ 
      error: error.message || 'Erro interno no servidor de upload',
      details: error.toString()
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
