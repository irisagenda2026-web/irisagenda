import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plan } from '@/src/types/firebase';
import { Check, X, Zap, Shield, Sparkles, Loader2, ArrowRight, QrCode } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import PaymentModal from './PaymentModal';
import { useAuth } from '@/src/contexts/AuthContext';

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: Plan[];
  currentPlanId?: string;
  onSelectPlan: (planId: string) => Promise<void>;
}

export default function PlanSelectionModal({
  isOpen,
  onClose,
  plans,
  currentPlanId,
  onSelectPlan
}: PlanSelectionModalProps) {
  const { user, empresa } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);

  const handleConfirm = async () => {
    if (!selectedPlan) return;
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await onSelectPlan(selectedPlan.id);
      onClose();
    } catch (error) {
      console.error('Error updating plan:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
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
            className="relative w-full max-w-6xl bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-8 md:p-12 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
              <div>
                <h2 className="text-3xl md:text-4xl font-black text-zinc-900 mb-2">Escolha seu Plano</h2>
                <p className="text-zinc-500 font-medium">Selecione o plano ideal para o crescimento do seu negócio.</p>
              </div>
              <button
                onClick={onClose}
                className="p-4 bg-white border border-zinc-200 rounded-2xl text-zinc-400 hover:text-zinc-900 hover:border-zinc-300 transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-12">
              {!selectedPlan ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {plans.map((plan) => {
                    const isCurrent = plan.id === currentPlanId;
                    const isHighlighted = plan.isHighlighted;
                    const Icon = plan.name.toLowerCase().includes('enterprise') ? Shield : isHighlighted ? Sparkles : Zap;

                    return (
                      <motion.div
                        key={plan.id}
                        whileHover={{ y: -8 }}
                        className={cn(
                          "relative p-8 rounded-[40px] border-2 transition-all cursor-pointer group flex flex-col",
                          isCurrent 
                            ? "border-emerald-500 bg-emerald-50/30" 
                            : "border-zinc-100 hover:border-zinc-300 bg-white shadow-sm hover:shadow-xl"
                        )}
                        onClick={() => !isCurrent && setSelectedPlan(plan)}
                      >
                        {isCurrent && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                            Plano Atual
                          </div>
                        )}

                        {isHighlighted && (
                          <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                            Mais Popular
                          </div>
                        )}

                        <div className="mb-8">
                          <div className={cn(
                            "w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner",
                            isHighlighted ? "bg-zinc-900 text-white" : "bg-emerald-100 text-emerald-600"
                          )}>
                            <Icon size={28} />
                          </div>
                          <h3 className="text-2xl font-black text-zinc-900 mb-2">{plan.name}</h3>
                          <p className="text-zinc-500 text-sm font-medium leading-relaxed">{plan.description}</p>
                        </div>

                        <div className="mb-8">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-black text-zinc-900">R$ {plan.price}</span>
                            <span className="text-zinc-400 font-bold text-sm uppercase tracking-widest">/mês</span>
                          </div>
                        </div>

                        <div className="space-y-4 mb-10 flex-1">
                          {plan.features.map((feature, i) => (
                            <div key={i} className="flex items-start gap-3 text-sm text-zinc-600 font-medium">
                              <div className="mt-1 p-0.5 bg-emerald-100 rounded-full text-emerald-600">
                                <Check size={12} strokeWidth={4} />
                              </div>
                              {feature}
                            </div>
                          ))}
                        </div>

                        <button
                          disabled={isCurrent}
                          className={cn(
                            "w-full py-4 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2",
                            isCurrent
                              ? "bg-emerald-100 text-emerald-700 cursor-not-allowed"
                              : isHighlighted
                                ? "bg-zinc-900 text-white hover:bg-zinc-800 shadow-lg shadow-zinc-200"
                                : "bg-white border-2 border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-white"
                          )}
                        >
                          {isCurrent ? 'Seu Plano Atual' : 'Selecionar Plano'}
                          {!isCurrent && <ArrowRight size={18} />}
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="max-w-2xl mx-auto text-center"
                >
                  <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-[32px] flex items-center justify-center mx-auto mb-8">
                    <Check size={48} strokeWidth={3} />
                  </div>
                  <h3 className="text-4xl font-black text-zinc-900 mb-4">Confirmar Alteração</h3>
                  <p className="text-zinc-500 font-medium mb-12 text-lg">
                    Você está alterando seu plano para o <span className="text-zinc-900 font-black">{selectedPlan.name}</span>. 
                    As novas funcionalidades serão liberadas imediatamente.
                  </p>

                  <div className="bg-zinc-50 rounded-[40px] p-10 border border-zinc-100 mb-12 text-left">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-200">
                      <span className="font-black text-zinc-900">Novo Valor Mensal</span>
                      <span className="text-2xl font-black text-zinc-900">R$ {selectedPlan.price}</span>
                    </div>
                    <div className="space-y-4">
                      <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">O que muda:</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedPlan.features.slice(0, 4).map((f, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-zinc-600 font-medium">
                            <Check className="text-emerald-500" size={16} />
                            {f}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-4">
                    <button
                      onClick={() => setSelectedPlan(null)}
                      disabled={isSubmitting}
                      className="flex-1 py-5 bg-white border-2 border-zinc-200 text-zinc-900 rounded-3xl font-black hover:bg-zinc-50 transition-all disabled:opacity-50"
                    >
                      Voltar
                    </button>
                    <button
                      onClick={handleConfirm}
                      disabled={isSubmitting}
                      className="flex-[2] py-5 bg-zinc-900 text-white rounded-3xl font-black hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-200 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="animate-spin" size={24} />
                          Processando...
                        </>
                      ) : (
                        <>
                          Confirmar Alteração
                          <ArrowRight size={24} />
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-center gap-8">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                <Shield size={14} />
                Pagamento Seguro
              </div>
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-bold uppercase tracking-widest">
                <Zap size={14} />
                Ativação Instantânea
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {selectedPlan && (
        <PaymentModal
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          value={selectedPlan.price}
          description={`Assinatura Plano ${selectedPlan.name}`}
          externalReference={`plan_${empresa?.id}_${selectedPlan.id}`}
          customerData={{
            name: user?.name || '',
            email: user?.email || '',
            cpfCnpj: '00000000000', // In a real app, we'd ask for this
            phone: empresa?.phone
          }}
          onSuccess={handlePaymentSuccess}
        />
      )}
    </AnimatePresence>
  );
}
