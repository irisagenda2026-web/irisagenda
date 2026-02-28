import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, User, Lock, Mail } from 'lucide-react';
import { auth } from '@/src/services/firebase';
import { updatePassword, updateProfile, updateEmail } from 'firebase/auth';
import { updateUser } from '@/src/services/db';
import { User as UserType } from '@/src/types/firebase';

interface ClientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserType | null;
  onUpdate: () => void;
}

export default function ClientProfileModal({ isOpen, onClose, user, onUpdate }: ClientProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !user) throw new Error('Usuário não autenticado');

      // Update Name
      if (name !== user.name) {
        await updateProfile(currentUser, { displayName: name });
        await updateUser(user.id, { name });
      }

      // Update Email (requires re-auth usually, but let's try)
      if (email !== user.email) {
        await updateEmail(currentUser, email);
        await updateUser(user.id, { email });
      }

      // Update Password
      if (password) {
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem');
        }
        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres');
        }
        await updatePassword(currentUser, password);
      }

      setSuccess('Perfil atualizado com sucesso!');
      onUpdate();
      setTimeout(() => {
        onClose();
        setSuccess('');
        setPassword('');
        setConfirmPassword('');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Para alterar o email ou senha, faça login novamente.');
      } else {
        setError(err.message || 'Erro ao atualizar perfil.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-bold text-zinc-900">Editar Perfil</h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-emerald-50 text-emerald-600 text-sm rounded-xl border border-emerald-100">
                  {success}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <User size={16} /> Nome Completo
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="Seu nome"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Mail size={16} /> Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  placeholder="seu@email.com"
                />
              </div>

              <div className="pt-4 border-t border-zinc-100">
                <h3 className="text-sm font-bold text-zinc-900 mb-4">Alterar Senha</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                      <Lock size={16} /> Nova Senha
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      placeholder="Deixe em branco para manter"
                    />
                  </div>

                  {password && (
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Confirmar Senha</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        placeholder="Repita a nova senha"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 text-zinc-600 font-semibold hover:bg-zinc-100 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Salvar Alterações
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
