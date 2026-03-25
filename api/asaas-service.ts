const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_ENVIRONMENT = process.env.ASAAS_ENVIRONMENT || 'sandbox';
const ASAAS_URL = ASAAS_ENVIRONMENT === 'sandbox' 
  ? 'https://sandbox.asaas.com/api/v3' 
  : 'https://www.asaas.com/api/v3';

async function asaasRequest(endpoint: string, method: string = 'GET', body?: any) {
  if (!ASAAS_API_KEY) {
    throw new Error('ASAAS_API_KEY não configurada');
  }

  const response = await fetch(`${ASAAS_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'access_token': ASAAS_API_KEY,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('Asaas API Error:', data);
    throw new Error(data.errors?.[0]?.description || 'Erro na API do Asaas');
  }

  return data;
}

export const asaasService = {
  // Clientes
  createCustomer: async (data: { name: string; email: string; cpfCnpj: string; phone?: string }) => {
    return await asaasRequest('/customers', 'POST', data);
  },

  // Cobranças
  createPayment: async (data: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    split?: {
      walletId: string;
      fixedValue?: number;
      percentualValue?: number;
    }[];
  }) => {
    return await asaasRequest('/payments', 'POST', data);
  },

  // Assinaturas
  createSubscription: async (data: {
    customer: string;
    billingType: 'PIX' | 'CREDIT_CARD' | 'BOLETO';
    value: number;
    nextDueDate: string;
    cycle: 'MONTHLY' | 'YEARLY';
    description?: string;
    externalReference?: string;
  }) => {
    return await asaasRequest('/subscriptions', 'POST', data);
  },

  // Webhooks
  getPaymentStatus: async (paymentId: string) => {
    return await asaasRequest(`/payments/${paymentId}`, 'GET');
  },

  // PIX QR Code
  getPixQrCode: async (paymentId: string) => {
    return await asaasRequest(`/payments/${paymentId}/pixQrCode`, 'GET');
  },

  // Subcontas
  createAccount: async (data: {
    name: string;
    email: string;
    cpfCnpj: string;
    companyType: 'INDIVIDUAL' | 'MEI' | 'LIMITED' | 'ASSOCIATION';
    phone?: string;
    mobilePhone?: string;
    address: string;
    addressNumber: string;
    complement?: string;
    province: string;
    postalCode: string;
  }) => {
    return await asaasRequest('/accounts', 'POST', data);
  },

  // Financeiro
  getBalance: async (apiKey?: string) => {
    // Se passar uma apiKey, busca o saldo da subconta, senão busca da conta principal
    const url = `${ASAAS_URL}/finance/balance`;
    const headers: any = {
      'Content-Type': 'application/json',
      'access_token': apiKey || ASAAS_API_KEY,
    };

    const response = await fetch(url, { headers });
    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.description || 'Erro ao buscar saldo');
    return data;
  },

  transfer: async (data: { value: number; bankAccount?: any }, apiKey?: string) => {
    const url = `${ASAAS_URL}/transfers`;
    const headers: any = {
      'Content-Type': 'application/json',
      'access_token': apiKey || ASAAS_API_KEY,
    };

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.errors?.[0]?.description || 'Erro ao realizar transferência');
    return result;
  },

  updateAccount: async (id: string, data: any) => {
    return await asaasRequest(`/accounts/${id}`, 'POST', data);
  },
  
  uploadDocument: async (id: string, formData: any) => {
    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');
    
    const response = await fetch(`${ASAAS_URL}/accounts/${id}/documents`, {
      method: 'POST',
      headers: {
        'access_token': ASAAS_API_KEY,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.errors?.[0]?.description || 'Erro ao fazer upload de documento');
    return data;
  },

  getDocuments: async (id: string) => {
    return await asaasRequest(`/accounts/${id}/documents`, 'GET');
  }
};
