import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { Link } from 'react-router-dom';

interface IntegrationChecklistProps {
  walletId?: string;
  hasBankAccount: boolean;
  hasDocuments: boolean;
  hasPaymentMethods: boolean;
  role: string;
}

export default function IntegrationChecklist({ 
  walletId, 
  hasBankAccount, 
  hasDocuments, 
  hasPaymentMethods,
  role
}: IntegrationChecklistProps) {
  const steps = [
    { 
      id: 'wallet', 
      label: 'Criar Carteira Digital', 
      description: 'Necessário para processar pagamentos.',
      isDone: !!walletId 
    },
    { 
      id: 'bank', 
      label: 'Dados Bancários', 
      description: 'Para onde seu dinheiro será transferido.',
      isDone: hasBankAccount 
    },
    { 
      id: 'docs', 
      label: 'Documentação KYC', 
      description: 'Envie seus documentos para validação.',
      isDone: hasDocuments 
    },
    { 
      id: 'payments', 
      label: 'Métodos de Pagamento', 
      description: 'Escolha como seus clientes podem pagar.',
      isDone: role === 'empresa' ? hasPaymentMethods : true
    }
  ];

  const progress = Math.round((steps.filter(s => s.isDone).length / steps.length) * 100);

  if (progress === 100) return null;

  return (
    <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-emerald-50/30">
        <div>
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-600" />
            Complete sua Integração
          </h3>
          <p className="text-xs text-zinc-500">Faltam apenas alguns passos para você começar a faturar.</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-black text-emerald-600">{progress}%</span>
          <div className="w-32 h-2 bg-zinc-100 rounded-full mt-1 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-emerald-500"
            />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {steps.map((step) => (
            <div key={step.id} className={cn(
              "p-4 rounded-2xl border transition-all",
              step.isDone ? "bg-emerald-50/50 border-emerald-100" : "bg-zinc-50 border-zinc-100"
            )}>
              <div className="flex items-center gap-2 mb-2">
                {step.isDone ? (
                  <div className="w-5 h-5 bg-emerald-500 text-white rounded-full flex items-center justify-center">
                    <CheckCircle2 size={12} />
                  </div>
                ) : (
                  <div className="w-5 h-5 bg-zinc-200 text-zinc-400 rounded-full flex items-center justify-center text-[10px] font-bold">
                    !
                  </div>
                )}
                <span className={cn("text-xs font-bold", step.isDone ? "text-emerald-900" : "text-zinc-900")}>
                  {step.label}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
        <Link 
          to="/dashboard/profile"
          className="flex items-center justify-center gap-2 w-full py-3 bg-zinc-900 text-white rounded-2xl font-bold text-sm hover:bg-zinc-800 transition-all"
        >
          Ir para Configurações
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}
