import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { asaasService } from './api/asaas-service.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
try {
  let credential;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
    try {
      const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
      credential = admin.credential.cert(serviceAccount);
      console.log('Firebase Admin: Using service account from environment variable');
    } catch (e) {
      console.error('Firebase Admin: Failed to parse FIREBASE_SERVICE_ACCOUNT_BASE64', e);
    }
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: credential || admin.credential.applicationDefault(),
      projectId: "irisagenda-b6e66",
      storageBucket: "irisagenda-b6e66.appspot.com"
    });
    console.log('Firebase Admin: Initialized successfully');
  }
} catch (initError) {
  console.error('Firebase Admin: Initialization error', initError);
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

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      firebaseAdmin: admin.apps.length > 0 ? 'initialized' : 'not_initialized',
      asaas: {
        apiKey: !!process.env.ASAAS_API_KEY,
        environment: process.env.ASAAS_ENVIRONMENT || 'sandbox',
        webhookToken: !!process.env.ASAAS_WEBHOOK_TOKEN
      }
    });
  });

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

  // --- Asaas Payment Routes ---

  // Create Customer in Asaas
  app.post('/api/asaas/customer', async (req, res) => {
    try {
      const { name, email, cpfCnpj, phone } = req.body;
      const customer = await asaasService.createCustomer({ name, email, cpfCnpj, phone });
      res.status(200).json(customer);
    } catch (error: any) {
      console.error('Asaas Create Customer Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Sub-account in Asaas
  app.post('/api/asaas/account', async (req, res) => {
    try {
      const account = await asaasService.createAccount(req.body);
      res.status(200).json(account);
    } catch (error: any) {
      console.error('Asaas Create Account Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Sub-account in Asaas
  app.post('/api/asaas/account/:id', async (req, res) => {
    try {
      const account = await asaasService.updateAccount(req.params.id, req.body);
      res.status(200).json(account);
    } catch (error: any) {
      console.error('Asaas Update Account Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Sub-account Documents
  app.get('/api/asaas/account/:id/documents', async (req, res) => {
    try {
      const { id } = req.params;
      const data = await asaasService.getDocuments(id);
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Asaas Get Documents Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Upload Sub-account Document
  app.post('/api/asaas/account/:id/documents', upload.single('file'), async (req, res) => {
    try {
      const { id } = req.params;
      const { type } = req.body;
      
      if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado' });
      }

      const formData = new FormData();
      const blob = new Blob([req.file.buffer], { type: req.file.mimetype });
      formData.append('file', blob, req.file.originalname);
      formData.append('type', type);

      const data = await asaasService.uploadDocument(id, formData);
      res.status(200).json(data);
    } catch (error: any) {
      console.error('Asaas Upload Document Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Create Payment with Split
  app.post('/api/asaas/payment', async (req, res) => {
    try {
      const { 
        customer, 
        billingType, 
        value, 
        dueDate, 
        description, 
        externalReference, 
        split,
        creditCard,
        creditCardHolderInfo,
        remoteIp
      } = req.body;

      const paymentData: any = {
        customer,
        billingType,
        value,
        dueDate,
        description,
        externalReference,
        split
      };

      if (billingType === 'CREDIT_CARD') {
        paymentData.creditCard = creditCard;
        paymentData.creditCardHolderInfo = creditCardHolderInfo;
        paymentData.remoteIp = remoteIp || req.ip;
      }

      const payment = await asaasService.createPayment(paymentData);
      res.status(200).json(payment);
    } catch (error: any) {
      console.error('Asaas Create Payment Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get Payment Status
  app.get('/api/asaas/payment-status/:id', async (req, res) => {
    try {
      const status = await asaasService.getPaymentStatus(req.params.id);
      res.status(200).json(status);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get PIX QR Code
  app.get('/api/asaas/pix-qrcode/:id', async (req, res) => {
    try {
      const qrcode = await asaasService.getPixQrCode(req.params.id);
      res.status(200).json(qrcode);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get Balance
  app.get('/api/asaas/balance', async (req, res) => {
    try {
      const apiKey = req.query.apiKey as string;
      const balance = await asaasService.getBalance(apiKey);
      res.status(200).json(balance);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Request Transfer (Withdraw)
  app.post('/api/asaas/transfer', async (req, res) => {
    try {
      const { value, bankAccount, apiKey } = req.body;
      const transfer = await asaasService.transfer({ value, bankAccount }, apiKey);
      res.status(200).json(transfer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook for Asaas Notifications
  app.post(['/api/asaas/webhook', '/api/asaas/webhook/'], async (req, res) => {
    const { event, payment } = req.body;
    const webhookToken = req.headers['asaas-access-token'];

    // Verify webhook token if configured
    if (process.env.ASAAS_WEBHOOK_TOKEN && webhookToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
      return res.status(401).json({ error: 'Não autorizado' });
    }

    console.log(`Asaas Webhook Received: ${event}`, payment.id);

    try {
      const db = admin.firestore();

      if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
        const externalReference = payment.externalReference;
        
        if (externalReference) {
          // Handle Plan Subscriptions
          if (externalReference.startsWith('plan_')) {
            const [_, empresaId, planId] = externalReference.split('_');
            await db.collection('empresas').doc(empresaId).update({
              planId,
              'subscription.status': 'active',
              'subscription.currentPeriodEnd': Date.now() + (30 * 24 * 60 * 60 * 1000)
            });
          }
          
          // Handle Appointments
          if (externalReference.startsWith('appt_')) {
            const [_, apptId] = externalReference.split('_');
            await db.collection('agendamentos').doc(apptId).update({
              paymentStatus: 'paid',
              paidAt: Date.now()
            });
          }
        }
      }

      res.status(200).send('OK');
    } catch (error: any) {
      console.error('Asaas Webhook Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Catch-all for undefined API routes
  app.all('/api/*', (req, res) => {
    res.status(404).json({ error: `Rota API não encontrada: ${req.method} ${req.url}` });
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
