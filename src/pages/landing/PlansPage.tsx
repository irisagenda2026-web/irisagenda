import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    id: 'essencial',
    name: 'Essencial',
    price: 89,
    description: 'Perfeito para profissionais autônomos.',
    features: [
      'Agenda Online Inteligente',
      'Até 2 profissionais',
      'Até 100 agendamentos/mês',
      'Lembretes via WhatsApp',
      'Mini-site personalizado',
      'Suporte prioritário'
    ],
    highlight: false,
    icon: Star,
    trialDays: 15
  },
  {
    id: 'profissional',
    name: 'Profissional',
    price: 159,
    description: 'O melhor para clínicas em crescimento.',
    features: [
      'Tudo do Essencial',
      'Agendamentos ilimitados',
      'WhatsApp API ilimitado',
      'Gestão Financeira completa',
      'Marketing & Ofertas',
      'NPS & Pesquisas de Satisfação',
      'Relatórios de Performance'
    ],
    highlight: true,
    icon: Zap,
    trialDays: 15
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 499,
    description: 'Para redes e grandes centros de estética.',
    features: [
      'Tudo do Profissional',
      'Multi-unidades (Franquias)',
      'Relatórios customizados',
      'Gerente de conta dedicado',
      'Treinamento VIP para equipe',
      'API de integração aberta',
      'SLA de suporte 24/7'
    ],
    highlight: false,
    icon: Shield,
    trialDays: 15
  }
];

export default function PlansPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    navigate(`/signup?plan=${planId}`);
  };

  return (
    <div className="min-h-screen bg-white py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold mb-6"
          >
            <Zap size={16} />
            TESTE GRÁTIS POR 15 DIAS
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-zinc-900 mb-6 tracking-tight"
          >
            Invista no futuro da sua clínica.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 text-xl max-w-2xl mx-auto font-medium"
          >
            Escolha o plano que melhor se adapta ao seu momento. Cancele quando quiser, sem letras miúdas.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 + 0.3 }}
              className={cn(
                "relative p-10 rounded-[40px] border transition-all hover:scale-[1.02] flex flex-col",
                plan.highlight 
                  ? "border-zinc-900 bg-zinc-900 text-white shadow-2xl shadow-zinc-900/20" 
                  : "border-zinc-200 bg-white text-zinc-900"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-1.5 rounded-full text-xs font-black tracking-widest uppercase">
                  RECOMENDADO
                </div>
              )}

              <div className="mb-10">
                <h3 className={cn(
                  "text-2xl font-black mb-2",
                  plan.highlight ? "text-white" : "text-zinc-900"
                )}>{plan.name}</h3>
                <p className={cn(
                  "text-sm font-medium",
                  plan.highlight ? "text-zinc-400" : "text-zinc-500"
                )}>{plan.description}</p>
              </div>

              <div className="mb-10">
                <div className="flex items-baseline gap-1">
                  <span className="text-sm font-bold opacity-60">R$</span>
                  <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                  <span className="text-sm font-bold opacity-60">/mês</span>
                </div>
                <p className="text-xs font-bold text-emerald-500 mt-2">
                  + {plan.trialDays} dias de teste grátis
                </p>
              </div>

              <div className={cn(
                "h-px w-full mb-10",
                plan.highlight ? "bg-white/10" : "bg-zinc-100"
              )} />

              <ul className="space-y-5 mb-12 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm font-medium">
                    <Check className={cn(
                      "mt-0.5 shrink-0",
                      plan.highlight ? "text-emerald-400" : "text-emerald-500"
                    )} size={18} />
                    <span className={plan.highlight ? "text-zinc-300" : "text-zinc-600"}>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSelectPlan(plan.id)}
                className={cn(
                  "w-full py-5 rounded-2xl font-black transition-all text-sm uppercase tracking-widest",
                  plan.highlight 
                    ? "bg-white text-zinc-900 hover:bg-zinc-100" 
                    : "bg-zinc-900 text-white hover:bg-zinc-800"
                )}
              >
                {plan.id === 'enterprise' ? 'Falar com Especialista' : 'Iniciar Teste Grátis'}
              </button>
            </motion.div>
          ))}
        </div>

        <div className="bg-zinc-50 rounded-[40px] p-12 text-center border border-zinc-100">
          <h3 className="text-2xl font-black text-zinc-900 mb-4">Ainda tem dúvidas?</h3>
          <p className="text-zinc-500 font-medium mb-8">Nossa equipe está pronta para ajudar você a escolher o melhor caminho.</p>
          <button className="px-10 py-4 bg-white border border-zinc-200 rounded-2xl font-bold text-zinc-900 hover:bg-zinc-50 transition-all">
            Ver Comparativo Completo
          </button>
        </div>
      </div>
    </div>
  );
}

