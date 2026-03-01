import { motion } from 'framer-motion';
import { Check, Star, Zap, Shield } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    name: 'Essencial',
    price: 'R$ 89',
    description: 'Perfeito para profissionais autônomos.',
    features: [
      'Agenda Online',
      'Até 2 profissionais',
      'Até 100 agendamentos/mês',
      'Lembretes via WhatsApp (limitado)',
      'Mini-site básico',
      'Suporte via Chat'
    ],
    highlight: false,
    icon: Star
  },
  {
    name: 'Profissional',
    price: 'R$ 159',
    description: 'O melhor para clínicas em crescimento.',
    features: [
      'Tudo do Essencial',
      'Agendamentos ilimitados',
      'WhatsApp API ilimitado',
      'Gestão Financeira completa',
      'Marketing & Ofertas',
      'NPS Automático'
    ],
    highlight: true,
    icon: Zap
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    description: 'Para redes e grandes centros de estética.',
    features: [
      'Tudo do Profissional',
      'Multi-unidades',
      'Relatórios customizados',
      'Gerente de conta dedicado',
      'Treinamento VIP',
      'API de integração'
    ],
    highlight: false,
    icon: Shield
  }
];

export default function PlansPage() {
  const navigate = useNavigate();

  const handleSelectPlan = (planName: string) => {
    navigate(`/signup?plan=${planName}`);
  };

  return (
    <div className="min-h-screen bg-zinc-50 py-24 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold text-zinc-900 mb-4"
          >
            Escolha o plano ideal para o seu negócio
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-zinc-600 text-lg max-w-2xl mx-auto"
          >
            Transforme a gestão da sua clínica com a Iris Agenda. Planos flexíveis que crescem com você.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "relative p-8 rounded-3xl border bg-white shadow-sm transition-all hover:shadow-xl flex flex-col",
                plan.highlight ? "border-emerald-500 ring-4 ring-emerald-500/10" : "border-zinc-200"
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                  MAIS POPULAR
                </div>
              )}

              <div className="flex items-center gap-3 mb-6">
                <div className={cn(
                  "p-3 rounded-2xl",
                  plan.highlight ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-600"
                )}>
                  <plan.icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                  <p className="text-sm text-zinc-500">{plan.description}</p>
                </div>
              </div>

              <div className="mb-8">
                <span className="text-4xl font-bold text-zinc-900">{plan.price}</span>
                {plan.price !== 'Sob consulta' && <span className="text-zinc-500 ml-1">/mês</span>}
              </div>

              <ul className="space-y-4 mb-8 flex-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-zinc-600">
                    <Check className="text-emerald-500 mt-1 shrink-0" size={18} />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button 
                onClick={() => handleSelectPlan(plan.name)}
                className={cn(
                  "w-full py-4 rounded-2xl font-bold transition-all mt-auto",
                  plan.highlight 
                    ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20" 
                    : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                )}
              >
                {plan.name === 'Enterprise' ? 'Falar com Consultor' : 'Começar Agora'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

