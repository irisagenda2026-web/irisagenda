import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/src/services/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import { useEffect } from 'react';
import Logo from '@/src/components/Logo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { role, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && role !== 'guest') {
      navigate(role === 'admin' ? '/admin/dashboard' : role === 'empresa' ? '/dashboard/calendar' : '/my-appointments');
    }
  }, [role, authLoading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Add a safety timeout
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        setIsLoading(false);
        setError('A conexão está demorando mais que o esperado. Verifique sua internet e tente novamente.');
      }
    }, 15000);

    try {
      console.log("Auth object state:", {
        currentUser: auth.currentUser?.uid,
        config: auth.config
      });
      console.log("Attempting login for:", email);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful, user:", result.user.uid);
      clearTimeout(timeoutId);
      // AuthContext will handle the redirect via useEffect
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Login Error Details:", err);
      
      switch (err.code) {
        case 'auth/user-not-found':
          setError('Usuário não encontrado. Verifique o e-mail ou crie uma conta.');
          break;
        case 'auth/wrong-password':
          setError('Senha incorreta. Tente novamente ou recupere sua senha.');
          break;
        case 'auth/invalid-email':
          setError('E-mail inválido. Verifique o formato digitado.');
          break;
        case 'auth/user-disabled':
          setError('Esta conta foi desativada. Entre em contato com o suporte.');
          break;
        case 'auth/too-many-requests':
          setError('Muitas tentativas malsucedidas. Tente novamente mais tarde.');
          break;
        case 'auth/configuration-not-found':
        case 'auth/admin-restricted-operation':
        case 'auth/operation-not-allowed':
          setError('Erro de configuração no servidor. Por favor, tente mais tarde.');
          break;
        case 'auth/network-request-failed':
          setError('Erro de rede. Verifique sua conexão com a internet.');
          break;
        default:
          setError('Erro ao entrar. Verifique seus dados ou tente criar uma nova conta.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-[40px] border border-zinc-200 shadow-2xl shadow-zinc-200/50 overflow-hidden"
      >
        <div className="p-8 md:p-12">
          <div className="text-center mb-10 flex flex-col items-center">
            <Logo className="mb-6 h-16" />
            <h1 className="text-3xl font-bold text-zinc-900 mb-2">Bem-vindo de volta</h1>
            <p className="text-zinc-500">Acesse sua conta para gerenciar sua agenda.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-3">
                <AlertCircle size={18} />
                {error}
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
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-semibold text-zinc-700">Senha</label>
                <button type="button" className="text-xs font-bold text-emerald-600 hover:underline">Esqueceu a senha?</button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                <input 
                  required
                  type="password" 
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl pl-12 pr-4 py-4 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              disabled={isLoading}
              type="submit"
              className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-70"
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="animate-spin" size={20} />
                  <span className="text-xs font-normal opacity-70">Conectando...</span>
                </div>
              ) : (
                <>
                  Entrar
                  <LogIn size={20} />
                </>
              )}
            </button>

            {isLoading && (
              <button 
                type="button"
                onClick={() => setIsLoading(false)}
                className="w-full mt-2 text-xs text-zinc-400 hover:text-zinc-600 underline"
              >
                O login está demorando? Clique aqui para cancelar e tentar de novo.
              </button>
            )}
          </form>

          <div className="mt-10 pt-8 border-t border-zinc-100 text-center">
            <p className="text-zinc-500 text-sm">
              Ainda não tem uma conta?{' '}
              <Link to="/plans" className="text-emerald-600 font-bold hover:underline">
                Criar conta agora
              </Link>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
