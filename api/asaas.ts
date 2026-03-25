import { asaasService } from './asaas-service.js';
import formidable from 'formidable';
import fs from 'fs';
import admin from 'firebase-admin';

// Initialize Firebase Admin lazily
let db: admin.firestore.Firestore | null = null;

const getDb = () => {
  if (db) return db;
  
  if (!admin.apps.length) {
    try {
      let credential;
      if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
        const serviceAccount = JSON.parse(Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf8'));
        credential = admin.credential.cert(serviceAccount);
      }
      
      admin.initializeApp({
        credential: credential || admin.credential.applicationDefault(),
        projectId: "irisagenda-b6e66",
        storageBucket: "irisagenda-b6e66.appspot.com"
      });
      db = admin.firestore();
    } catch (e) {
      console.error('Firebase Admin initialization error:', e);
      throw new Error('Erro ao inicializar Firebase Admin. Verifique as credenciais.');
    }
  } else {
    db = admin.firestore();
  }
  
  return db;
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: any, res: any) {
  const { method, url } = req;
  const urlParts = url.split('?')[0].split('/').filter(Boolean);
  // url is like /api/asaas/account or /api/asaas/account/ID/documents
  // parts: ['api', 'asaas', 'account', ...]
  
  const route = urlParts[2]; // 'account', 'customer', 'payment', etc.
  const id = urlParts[3];
  const subRoute = urlParts[4];

  try {
    // Helper to get body for non-multipart requests
    const getBody = async () => {
      const chunks = [];
      for await (const chunk of req) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
      }
      const buffer = Buffer.concat(chunks);
      const text = buffer.toString('utf-8');
      return text ? JSON.parse(text) : {};
    };

    // Customer
    if (route === 'customer' && method === 'POST') {
      const body = await getBody();
      const customer = await asaasService.createCustomer(body);
      return res.status(200).json(customer);
    }

    // Account
    if (route === 'account') {
      if (!id && method === 'POST') {
        const body = await getBody();
        const account = await asaasService.createAccount(body);
        return res.status(200).json(account);
      }
      
      if (id && !subRoute && method === 'POST') {
        const body = await getBody();
        const account = await asaasService.updateAccount(id, body);
        return res.status(200).json(account);
      }

      if (id && subRoute === 'documents') {
        if (method === 'GET') {
          const data = await asaasService.getDocuments(id);
          return res.status(200).json(data);
        }
        
        if (method === 'POST') {
          const form = formidable({});
          const { fields, files } = await new Promise<{fields: any, files: any}>((resolve, reject) => {
            form.parse(req, (err, fields, files) => {
              if (err) reject(err);
              else resolve({ fields, files });
            });
          });

          const type = Array.isArray(fields.type) ? fields.type[0] : fields.type;
          const file = Array.isArray(files.file) ? files.file[0] : files.file;

          if (!file) {
            return res.status(400).json({ error: 'Nenhum arquivo enviado' });
          }

          const formData = new FormData();
          const fileBuffer = fs.readFileSync(file.filepath);
          const blob = new Blob([fileBuffer], { type: file.mimetype || 'image/png' });
          formData.append('file', blob, file.originalFilename || 'document.png');
          formData.append('type', type);

          const data = await asaasService.uploadDocument(id, formData);
          return res.status(200).json(data);
        }
      }
    }

    // Payment
    if (route === 'payment' && method === 'POST') {
      const body = await getBody();
      const payment = await asaasService.createPayment(body);
      return res.status(200).json(payment);
    }

    // Payment Status
    if (route === 'payment-status' && id && method === 'GET') {
      const status = await asaasService.getPaymentStatus(id);
      return res.status(200).json(status);
    }

    // PIX QR Code
    if (route === 'pix-qrcode' && id && method === 'GET') {
      const qrcode = await asaasService.getPixQrCode(id);
      return res.status(200).json(qrcode);
    }

    // Balance
    if (route === 'balance' && method === 'GET') {
      const urlObj = new URL(url, `http://${req.headers.host}`);
      const apiKey = urlObj.searchParams.get('apiKey');
      const balance = await asaasService.getBalance(apiKey || undefined);
      return res.status(200).json(balance);
    }

    // Transfer
    if (route === 'transfer' && method === 'POST') {
      const body = await getBody();
      const transfer = await asaasService.transfer(body, body.apiKey);
      return res.status(200).json(transfer);
    }

    // Webhook
    if (route === 'webhook' && method === 'POST') {
      const body = await getBody();
      const { event, payment } = body;
      const webhookToken = req.headers['asaas-access-token'];

      if (process.env.ASAAS_WEBHOOK_TOKEN && webhookToken !== process.env.ASAAS_WEBHOOK_TOKEN) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      console.log(`Asaas Webhook Received: ${event}`, payment?.id);

      if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') {
        const externalReference = payment.externalReference;
        const db = getDb();
        
        if (externalReference) {
          if (externalReference.startsWith('plan_')) {
            const [_, planId, empresaId] = externalReference.split('_');
            await db.collection('empresas').doc(empresaId).update({
              planId,
              'subscription.status': 'active',
              'subscription.currentPeriodEnd': Date.now() + (30 * 24 * 60 * 60 * 1000)
            });
          }
          
          if (externalReference.startsWith('appt_')) {
            const [_, apptId] = externalReference.split('_');
            await db.collection('agendamentos').doc(apptId).update({
              paymentStatus: 'paid',
              paidAt: Date.now()
            });
          }
        }
      }

      return res.status(200).send('OK');
    }

    return res.status(404).json({ error: `Rota não encontrada: ${method} ${url}` });

  } catch (error: any) {
    console.error('Asaas Handler Error:', error);
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
}
