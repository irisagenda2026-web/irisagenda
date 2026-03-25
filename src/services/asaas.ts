import { Empresa, Plan } from '../types/firebase';

export interface AsaasPaymentRequest {
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
}

export const asaasApi = {
  async createCustomer(data: { name: string; email: string; cpfCnpj: string; phone?: string }) {
    const response = await fetch('/api/asaas/customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar cliente no Asaas');
    }
    return response.json();
  },

  async createPayment(data: AsaasPaymentRequest) {
    const response = await fetch('/api/asaas/payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erro ao criar pagamento no Asaas');
    }
    return response.json();
  }
};
