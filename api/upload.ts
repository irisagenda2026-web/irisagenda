import admin from 'firebase-admin';
import formidable from 'formidable';
import fs from 'fs';

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
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const storagePath = Array.isArray(fields.path) ? fields.path[0] : fields.path;
    const file = Array.isArray(files.file) ? files.file[0] : files.file;

    if (!storagePath || !file) {
      return res.status(400).json({ error: 'Dados incompletos' });
    }

    // List of possible bucket names to try
    const bucketNames = [
      "irisagenda-b6e66.firebasestorage.app",
      "irisagenda-b6e66.appspot.com",
      "irisagenda-b6e66"
    ];

    let lastError = null;
    
    for (const bucketName of bucketNames) {
      try {
        console.log(`Attempting upload to bucket: ${bucketName}`);
        const currentBucket = admin.storage().bucket(bucketName);
        const blob = currentBucket.file(storagePath);
        
        const blobStream = blob.createWriteStream({
          metadata: {
            contentType: file.mimetype || 'image/png',
          },
          resumable: false
        });

        await new Promise((resolve, reject) => {
          fs.createReadStream(file.filepath)
            .pipe(blobStream)
            .on('error', reject)
            .on('finish', resolve);
        });

        // Try to make public, but don't block if it fails (Uniform access might be on)
        try {
          await blob.makePublic();
        } catch (e) {
          console.warn(`Could not make public on ${bucketName}, proceeding anyway...`);
        }

        const publicUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;
        return res.status(200).json({ url: publicUrl });
        
      } catch (err: any) {
        console.error(`Failed upload to ${bucketName}:`, err.message);
        lastError = err;
        continue; // Try next bucket
      }
    }

    // If we reach here, all buckets failed
    return res.status(500).json({ 
      error: "Não foi possível encontrar um bucket válido no seu Firebase.",
      details: lastError?.message || "Erro desconhecido",
      tried: bucketNames
    });

  } catch (error: any) {
    console.error('Vercel Upload Error:', error);
    return res.status(500).json({ 
      error: error.message || 'Erro no upload',
      details: error.toString()
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
