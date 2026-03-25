import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, Mail, Save, Loader2, AlertCircle, CheckCircle2, Landmark, CreditCard, Upload, FileText, Sparkles } from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { auth } from '@/src/services/firebase';
import { updatePassword, updateProfile } from 'firebase/auth';
import { updateUser, updateProfissional, updateEmpresa } from '@/src/services/db';

export default function ProfilePage() {
  const { user, role, profissional, empresa, refresh } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreatingAsaas, setIsCreatingAsaas] = useState(false);

  const currentAsaasAccount = role === 'empresa' ? empresa : profissional;
  const walletId = currentAsaasAccount?.asaasWalletId;

  // Asaas Creation state (for when walletId is missing)
  const [asaasFormData, setAsaasFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    cpfCnpj: (role === 'empresa' ? empresa?.cpfCnpj : profissional?.cpfCnpj) || '',
    phone: (role === 'empresa' ? empresa?.phone : profissional?.phone) || '',
    postalCode: (role === 'empresa' ? empresa?.postalCode : '') || '',
    address: (role === 'empresa' ? empresa?.address : '') || '',
    addressNumber: (role === 'empresa' ? empresa?.addressNumber : '') || '',
    province: (role === 'empresa' ? empresa?.province : '') || '',
    companyType: (role === 'empresa' ? (empresa?.companyType || 'LIMITED') : 'INDIVIDUAL') as any
  });

  // Documents state
  const [documents, setDocuments] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);

  // Bank details state
  const [bankData, setBankData] = useState({
    bankCode: currentAsaasAccount?.bankAccount?.bankCode || '',
    agency: currentAsaasAccount?.bankAccount?.agency || '',
    account: currentAsaasAccount?.bankAccount?.account || '',
    accountDigit: currentAsaasAccount?.bankAccount?.accountDigit || '',
    bankAccountType: currentAsaasAccount?.bankAccount?.bankAccountType || 'CHECKING'
  });

  useEffect(() => {
    if (walletId) {
      fetchDocuments();
    }
  }, [walletId]);

  const fetchDocuments = async () => {
    if (!walletId) return;
    setIsLoadingDocs(true);
    try {
      const response = await fetch(`/api/asaas/account/${walletId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.data || []);
      }
    } catch (err) {
      console.error('Erro ao buscar documentos:', err);
    } finally {
      setIsLoadingDocs(false);
    }
  };

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
      await refresh();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar perfil: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletId) {
      setError('Você ainda não possui uma carteira Asaas vinculada. Entre em contato com o administrador.');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // 1. Update in Asaas via our API
      const response = await fetch(`/api/asaas/account/${walletId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bankAccount: {
            bankCode: bankData.bankCode,
            agency: bankData.agency,
            account: bankData.account,
            accountDigit: bankData.accountDigit,
            bankAccountType: bankData.bankAccountType
          }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao atualizar dados bancários no Asaas');
      }

      // 2. Update in Firestore
      if (role === 'empresa' && empresa) {
        await updateEmpresa(empresa.id, {
          bankAccount: bankData as any
        });
      } else if (role === 'profissional' && profissional) {
        await updateProfissional(profissional.id, {
          bankAccount: bankData as any
        });
      }

      setSuccess('Dados bancários atualizados com sucesso!');
      await refresh();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao atualizar dados bancários: ' + (err.message || 'Erro desconhecido'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateAsaasWallet = async () => {
    if (!asaasFormData.cpfCnpj || !asaasFormData.postalCode || !asaasFormData.address || !asaasFormData.addressNumber || !asaasFormData.province) {
      setError('Por favor, preencha todos os campos de endereço e CPF/CNPJ para criar a carteira Asaas.');
      return;
    }

    setIsCreatingAsaas(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/asaas/account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: asaasFormData.name,
          email: asaasFormData.email,
          cpfCnpj: asaasFormData.cpfCnpj.replace(/\D/g, ''),
          companyType: asaasFormData.companyType,
          mobilePhone: asaasFormData.phone.replace(/\D/g, ''),
          postalCode: asaasFormData.postalCode.replace(/\D/g, ''),
          address: asaasFormData.address,
          addressNumber: asaasFormData.addressNumber,
          province: asaasFormData.province
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao criar carteira Asaas');
      }

      const account = await response.json();
      
      // Update in Firestore
      if (role === 'empresa' && empresa) {
        await updateEmpresa(empresa.id, {
          asaasWalletId: account.walletId,
          asaasApiKey: account.apiKey,
          cpfCnpj: asaasFormData.cpfCnpj,
          companyType: asaasFormData.companyType,
          postalCode: asaasFormData.postalCode,
          address: asaasFormData.address,
          addressNumber: asaasFormData.addressNumber,
          province: asaasFormData.province
        });
      } else if (role === 'profissional' && profissional) {
        await updateProfissional(profissional.id, {
          asaasWalletId: account.walletId,
          asaasApiKey: account.apiKey,
        });
      }

      setSuccess('Carteira Asaas criada com sucesso!');
      await refresh();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao criar carteira Asaas: ' + err.message);
    } finally {
      setIsCreatingAsaas(false);
    }
  };

  const handleFileUpload = async (type: string, file: File) => {
    if (!walletId) return;
    
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch(`/api/asaas/account/${walletId}/documents`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Erro ao enviar documento');
      }

      setSuccess('Documento enviado com sucesso!');
      fetchDocuments();
    } catch (err: any) {
      console.error(err);
      setError('Erro ao enviar documento: ' + err.message);
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

          {/* Create Asaas Wallet (If missing) */}
          {!walletId && (role === 'profissional' || role === 'empresa') && (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <CreditCard size={18} className="text-emerald-600" />
                  Criar Carteira Asaas
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-widest">Necessário para Receber Pagamentos Online</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">CPF ou CNPJ</label>
                    <input 
                      type="text" 
                      value={asaasFormData.cpfCnpj}
                      onChange={e => setAsaasFormData({ ...asaasFormData, cpfCnpj: e.target.value })}
                      placeholder="Somente números"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Tipo de Empresa</label>
                    <select 
                      value={asaasFormData.companyType}
                      onChange={e => setAsaasFormData({ ...asaasFormData, companyType: e.target.value as any })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      <option value="INDIVIDUAL">Pessoa Física / Autônomo</option>
                      <option value="MEI">MEI</option>
                      <option value="LIMITED">LTDA / EIRELI</option>
                      <option value="ASSOCIATION">Associação</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">CEP</label>
                    <input 
                      type="text" 
                      value={asaasFormData.postalCode}
                      onChange={e => setAsaasFormData({ ...asaasFormData, postalCode: e.target.value })}
                      placeholder="00000-000"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Endereço</label>
                    <input 
                      type="text" 
                      value={asaasFormData.address}
                      onChange={e => setAsaasFormData({ ...asaasFormData, address: e.target.value })}
                      placeholder="Rua, Avenida, etc."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Número</label>
                    <input 
                      type="text" 
                      value={asaasFormData.addressNumber}
                      onChange={e => setAsaasFormData({ ...asaasFormData, addressNumber: e.target.value })}
                      placeholder="123"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Bairro/Estado</label>
                    <input 
                      type="text" 
                      value={asaasFormData.province}
                      onChange={e => setAsaasFormData({ ...asaasFormData, province: e.target.value })}
                      placeholder="Ex: Centro"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleCreateAsaasWallet}
                  disabled={isCreatingAsaas}
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-4 rounded-2xl font-bold hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-lg shadow-emerald-500/20"
                >
                  {isCreatingAsaas ? <Loader2 className="animate-spin" size={20} /> : <Sparkles size={20} />}
                  Criar Minha Carteira Digital Asaas
                </button>
              </div>
            </div>
          )}
          {(role === 'profissional' || role === 'empresa') && (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Landmark size={18} className="text-blue-600" />
                  Dados Bancários para Recebimento
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-widest">Configuração de Saque</p>
              </div>
              <form onSubmit={handleUpdateBank} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Código do Banco (3 dígitos)</label>
                    <input 
                      type="text" 
                      value={bankData.bankCode}
                      onChange={e => setBankData({ ...bankData, bankCode: e.target.value })}
                      placeholder="Ex: 001, 237, 341"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Tipo de Conta</label>
                    <select 
                      value={bankData.bankAccountType}
                      onChange={e => setBankData({ ...bankData, bankAccountType: e.target.value as any })}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    >
                      <option value="CHECKING">Conta Corrente</option>
                      <option value="SAVINGS">Conta Poupança</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Agência</label>
                    <input 
                      type="text" 
                      value={bankData.agency}
                      onChange={e => setBankData({ ...bankData, agency: e.target.value })}
                      placeholder="0001"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Conta</label>
                    <input 
                      type="text" 
                      value={bankData.account}
                      onChange={e => setBankData({ ...bankData, account: e.target.value })}
                      placeholder="12345"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-zinc-700 ml-1">Dígito</label>
                    <input 
                      type="text" 
                      value={bankData.accountDigit}
                      onChange={e => setBankData({ ...bankData, accountDigit: e.target.value })}
                      placeholder="0"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                  <AlertCircle className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-blue-700 leading-relaxed">
                    A conta bancária deve ser de **mesma titularidade** do CPF/CNPJ cadastrado. 
                    O Asaas processa a verificação dos dados em até 2 dias úteis.
                  </p>
                </div>

                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-blue-700 transition-all disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                  Atualizar Dados Bancários
                </button>
              </form>
            </div>
          )}

          {/* KYC Documents */}
          {(role === 'profissional' || role === 'empresa') && (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <FileText size={18} className="text-purple-600" />
                  Verificação de Identidade (KYC)
                </h3>
                <p className="text-[10px] text-zinc-400 mt-1 uppercase font-black tracking-widest">Obrigatório para Saques</p>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Document Types */}
                  {[
                    { type: 'IDENTIFICATION', label: 'Documento de Identidade', desc: 'RG, CNH ou RNE (Frente e Verso)' },
                    { type: 'SOCIAL_CONSTITUTION', label: 'Contrato Social / MEI', desc: 'Apenas se for conta jurídica' }
                  ].map((docType) => {
                    const doc = documents.find(d => d.type === docType.type);
                    const status = doc?.status || 'NOT_SENT';
                    
                    return (
                      <div key={docType.type} className="p-4 rounded-2xl border border-zinc-100 bg-zinc-50 space-y-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-sm text-zinc-900">{docType.label}</h4>
                            <p className="text-xs text-zinc-500 mt-1">{docType.desc}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider ${
                            status === 'APPROVED' ? 'bg-emerald-100 text-emerald-700' :
                            status === 'AWAITING_APPROVAL' ? 'bg-amber-100 text-amber-700' :
                            status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                            'bg-zinc-200 text-zinc-600'
                          }`}>
                            {status === 'APPROVED' ? 'Aprovado' :
                             status === 'AWAITING_APPROVAL' ? 'Em Análise' :
                             status === 'REJECTED' ? 'Rejeitado' :
                             'Não Enviado'}
                          </span>
                        </div>

                        {status !== 'APPROVED' && status !== 'AWAITING_APPROVAL' && (
                          <div className="relative">
                            <input 
                              type="file" 
                              accept="image/*,application/pdf"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleFileUpload(docType.type, file);
                              }}
                              className="absolute inset-0 opacity-0 cursor-pointer"
                            />
                            <div className="flex items-center justify-center gap-2 py-3 border-2 border-dashed border-zinc-300 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all text-zinc-500 hover:text-purple-600">
                              <Upload size={16} />
                              <span className="text-xs font-bold">Selecionar Arquivo</span>
                            </div>
                          </div>
                        )}

                        {doc?.rejectReason && (
                          <p className="text-[10px] text-red-600 font-medium bg-red-50 p-2 rounded-lg border border-red-100">
                            Motivo da rejeição: {doc.rejectReason}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 flex items-start gap-3">
                  <AlertCircle className="text-purple-600 shrink-0 mt-0.5" size={18} />
                  <p className="text-xs text-purple-700 leading-relaxed">
                    Para sua segurança e conformidade com as normas do Banco Central, o Asaas exige a verificação de documentos. 
                    O prazo de análise é de até 3 dias úteis.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
