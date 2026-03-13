import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, ArrowRight } from 'lucide-react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/src/services/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User } from '@/src/types/firebase';
import Logo from '@/src/components/Logo';

export default function ClientSignupPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      const newUser: User = {
        id: user.uid,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: 'cliente',
      };
      await setDoc(doc(db, 'users', user.uid), newUser);
      await updateProfile(user, { displayName: formData.name });

      navigate('/my-appointments');
    } catch (err: any) {
      setError(err.message || 'Erro ao criar conta.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md border border-zinc-100"
      >
        <div className="text-center mb-8">
          <Logo className="mb-4 h-12 mx-auto" />
          <h1 className="text-2xl font-bold text-zinc-900">Criar conta de cliente</h1>
          <p className="text-zinc-500 text-sm">Preencha seus dados para agendar.</p>
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
            <label className="text-sm font-semibold text-zinc-700">WhatsApp</label>
            <input 
              required
              type="tel" 
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="(00) 90000-0000"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">E-mail</label>
            <input 
              required
              type="email" 
              className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="seu@email.com"
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
      </motion.div>
    </div>
  );
}
