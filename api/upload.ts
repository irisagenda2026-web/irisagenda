import admin from 'firebase-admin';
import formidable from 'formidable';
import fs from 'fs';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
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

    // Try to get the file reference. The error usually happens during the actual operation.
    const blob = bucket.file(storagePath);
    
    const uploadToBucket = async (targetBlob: any) => {
      const blobStream = targetBlob.createWriteStream({
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
    };

    let finalBlob = blob;
    try {
      await uploadToBucket(blob);
    } catch (uploadError: any) {
      // If it fails with bucket not found, try the alternative
      if (uploadError.message?.includes('bucket') || uploadError.code === 404) {
        const altBucketName = "irisagenda-b6e66.firebasestorage.app";
        const altBucket = admin.storage().bucket(altBucketName);
        finalBlob = altBucket.file(storagePath);
        await uploadToBucket(finalBlob);
      } else {
        throw uploadError;
      }
    }

    // Make the file public
    await finalBlob.makePublic();
    const publicUrl = `https://storage.googleapis.com/${finalBlob.bucket.name}/${storagePath}`;

    return res.status(200).json({ url: publicUrl });
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
