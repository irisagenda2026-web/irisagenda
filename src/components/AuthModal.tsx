import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, User, Loader2, AlertCircle, LogIn, UserPlus } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '@/src/services/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import Logo from '@/src/components/Logo';
import { User as FirebaseUser } from '@/src/types/firebase';
import { Phone } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: FirebaseUser) => void;
  isBookingFlow?: boolean;
}

export default function AuthModal({ isOpen, onClose, onSuccess, isBookingFlow = false }: AuthModalProps) {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let finalUserData: FirebaseUser;

      if (mode === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        if (userDoc.exists()) {
          finalUserData = { ...userDoc.data() as FirebaseUser, id: userCredential.user.uid };
        } else {
          finalUserData = {
            id: userCredential.user.uid,
            name: userCredential.user.displayName || 'Usuário',
            email: userCredential.user.email || '',
            role: 'cliente'
          };
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        const newUser: FirebaseUser = {
          id: user.uid,
          name: name,
          email: email,
          phone: phone,
          role: 'cliente',
        };
        await setDoc(doc(db, 'users', user.uid), newUser);
        await updateProfile(user, { displayName: name });
        finalUserData = newUser;
      }
      onSuccess(finalUserData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao autenticar.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
              <h2 className="text-xl font-bold text-zinc-900">
                {mode === 'login' ? 'Entrar na sua conta' : 'Criar sua conta'}
              </h2>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Nome</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input 
                      required
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="Seu nome"
                    />
                  </div>
                </div>
              )}

              {mode === 'signup' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input 
                      required
                      type="tel" 
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="(00) 90000-0000"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Senha</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                disabled={isLoading}
                type="submit"
                className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
              >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : (mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />)}
                {mode === 'login' ? 'Entrar' : 'Criar conta'}
              </button>
            </form>

            <div className="p-6 pt-0 text-center text-sm text-zinc-500">
              {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem conta?'}
              <button 
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="ml-1 text-emerald-600 font-bold hover:underline"
              >
                {mode === 'login' ? 'Criar conta' : 'Entrar'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
