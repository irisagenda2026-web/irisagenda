import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Save, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth } from '@/src/services/firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { updateUser } from '@/src/services/db';

export default function ProfilePage() {
  const { user, role } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update Auth Profile
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName: name });
      }

      // Update Firestore User
      await updateUser(user.id, { name });

      setSuccess('Perfil atualizado com sucesso!');
    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar perfil: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setSuccess('Senha alterada com sucesso!');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/requires-recent-login') {
        setError('Para alterar a senha, você precisa ter feito login recentemente. Por favor, saia e entre novamente.');
      } else {
        setError('Erro ao alterar senha: ' + (err.message || 'Erro desconhecido'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Meu Perfil</h1>
          <p className="text-zinc-500 mt-1">Gerencie suas informações pessoais e segurança.</p>
        </header>

        <div className="space-y-6">
          {/* Messages */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm border border-red-100 flex items-center gap-3"
            >
              <AlertCircle size={18} />
              {error}
            </motion.div>
          )}
          {success && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-emerald-50 text-emerald-600 p-4 rounded-2xl text-sm border border-emerald-100 flex items-center gap-3"
            >
              <CheckCircle2 size={18} />
              {success}
            </motion.div>
          )}

          {/* Basic Info */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <User size={18} className="text-emerald-600" />
                Informações Básicas
              </h3>
            </div>
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Nome Completo</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">E-mail</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    disabled
                    type="email" 
                    value={user?.email}
                    className="w-full bg-zinc-100 border border-zinc-200 rounded-2xl pl-12 pr-4 py-3 text-zinc-500 cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 ml-1">O e-mail não pode ser alterado.</p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 ml-1">Cargo / Função</label>
                <div className="px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-zinc-600 font-medium capitalize">
                  {role === 'empresa' ? 'Proprietário' : 'Profissional'}
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Alterações
              </button>
            </form>
          </div>

          {/* Security */}
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <Lock size={18} className="text-amber-600" />
                Segurança
              </h3>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Nova Senha</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 ml-1">Confirmar Nova Senha</label>
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                Alterar Senha
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
