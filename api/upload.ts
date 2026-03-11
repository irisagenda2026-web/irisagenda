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

  return new Promise((resolve, reject) => {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error('Formidable Parse Error:', err);
        res.status(500).json({ error: 'Erro ao processar o arquivo' });
        return resolve(true);
      }

      const storagePath = Array.isArray(fields.path) ? fields.path[0] : fields.path;
      const file = Array.isArray(files.file) ? files.file[0] : files.file;

      if (!storagePath) {
        res.status(400).json({ error: 'Caminho de destino não fornecido' });
        return resolve(true);
      }

      if (!file) {
        res.status(400).json({ error: 'Nenhum arquivo enviado' });
        return resolve(true);
      }

      try {
        const fileBuffer = fs.readFileSync(file.filepath);
        const storageRef = ref(storage, storagePath);
        const metadata = {
          contentType: file.mimetype || 'image/png',
        };

        const snapshot = await uploadBytes(storageRef, fileBuffer, metadata);
        const downloadURL = await getDownloadURL(snapshot.ref);

        res.status(200).json({ url: downloadURL });
        resolve(true);
      } catch (error: any) {
        console.error('Firebase Upload Error:', error);
        res.status(500).json({ error: error.message || 'Erro ao enviar para o Firebase' });
        resolve(true);
      }
    });
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
