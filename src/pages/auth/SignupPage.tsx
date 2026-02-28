import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Check, ArrowRight, Shield, Zap, Star, Loader2 } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/services/firebase';
import { createEmpresa } from '@/src/services/db';

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const planName = searchParams.get('plan') || 'Essencial';
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    clinicName: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create User in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // 2. Create Empresa document in Firestore
      await createEmpresa(user.uid, {
        name: formData.clinicName,
        slug: formData.clinicName.toLowerCase().replace(/\s+/g, '-'),
        description: 'Bem-vindo à nossa clínica!',
        address: '',
        phone: '',
        whatsapp: '',
        category: 'beauty',
        ownerId: user.uid,
        plan: (planName.toLowerCase() as any) || 'basic',
        settings: {
          primaryColor: '#059669',
          secondaryColor: '#10b981',
          showReviews: true,
        }
      });

      navigate('/dashboard/site');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/configuration-not-found' || err.code === 'auth/admin-restricted-operation' || err.code === 'auth/operation-not-allowed') {
        setError('Erro de configuração: Habilite o "Email/Senha" no Firebase Console -> Authentication -> Sign-in method.');
      } else {
        setError(err.message || 'Erro ao criar conta. Verifique os dados e tente novamente.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const planIcons: any = {
    'Essencial': Star,
    'Profissional': Zap,
    'Enterprise': Shield,
  };
  const Icon = planIcons[planName] || Star;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-16">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="max-w-md w-full"
        >
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Comece sua jornada</h1>
            <p className="text-zinc-500">Você selecionou o plano <span className="font-bold text-emerald-600">{planName}</span>. Preencha os dados abaixo para criar sua conta.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Nome Completo</label>
              <input 
                required
                type="text" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Seu nome"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Nome da Clínica/Negócio</label>
              <input 
                required
                type="text" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="Ex: Estética Iris"
                value={formData.clinicName}
                onChange={e => setFormData({...formData, clinicName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">E-mail Profissional</label>
              <input 
                required
                type="email" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="contato@suaclinica.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Senha</label>
              <input 
                required
                type="password" 
                className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
            </div>

            <button 
              disabled={isLoading}
              type="submit"
              className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 mt-6 disabled:opacity-70"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Criar minha conta
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Ao se cadastrar, você concorda com nossos <a href="#" className="underline">Termos de Uso</a> e <a href="#" className="underline">Privacidade</a>.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Plan Summary */}
      <div className="hidden md:flex flex-1 bg-zinc-900 items-center justify-center p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-sm w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-[40px] p-10 text-white"
        >
          <div className="flex items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-500/20 text-emerald-400 rounded-2xl">
              <Icon size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Plano {planName}</h2>
              <p className="text-emerald-400 font-medium">14 dias grátis</p>
            </div>
          </div>

          <ul className="space-y-4 mb-10">
            <SummaryItem text="Acesso imediato ao dashboard" />
            <SummaryItem text="Configuração do mini-site" />
            <SummaryItem text="Suporte prioritário" />
            <SummaryItem text="Sem fidelidade, cancele quando quiser" />
          </ul>

          <div className="pt-8 border-t border-white/10">
            <p className="text-zinc-400 text-sm mb-2">Total hoje</p>
            <div className="text-3xl font-bold">R$ 0,00</div>
            <p className="text-zinc-500 text-xs mt-1">Após o período de teste, o valor do plano será cobrado mensalmente.</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function SummaryItem({ text }: { text: string }) {
  return (
    <li className="flex items-center gap-3 text-zinc-300">
      <div className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0">
        <Check size={12} />
      </div>
      <span className="text-sm">{text}</span>
    </li>
  );
}
