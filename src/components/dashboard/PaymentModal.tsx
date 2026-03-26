import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CreditCard, QrCode, Shield, Check, Loader2, Copy, ArrowRight, AlertCircle, MapPin } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { toast } from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import { updateEmpresa } from '@/src/services/db';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  value: number;
  description: string;
  externalReference: string;
  customerData: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
  };
  empresaId?: string;
  split?: {
    walletId: string;
    fixedValue?: number;
    percentualValue?: number;
  }[];
  onSuccess: () => void;
  acceptedPaymentMethods?: {
    pix: boolean;
    creditCard: boolean;
    onSite: boolean;
  };
  onPayOnSite?: () => void;
}

export default function PaymentModal({
  isOpen,
  onClose,
  value,
  description,
  externalReference,
  customerData,
  empresaId,
  split,
  onSuccess,
  acceptedPaymentMethods = { pix: true, creditCard: true, onSite: true },
  onPayOnSite
}: PaymentModalProps) {
  const [method, setMethod] = useState<'PIX' | 'CREDIT_CARD' | 'ON_SITE'>(
    acceptedPaymentMethods.pix ? 'PIX' : (acceptedPaymentMethods.creditCard ? 'CREDIT_CARD' : 'ON_SITE')
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [cpfCnpj, setCpfCnpj] = useState(customerData.cpfCnpj || '');
  const [pixData, setPixData] = useState<{ payload: string; encodedImage: string } | null>(null);
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<'PENDING' | 'CONFIRMED' | 'ERROR'>('PENDING');
  const [cardData, setCardData] = useState({
    holderName: '',
    number: '',
    expiryMonth: '',
    expiryYear: '',
    ccv: '',
    installments: '1'
  });

  // Poll for payment status
  useEffect(() => {
    let interval: any;
    if (paymentId && status === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`/api/asaas/payment-status/${paymentId}`);
          const data = await response.json();
          if (data.status === 'RECEIVED' || data.status === 'CONFIRMED') {
            setStatus('CONFIRMED');
            clearInterval(interval);
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2000);
          }
        } catch (error) {
          console.error('Error checking payment status:', error);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [paymentId, status]);

  const handleGeneratePix = async () => {
    setIsProcessing(true);
    try {
      if (!cpfCnpj) {
        throw new Error('Por favor, informe seu CPF ou CNPJ');
      }

      // Update empresa if needed
      if (empresaId && cpfCnpj !== customerData.cpfCnpj) {
        await updateEmpresa(empresaId, { cpfCnpj });
      }

      // 1. Create or get customer
      const customerResponse = await fetch('/api/asaas/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          cpfCnpj
        }),
      });
      
      const customerDataResponse = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerDataResponse.error || 'Erro ao criar cliente no Asaas');
      }
      
      const customer = customerDataResponse;

      // 2. Create PIX payment
      const paymentResponse = await fetch('/api/asaas/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'PIX',
          value,
          dueDate: new Date().toISOString().split('T')[0],
          description,
          externalReference,
          split,
        }),
      });
      
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Erro ao criar pagamento no Asaas');
      }
      
      const payment = paymentData;
      
      // 3. Get PIX QR Code
      const pixResponse = await fetch(`/api/asaas/pix-qrcode/${payment.id}`);
      
      const pixData = await pixResponse.json();
      if (!pixResponse.ok) {
        throw new Error(pixData.error || 'Erro ao gerar QR Code');
      }
      
      setPixData(pixData);
      setPaymentId(payment.id);
    } catch (error: any) {
      console.error('PIX Generation Error:', error);
      toast.error(error.message || 'Erro ao gerar PIX');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreditCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      if (!cpfCnpj) {
        throw new Error('Por favor, informe seu CPF ou CNPJ');
      }

      // Update empresa if needed
      if (empresaId && cpfCnpj !== customerData.cpfCnpj) {
        await updateEmpresa(empresaId, { cpfCnpj });
      }

      // 1. Create or get customer
      const customerResponse = await fetch('/api/asaas/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...customerData,
          cpfCnpj
        }),
      });
      
      const customerDataResponse = await customerResponse.json();
      if (!customerResponse.ok) {
        throw new Error(customerDataResponse.error || 'Erro ao criar cliente no Asaas');
      }
      
      const customer = customerDataResponse;

      // 2. Create Credit Card payment
      const paymentResponse = await fetch('/api/asaas/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: customer.id,
          billingType: 'CREDIT_CARD',
          value,
          dueDate: new Date().toISOString().split('T')[0],
          description,
          externalReference,
          split,
          creditCard: {
            holderName: cardData.holderName,
            number: cardData.number.replace(/\s/g, ''),
            expiryMonth: cardData.expiryMonth,
            expiryYear: cardData.expiryYear,
            ccv: cardData.ccv
          },
          creditCardHolderInfo: {
            name: customerData.name,
            email: customerData.email,
            cpfCnpj: cpfCnpj,
            postalCode: '00000000', // Should be collected in real app
            addressNumber: '0',
            phone: customerData.phone || ''
          }
        }),
      });
      
      const paymentData = await paymentResponse.json();
      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Erro ao processar cartão');
      }

      const payment = paymentData;
      
      if (payment.status === 'CONFIRMED' || payment.status === 'RECEIVED') {
        setStatus('CONFIRMED');
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 2000);
      } else {
        setPaymentId(payment.id);
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar cartão');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayOnSite = () => {
    if (onPayOnSite) {
      onPayOnSite();
    } else {
      onSuccess();
    }
    onClose();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Código copiado!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-black text-zinc-900">Pagamento Seguro</h3>
                <p className="text-zinc-500 text-sm font-medium">{description}</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8">
              {status === 'CONFIRMED' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Check size={40} strokeWidth={3} />
                  </div>
                  <h4 className="text-2xl font-black text-zinc-900 mb-2">Pagamento Confirmado!</h4>
                  <p className="text-zinc-500 font-medium">Sua assinatura foi ativada com sucesso.</p>
                </motion.div>
              ) : (
                <>
                  {/* Method Selection */}
                  {!pixData && (
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {acceptedPaymentMethods.pix && (
                        <button
                          onClick={() => setMethod('PIX')}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                            method === 'PIX' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          )}
                        >
                          <QrCode size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest">PIX</span>
                        </button>
                      )}
                      {acceptedPaymentMethods.creditCard && (
                        <button
                          onClick={() => setMethod('CREDIT_CARD')}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                            method === 'CREDIT_CARD' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          )}
                        >
                          <CreditCard size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">Cartão</span>
                        </button>
                      )}
                      {acceptedPaymentMethods.onSite && (
                        <button
                          onClick={() => setMethod('ON_SITE')}
                          className={cn(
                            "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                            method === 'ON_SITE' ? "border-emerald-500 bg-emerald-50 text-emerald-700" : "border-zinc-100 text-zinc-500 hover:border-zinc-200"
                          )}
                        >
                          <MapPin size={24} />
                          <span className="text-[10px] font-black uppercase tracking-widest text-center">No Local</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* On Site View */}
                  {method === 'ON_SITE' && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center space-y-6 py-8"
                    >
                      <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto">
                        <MapPin size={40} />
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-zinc-900">Pagar no Estabelecimento</h4>
                        <p className="text-zinc-500 text-sm mt-2">
                          Você realizará o pagamento diretamente na clínica no dia do seu agendamento.
                        </p>
                      </div>
                      <button
                        onClick={handlePayOnSite}
                        className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                      >
                        Confirmar Agendamento
                        <ArrowRight size={18} />
                      </button>
                    </motion.div>
                  )}

                  {/* Credit Card View */}
                  {method === 'CREDIT_CARD' && (
                    <form onSubmit={handleCreditCardPayment} className="space-y-4">
                      <div className="space-y-4">
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">CPF ou CNPJ</label>
                          <input
                            required
                            type="text"
                            value={cpfCnpj}
                            onChange={e => setCpfCnpj(e.target.value)}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="000.000.000-00"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Nome no Cartão</label>
                          <input
                            required
                            type="text"
                            value={cardData.holderName}
                            onChange={e => setCardData({ ...cardData, holderName: e.target.value })}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="Como impresso no cartão"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Número do Cartão</label>
                          <input
                            required
                            type="text"
                            value={cardData.number}
                            onChange={e => setCardData({ ...cardData, number: e.target.value })}
                            className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                            placeholder="0000 0000 0000 0000"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Mês</label>
                            <input
                              required
                              type="text"
                              maxLength={2}
                              value={cardData.expiryMonth}
                              onChange={e => setCardData({ ...cardData, expiryMonth: e.target.value })}
                              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                              placeholder="MM"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">Ano</label>
                            <input
                              required
                              type="text"
                              maxLength={4}
                              value={cardData.expiryYear}
                              onChange={e => setCardData({ ...cardData, expiryYear: e.target.value })}
                              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                              placeholder="YYYY"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">CVV</label>
                            <input
                              required
                              type="text"
                              maxLength={4}
                              value={cardData.ccv}
                              onChange={e => setCardData({ ...cardData, ccv: e.target.value })}
                              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none text-center"
                              placeholder="000"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-6"
                      >
                        {isProcessing ? <Loader2 className="animate-spin" /> : <Shield size={20} />}
                        Pagar R$ {value.toFixed(2)}
                      </button>

                      <button
                        type="button"
                        onClick={() => setMethod('PIX')}
                        className="w-full py-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:text-zinc-600 transition-all"
                      >
                        Alterar para PIX
                      </button>
                    </form>
                  )}

                  {/* PIX View */}
                  {method === 'PIX' && (
                    <div className="space-y-6">
                      {!pixData ? (
                        <div className="text-center">
                          <div className="mb-8">
                            <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-2">Total a pagar</p>
                            <h2 className="text-4xl font-black text-zinc-900">R$ {value.toFixed(2)}</h2>
                          </div>

                          <div className="mb-6 text-left">
                            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 block">CPF ou CNPJ para o Recibo</label>
                            <input
                              required
                              type="text"
                              value={cpfCnpj}
                              onChange={e => setCpfCnpj(e.target.value)}
                              className="w-full p-3 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                              placeholder="000.000.000-00"
                            />
                          </div>

                          <button
                            onClick={handleGeneratePix}
                            disabled={isProcessing}
                            className="w-full py-4 bg-zinc-900 text-white rounded-2xl font-black hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                          >
                            {isProcessing ? <Loader2 className="animate-spin" /> : <QrCode size={20} />}
                            Gerar QR Code PIX
                          </button>
                        </div>
                      ) : (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-center"
                        >
                          <div className="bg-white p-4 rounded-3xl border-2 border-zinc-100 inline-block mb-6 shadow-sm">
                            <QRCodeSVG value={pixData.payload} size={200} />
                          </div>
                          
                          <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-6">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2">Pix Copia e Cola</p>
                            <div className="flex items-center gap-2">
                              <code className="flex-1 text-[10px] text-zinc-600 font-mono truncate bg-white p-2 rounded-lg border border-zinc-200">
                                {pixData.payload}
                              </code>
                              <button
                                onClick={() => copyToClipboard(pixData.payload)}
                                className="p-2 bg-white border border-zinc-200 rounded-lg text-zinc-600 hover:text-emerald-600 transition-all"
                              >
                                <Copy size={16} />
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-center gap-3 text-zinc-400 text-xs font-bold animate-pulse">
                            <Loader2 size={14} className="animate-spin" />
                            Aguardando pagamento...
                          </div>
                        </motion.div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-center gap-6">
              <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <Shield size={12} />
                Ambiente Seguro
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-[10px] font-black uppercase tracking-widest">
                <Check size={12} />
                Processado por Asaas
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
