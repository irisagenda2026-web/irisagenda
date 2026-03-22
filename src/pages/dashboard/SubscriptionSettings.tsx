import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/src/contexts/AuthContext';
import { getPlans, updateEmpresaSubscription } from '@/src/services/db';
import { Plan } from '@/src/types/firebase';
import { Check, Zap, CreditCard, Calendar, Shield, AlertCircle, Loader2 } from 'lucide-react';
import { cn } from '@/src/utils/cn';

export default function SubscriptionSettings() {
  const { empresa } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      const allPlans = await getPlans();
      setPlans(allPlans);
      setIsLoading(false);
    };
    fetchPlans();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-zinc-400" size={32} />
      </div>
    );
  }

  const currentPlan = plans.find(p => p.id === empresa?.planId);
  const subscription = empresa?.subscription;
  const isTrialing = subscription?.status === 'trialing';
  
  const trialEndsAt = subscription?.trialEndsAt ? new Date(subscription.trialEndsAt) : null;
  const daysLeft = trialEndsAt ? Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <div className="max-w-5xl mx-auto p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-zinc-900 mb-2">Assinatura</h1>
        <p className="text-zinc-500 font-medium">Gerencie seu plano e formas de pagamento.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Current Plan Summary */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-zinc-100 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black tracking-widest uppercase mb-4">
                  Plano Atual
                </div>
                <h2 className="text-3xl font-black text-zinc-900">{currentPlan?.name || 'Nenhum plano selecionado'}</h2>
              </div>
              <div className="text-right">
                <p className="text-zinc-400 text-xs font-black uppercase tracking-widest mb-1">Valor Mensal</p>
                <div className="text-2xl font-black text-zinc-900">R$ {currentPlan?.price || 0}</div>
              </div>
            </div>

            {isTrialing && (
              <div className="bg-zinc-900 rounded-3xl p-6 text-white flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/10 rounded-2xl text-emerald-400">
                    <Zap size={24} />
                  </div>
                  <div>
                    <h4 className="font-black">Período de Teste Ativo</h4>
                    <p className="text-sm text-zinc-400 font-medium">Você tem {daysLeft} dias restantes no seu teste grátis.</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Termina em</p>
                  <p className="font-bold">{trialEndsAt?.toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h4 className="text-sm font-black text-zinc-900 uppercase tracking-widest">Funcionalidades Incluídas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPlan?.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm text-zinc-600 font-medium">
                    <Check className="text-emerald-500" size={16} />
                    {f}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-[40px] border border-zinc-100 p-10 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-black text-zinc-900">Método de Pagamento</h3>
              <button className="text-sm font-bold text-emerald-600 hover:underline">Alterar Cartão</button>
            </div>

            {subscription?.paymentMethod ? (
              <div className="flex items-center gap-6 p-6 bg-zinc-50 rounded-3xl border border-zinc-100">
                <div className="w-16 h-10 bg-white border border-zinc-200 rounded-lg flex items-center justify-center shadow-sm">
                  <span className="font-black text-zinc-400 italic uppercase">{subscription.paymentMethod.brand}</span>
                </div>
                <div className="flex-1">
                  <p className="font-black text-zinc-900">•••• •••• •••• {subscription.paymentMethod.last4}</p>
                  <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">Expira em 12/28</p>
                </div>
                <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                  Ativo
                </div>
              </div>
            ) : (
              <div className="text-center py-8 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                <p className="text-zinc-500 font-medium mb-4">Nenhum cartão cadastrado.</p>
                <button className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold text-sm">Adicionar Cartão</button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-8">
          <div className="bg-zinc-50 rounded-[40px] p-8 border border-zinc-100">
            <h3 className="text-lg font-black text-zinc-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button className="w-full py-4 bg-white border border-zinc-200 rounded-2xl font-bold text-zinc-900 hover:bg-zinc-100 transition-all text-sm">
                Alterar Plano
              </button>
              <button className="w-full py-4 bg-white border border-zinc-200 rounded-2xl font-bold text-zinc-900 hover:bg-zinc-100 transition-all text-sm">
                Histórico de Faturas
              </button>
              <button className="w-full py-4 bg-red-50 text-red-600 rounded-2xl font-bold hover:bg-red-100 transition-all text-sm">
                Cancelar Assinatura
              </button>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-[40px] p-8 border border-emerald-100">
            <div className="p-3 bg-white rounded-2xl text-emerald-600 w-fit mb-4 shadow-sm">
              <Shield size={24} />
            </div>
            <h3 className="text-lg font-black text-emerald-900 mb-2">Suporte VIP</h3>
            <p className="text-sm text-emerald-700 font-medium mb-6">Como assinante {currentPlan?.name}, você tem acesso ao nosso suporte prioritário.</p>
            <button className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all text-sm">
              Falar com Suporte
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
