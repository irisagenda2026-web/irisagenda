import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Check, ArrowRight, Shield, Zap, Star, Loader2, Building2, CreditCard, User as UserIcon, Lock, Globe, Mail } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/services/firebase';
import { createEmpresa, createUser, getPlans } from '@/src/services/db';
import { Plan } from '@/src/types/firebase';
import Logo from '@/src/components/Logo';

type Step = 'account' | 'business' | 'payment';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planId = searchParams.get('plan') || 'essencial';
  
  const [step, setStep] = useState<Step>('account');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    clinicName: '',
    category: 'beauty',
    slug: '',
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
  });

  useEffect(() => {
    const fetchPlans = async () => {
      const allPlans = await getPlans();
      setPlans(allPlans);
      const plan = allPlans.find(p => p.id === planId) || allPlans[0];
      setSelectedPlan(plan);
    };
    fetchPlans();
  }, [planId]);

  const handleNext = () => {
    if (step === 'account') {
      if (!formData.name || !formData.email || !formData.password) {
        setError('Preencha todos os campos da conta.');
        return;
      }
      setStep('business');
    } else if (step === 'business') {
      if (!formData.clinicName || !formData.slug) {
        setError('Preencha os dados da sua clínica.');
        return;
      }
      setStep('payment');
    }
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const firebaseUser = userCredential.user;

      // 2. Create User metadata in Firestore
      await createUser(firebaseUser.uid, {
        name: formData.name,
        email: formData.email,
        role: 'empresa',
        empresaId: firebaseUser.uid,
      });

      // 3. Create Empresa document in Firestore
      const trialDays = selectedPlan?.permissions.trialDays || 15;
      const trialEndsAt = Date.now() + (trialDays * 24 * 60 * 60 * 1000);

      await createEmpresa(firebaseUser.uid, {
        name: formData.clinicName,
        slug: formData.slug.toLowerCase().replace(/\s+/g, '-'),
        description: 'Bem-vindo à nossa clínica!',
        address: '',
        phone: '',
        whatsapp: '',
        category: formData.category as any,
        ownerId: firebaseUser.uid,
        planId: selectedPlan?.id || 'essencial',
        subscription: {
          status: 'trialing',
          trialEndsAt,
          currentPeriodEnd: trialEndsAt,
          cancelAtPeriodEnd: false,
          paymentMethod: {
            brand: 'visa', // Simulated
            last4: formData.cardNumber.slice(-4),
            cardToken: 'tok_simulated_' + Math.random().toString(36).substring(7),
          }
        },
        settings: {
          primaryColor: '#059669',
          secondaryColor: '#10b981',
          showReviews: true,
        }
      });

      navigate('/dashboard/site');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
      } else {
        setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 'account', label: 'Conta', icon: UserIcon },
    { id: 'business', label: 'Negócio', icon: Building2 },
    { id: 'payment', label: 'Pagamento', icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 md:p-16">
        <div className="max-w-md w-full">
          <Logo className="mb-12 h-12" />
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-12 relative">
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-zinc-100 -translate-y-1/2 z-0" />
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isPast = steps.findIndex(x => x.id === step) > idx;
              
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all border-2",
                    isActive ? "bg-zinc-900 border-zinc-900 text-white scale-110" : 
                    isPast ? "bg-emerald-500 border-emerald-500 text-white" : 
                    "bg-white border-zinc-200 text-zinc-400"
                  )}>
                    {isPast ? <Check size={18} /> : <Icon size={18} />}
                  </div>
                  <span className={cn(
                    "text-xs font-bold uppercase tracking-widest",
                    isActive ? "text-zinc-900" : "text-zinc-400"
                  )}>{s.label}</span>
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === 'account' && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-black text-zinc-900 mb-2">Crie sua conta</h1>
                  <p className="text-zinc-500 font-medium">Dados pessoais para acesso ao sistema.</p>
                </div>

                {error && <ErrorAlert message={error} />}

                <div className="space-y-4">
                  <Input 
                    label="Nome Completo"
                    icon={UserIcon}
                    placeholder="Como devemos te chamar?"
                    value={formData.name}
                    onChange={v => setFormData({...formData, name: v})}
                  />
                  <Input 
                    label="E-mail Profissional"
                    icon={Mail}
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={v => setFormData({...formData, email: v})}
                  />
                  <Input 
                    label="Senha de Acesso"
                    icon={Lock}
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={formData.password}
                    onChange={v => setFormData({...formData, password: v})}
                  />
                </div>

                <button 
                  onClick={handleNext}
                  className="w-full bg-zinc-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                >
                  Próximo Passo
                  <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 'business' && (
              <motion.div
                key="business"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-black text-zinc-900 mb-2">Sua Clínica</h1>
                  <p className="text-zinc-500 font-medium">Como seus clientes verão seu negócio.</p>
                </div>

                {error && <ErrorAlert message={error} />}

                <div className="space-y-4">
                  <Input 
                    label="Nome do Negócio"
                    icon={Building2}
                    placeholder="Ex: Estética Iris"
                    value={formData.clinicName}
                    onChange={v => {
                      setFormData({
                        ...formData, 
                        clinicName: v,
                        slug: v.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '')
                      });
                    }}
                  />
                  <Input 
                    label="Link da sua Agenda"
                    icon={Globe}
                    placeholder="irisagenda.com/sua-clinica"
                    value={formData.slug}
                    onChange={v => setFormData({...formData, slug: v})}
                    prefix="irisagenda.com/"
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-zinc-400">Categoria</label>
                    <select 
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-4 focus:ring-2 focus:ring-zinc-900 outline-none transition-all font-medium"
                      value={formData.category}
                      onChange={e => setFormData({...formData, category: e.target.value})}
                    >
                      <option value="beauty">Estética & Beleza</option>
                      <option value="health">Saúde & Bem-estar</option>
                      <option value="fitness">Fitness & Esportes</option>
                      <option value="other">Outros</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('account')}
                    className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleNext}
                    className="flex-[2] bg-zinc-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                  >
                    Próximo Passo
                    <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'payment' && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div>
                  <h1 className="text-3xl font-black text-zinc-900 mb-2">Teste Grátis</h1>
                  <p className="text-zinc-500 font-medium">Insira um cartão para validar sua conta. Nada será cobrado hoje.</p>
                </div>

                {error && <ErrorAlert message={error} />}

                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-[32px] mb-8">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-white rounded-2xl text-emerald-600 shadow-sm">
                      <Zap size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-emerald-900">Período de Teste Ativo</h4>
                      <p className="text-sm text-emerald-700 font-medium">Você terá 15 dias de acesso total.</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t border-emerald-200/50">
                    <span className="text-sm font-bold text-emerald-800">Total a pagar hoje:</span>
                    <span className="text-xl font-black text-emerald-900">R$ 0,00</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input 
                    label="Nome no Cartão"
                    icon={UserIcon}
                    placeholder="Como está no cartão"
                    value={formData.cardName}
                    onChange={v => setFormData({...formData, cardName: v})}
                  />
                  <Input 
                    label="Número do Cartão"
                    icon={CreditCard}
                    placeholder="0000 0000 0000 0000"
                    value={formData.cardNumber}
                    onChange={v => setFormData({...formData, cardNumber: v})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label="Validade"
                      placeholder="MM/AA"
                      value={formData.cardExpiry}
                      onChange={v => setFormData({...formData, cardExpiry: v})}
                    />
                    <Input 
                      label="CVC"
                      placeholder="123"
                      value={formData.cardCvc}
                      onChange={v => setFormData({...formData, cardCvc: v})}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('business')}
                    className="flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest border border-zinc-200 text-zinc-600 hover:bg-zinc-50 transition-all"
                  >
                    Voltar
                  </button>
                  <button 
                    onClick={handleSubmit}
                    disabled={isLoading}
                    className="flex-[2] bg-emerald-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
                  >
                    {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Ativar Teste Grátis'}
                  </button>
                </div>

                <p className="text-center text-[10px] text-zinc-400 font-bold uppercase tracking-widest">
                  Ambiente Seguro • Criptografia de Ponta a Ponta
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-12 pt-8 border-t border-zinc-100 text-center">
            <p className="text-zinc-500 text-sm font-medium">
              Já tem uma conta?{' '}
              <Link to="/login" className="text-zinc-900 font-black hover:underline">
                Entrar agora
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Plan Summary */}
      <div className="hidden lg:flex flex-1 bg-zinc-900 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/10 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/10 blur-[120px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[48px] p-12 text-white shadow-2xl"
        >
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black tracking-widest uppercase mb-6">
              Plano Selecionado
            </div>
            <h2 className="text-4xl font-black mb-2">{selectedPlan?.name}</h2>
            <p className="text-zinc-400 font-medium">{selectedPlan?.description}</p>
          </div>

          <ul className="space-y-6 mb-12">
            {selectedPlan?.features.slice(0, 5).map((f, i) => (
              <li key={i} className="flex items-center gap-4 text-zinc-300">
                <div className="w-6 h-6 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
                  <Check size={14} />
                </div>
                <span className="text-sm font-medium">{f}</span>
              </li>
            ))}
          </ul>

          <div className="pt-10 border-t border-white/10">
            <div className="flex justify-between items-end mb-4">
              <div>
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Total Hoje</p>
                <div className="text-4xl font-black">R$ 0,00</div>
              </div>
              <div className="text-right">
                <p className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-1">Após 15 dias</p>
                <div className="text-xl font-bold text-zinc-300">R$ {selectedPlan?.price}/mês</div>
              </div>
            </div>
            <p className="text-zinc-500 text-xs font-medium leading-relaxed">
              O valor do plano será cobrado automaticamente após o período de teste. Você pode cancelar a qualquer momento nas configurações.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function Input({ label, icon: Icon, prefix, ...props }: any) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black uppercase tracking-widest text-zinc-400">{label}</label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400">
            <Icon size={18} />
          </div>
        )}
        <div className="flex items-center">
          {prefix && (
            <span className="pl-4 pr-0 py-4 bg-zinc-50 border-y border-l border-zinc-100 rounded-l-xl text-zinc-400 font-medium text-sm">
              {prefix}
            </span>
          )}
          <input 
            {...props}
            onChange={e => props.onChange(e.target.value)}
            className={cn(
              "w-full bg-zinc-50 border border-zinc-100 rounded-xl py-4 focus:ring-2 focus:ring-zinc-900 outline-none transition-all font-medium",
              Icon ? "pl-12 pr-4" : "px-4",
              prefix ? "rounded-l-none" : ""
            )}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm font-bold border border-red-100 flex items-center gap-3"
    >
      <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse" />
      {message}
    </motion.div>
  );
}
