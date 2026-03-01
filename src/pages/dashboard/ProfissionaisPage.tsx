import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  AlertCircle,
  X,
  ShieldCheck,
  UserPlus,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getProfissionais, addProfissional, updateProfissional, deleteProfissional, getEmpresa } from '../../services/db';
import { Profissional, Empresa } from '../../types/firebase';
import { PLAN_LIMITS } from '../../constants';
import { cn } from '../../utils/cn';

export default function ProfissionaisPage() {
  const { user } = useAuth();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfissional, setEditingProfissional] = useState<Profissional | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    isActive: true
  });
  const [isSaving, setIsSaving] = useState(false);

  const planLimit = empresa ? PLAN_LIMITS[empresa.plan]?.maxProfessionals || 1 : 1;
  const isAtLimit = profissionais.length >= planLimit;

  useEffect(() => {
    if (user?.empresaId) {
      loadData();
    }
  }, [user?.empresaId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [profsData, empresaData] = await Promise.all([
        getProfissionais(user!.empresaId!),
        getEmpresa(user!.empresaId!)
      ]);
      setProfissionais(profsData);
      setEmpresa(empresaData);
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.empresaId) {
      alert('Erro: ID da empresa não encontrado. Tente sair e entrar novamente.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingProfissional) {
        await updateProfissional(editingProfissional.id, formData);
      } else {
        if (isAtLimit) {
          alert(`Seu plano ${empresa?.plan.toUpperCase()} permite apenas ${planLimit} profissional(is). Faça upgrade para adicionar mais.`);
          setIsSaving(false);
          return;
        }
        await addProfissional({
          empresaId: user.empresaId,
          ...formData,
          createdAt: Date.now()
        });
      }
      setIsModalOpen(false);
      setEditingProfissional(null);
      setFormData({ 
        name: '', 
        email: '', 
        phone: '', 
        bio: '', 
        isActive: true
      });
      loadData();
    } catch (error) {
      console.error('Erro ao salvar profissional:', error);
      alert('Erro ao salvar profissional. Verifique os campos e tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este profissional?')) {
      try {
        await deleteProfissional(id);
        loadData();
      } catch (error) {
        console.error('Erro ao excluir profissional:', error);
      }
    }
  };

  const filteredProfissionais = profissionais.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto pb-24 md:pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-emerald-600" />
            Gestão de Profissionais
          </h1>
          <p className="text-gray-500 mt-1">
            Gerencie sua equipe e limites do plano {empresa?.plan.toUpperCase()}
          </p>
        </div>

        <button
          onClick={() => {
            setEditingProfissional(null);
            setFormData({ 
              name: '', 
              email: '', 
              phone: '', 
              bio: '', 
              isActive: true
            });
            setIsModalOpen(true);
          }}
          disabled={isAtLimit && !editingProfissional}
          className={cn(
            "flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-medium transition-all",
            isAtLimit && !editingProfissional
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm"
          )}
        >
          <UserPlus className="w-5 h-5" />
          Novo Profissional
        </button>
      </div>

      {/* Plan Status Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Status do Plano: {empresa?.plan.toUpperCase()}</h3>
            <p className="text-sm text-gray-500">
              Você está usando {profissionais.length} de {planLimit} profissionais permitidos.
            </p>
          </div>
        </div>
        
        {isAtLimit && (
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg text-sm font-medium border border-amber-100">
            <AlertCircle className="w-4 h-4" />
            Limite atingido. Faça upgrade para adicionar mais profissionais.
          </div>
        )}
      </div>

      {/* Search and Filters */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar profissional por nome ou e-mail..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredProfissionais.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfissionais.map((prof) => (
            <motion.div
              key={prof.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-xl border-2 border-white shadow-sm">
                    {prof.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
                      {prof.name}
                    </h3>
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      prof.isActive ? "bg-emerald-50 text-emerald-600" : "bg-gray-100 text-gray-500"
                    )}>
                      {prof.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditingProfissional(prof);
                      setFormData({
                        name: prof.name,
                        email: prof.email || '',
                        phone: prof.phone || '',
                        bio: prof.bio || '',
                        isActive: prof.isActive
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(prof.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-600">
                {prof.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-gray-400" />
                    {prof.email}
                  </div>
                )}
                {prof.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-gray-400" />
                    {prof.phone}
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between">
                <div className="text-xs text-gray-400">
                  Cadastrado em {new Date(prof.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                  <CheckCircle2 className="w-3 h-3" />
                  Verificado
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-200">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-10 h-10 text-gray-300" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Nenhum profissional encontrado</h3>
          <p className="text-gray-500 mt-1 max-w-xs mx-auto">
            {searchTerm ? 'Tente mudar os termos da busca.' : 'Comece adicionando seu primeiro membro da equipe.'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-6 text-emerald-600 font-medium hover:underline"
            >
              Adicionar profissional agora
            </button>
          )}
        </div>
      )}

      {/* Modal de Cadastro/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-emerald-600 text-white">
                <h2 className="text-xl font-bold">
                  {editingProfissional ? 'Editar Profissional' : 'Novo Profissional'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input
                    required
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="Ex: João Silva"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="joao@exemplo.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio / Especialidades</label>
                  <textarea
                    rows={3}
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none resize-none"
                    placeholder="Breve descrição do profissional..."
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-sm text-gray-700">Profissional Ativo</label>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSaving ? 'Salvando...' : (editingProfissional ? 'Salvar Alterações' : 'Cadastrar')}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
