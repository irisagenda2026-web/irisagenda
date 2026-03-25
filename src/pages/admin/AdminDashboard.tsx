import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  Search, 
  Filter, 
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  Clock,
  Database,
  Loader2,
  Sparkles,
  X,
  Plus,
  Trash2
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { createEmpresa, addServico, createAgendamento, getAllEmpresas, getAllUsers, getPlans, getAllPlans, createPlan, updatePlan, deletePlan } from '../../services/db';
import { auth, db } from '../../services/firebase';
import { updateDoc, doc } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Empresa, User, Plan } from '../../types/firebase';
import Logo from '../../components/Logo';
import AdminSettings from './AdminSettings';

export default function AdminDashboard() {
  const [clinics, setClinics] = useState<Empresa[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeTab, setActiveTab] = useState<'clinics' | 'users' | 'plans' | 'settings'>('clinics');
  const [isLoading, setIsLoading] = useState(true);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [planToDelete, setPlanToDelete] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalClinics: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    newClinicsToday: 0
  });

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [clinicsData, usersData, plansData] = await Promise.all([
        getAllEmpresas(),
        getAllUsers(),
        getAllPlans()
      ]);

      if (plansData.length === 0) {
        // Auto-seed basic plans if none exist
        const defaultPlans = [
          {
            name: 'Essencial',
            price: 89,
            interval: 'monthly' as const,
            description: 'Perfeito para profissionais autônomos.',
            features: ['Agenda Online', 'Até 2 profissionais', 'Lembretes WhatsApp'],
            permissions: { 
              maxProfessionals: 2, 
              maxServices: 10,
              hasUpsells: false, 
              hasCoupons: false,
              hasReviews: true,
              hasCustomBranding: false, 
              hasNPS: false,
              hasMarketing: false,
              availablePaymentMethods: {
                pix: true,
                creditCard: true,
                onSite: true
              }
            },
            isActive: true,
            isHighlighted: false,
            trialDays: 15
          },
          {
            name: 'Profissional',
            price: 159,
            interval: 'monthly' as const,
            description: 'O melhor para clínicas em crescimento.',
            features: ['Tudo do Essencial', 'Agendamentos ilimitados', 'Gestão Financeira'],
            permissions: { 
              maxProfessionals: 10, 
              maxServices: 50,
              hasUpsells: true, 
              hasCoupons: true,
              hasReviews: true,
              hasCustomBranding: true, 
              hasNPS: true,
              hasMarketing: true,
              availablePaymentMethods: {
                pix: true,
                creditCard: true,
                onSite: true
              }
            },
            isActive: true,
            isHighlighted: true,
            trialDays: 15
          },
          {
            name: 'Enterprise',
            price: 499,
            interval: 'monthly' as const,
            description: 'Para redes e grandes centros de estética.',
            features: ['Tudo do Profissional', 'Multi-unidades (Franquias)', 'Relatórios customizados', 'Gerente de conta dedicado'],
            permissions: { 
              maxProfessionals: 100, 
              maxServices: 500,
              hasUpsells: true, 
              hasCoupons: true,
              hasReviews: true,
              hasCustomBranding: true, 
              hasNPS: true,
              hasMarketing: true,
              availablePaymentMethods: {
                pix: true,
                creditCard: true,
                onSite: true
              }
            },
            isActive: true,
            isHighlighted: false,
            trialDays: 15
          }
        ];
        for (const p of defaultPlans) {
          await createPlan(p);
        }
        fetchData(); // Refresh
        return;
      }

      // Transform data for the table
      const formattedClinics = clinicsData.map(emp => ({
        ...emp,
        owner: 'Dono (ID: ' + emp.ownerId.slice(0, 4) + ')',
        status: emp.subscription?.status || 'active',
        revenue: plansData.find(p => p.id === emp.planId)?.price || 0,
        joined: new Date(emp.createdAt).toLocaleDateString('pt-BR')
      }));
      setClinics(formattedClinics as any);
      setUsers(usersData);
      setPlans(plansData);
      
      setStats({
        totalClinics: clinicsData.length,
        activeSubscriptions: clinicsData.filter(c => c.subscription?.status === 'active').length,
        monthlyRevenue: clinicsData.reduce((acc, c) => {
          const plan = plansData.find(p => p.id === c.planId);
          return acc + (plan?.price || 0);
        }, 0),
        newClinicsToday: clinicsData.filter(c => new Date(c.createdAt).toDateString() === new Date().toDateString()).length
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSeedDefaults = async () => {
    if (!confirm('Isso irá adicionar os planos padrão (Essencial, Profissional, Enterprise) se eles não existirem. Continuar?')) return;
    
    try {
      const defaultPlans = [
        {
          name: 'Essencial',
          price: 89,
          interval: 'monthly' as const,
          description: 'Perfeito para profissionais autônomos.',
          features: ['Agenda Online Inteligente', 'Até 2 profissionais', 'Lembretes via WhatsApp'],
          permissions: { 
            maxProfessionals: 2, 
            maxServices: 10,
            hasUpsells: false, 
            hasCoupons: false,
            hasReviews: true,
            hasCustomBranding: false, 
            hasNPS: false,
            hasMarketing: false,
            availablePaymentMethods: {
              pix: true,
              creditCard: true,
              onSite: true
            }
          },
          isActive: true,
          isHighlighted: false,
          trialDays: 15
        },
        {
          name: 'Profissional',
          price: 159,
          interval: 'monthly' as const,
          description: 'O melhor para clínicas em crescimento.',
          features: ['Tudo do Essencial', 'Agendamentos ilimitados', 'Gestão Financeira'],
          permissions: { 
            maxProfessionals: 10, 
            maxServices: 50,
            hasUpsells: true, 
            hasCoupons: true,
            hasReviews: true,
            hasCustomBranding: true, 
            hasNPS: true,
            hasMarketing: true,
            availablePaymentMethods: {
              pix: true,
              creditCard: true,
              onSite: true
            }
          },
          isActive: true,
          isHighlighted: true,
          trialDays: 15
        },
        {
          name: 'Enterprise',
          price: 499,
          interval: 'monthly' as const,
          description: 'Para redes e grandes centros de estética.',
          features: ['Tudo do Profissional', 'Multi-unidades (Franquias)', 'Relatórios customizados', 'Gerente de conta dedicado'],
          permissions: { 
            maxProfessionals: 100, 
            maxServices: 500,
            hasUpsells: true, 
            hasCoupons: true,
            hasReviews: true,
            hasCustomBranding: true, 
            hasNPS: true,
            hasMarketing: true,
            availablePaymentMethods: {
              pix: true,
              creditCard: true,
              onSite: true
            }
          },
          isActive: true,
          isHighlighted: false,
          trialDays: 15
        }
      ];

      for (const p of defaultPlans) {
        const exists = plans.some(existing => existing.name === p.name);
        if (!exists) {
          await createPlan(p as any);
        }
      }
      
      toast.success('Planos padrão adicionados!');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao semear planos');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Painel da Plataforma</h1>
            <p className="text-zinc-500 text-sm">Visão geral do ecossistema Iris Agenda.</p>
          </div>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <AdminStatCard label="Total de Clínicas" value={stats.totalClinics} icon={Building2} trend="+12% este mês" />
          <AdminStatCard label="Assinaturas Ativas" value={stats.activeSubscriptions} icon={CheckCircle2} trend="+8% este mês" />
          <AdminStatCard label="MRR (Faturamento)" value={`R$ ${stats.monthlyRevenue.toLocaleString()}`} icon={CreditCard} trend="+15% este mês" />
          <AdminStatCard label="Novas Hoje" value={stats.newClinicsToday} icon={TrendingUp} trend="Acima da média" />
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex gap-4">
              <button 
                onClick={() => setActiveTab('clinics')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'clinics' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                Clínicas
              </button>
              <button 
                onClick={() => setActiveTab('users')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'users' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                Usuários
              </button>
              <button 
                onClick={() => setActiveTab('plans')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'plans' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                Planos
              </button>
              <button 
                onClick={() => setActiveTab('settings')}
                className={cn(
                  "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'settings' ? "bg-zinc-900 text-white" : "text-zinc-500 hover:bg-zinc-100"
                )}
              >
                Configurações da Plataforma
              </button>
            </div>

            {activeTab !== 'settings' && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                  <input 
                    type="text" 
                    placeholder={activeTab === 'clinics' ? "Buscar clínica..." : "Buscar usuário..."}
                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="overflow-x-auto">
            {activeTab === 'settings' ? (
              <AdminSettings />
            ) : activeTab === 'plans' ? (
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold text-zinc-900">Gerenciar Planos</h3>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={handleSeedDefaults}
                      className="px-4 py-2 bg-zinc-100 text-zinc-600 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
                    >
                      Resetar Padrões
                    </button>
                    <button 
                      onClick={() => {
                        setEditingPlan(null);
                        setIsPlanModalOpen(true);
                      }}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Criar Novo Plano
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map(plan => (
                    <div key={plan.id} className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 relative group">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-zinc-900">{plan.name}</h4>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-xs font-bold px-2 py-1 rounded-lg",
                            plan.isActive ? "text-emerald-600 bg-emerald-50" : "text-zinc-400 bg-zinc-100"
                          )}>
                            {plan.isActive ? 'ATIVO' : 'INATIVO'}
                          </span>
                          <button 
                            onClick={() => setPlanToDelete(plan.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {planToDelete === plan.id && (
                        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6 text-center">
                          <AlertCircle className="text-red-500 mb-2" size={32} />
                          <h5 className="font-bold text-zinc-900 mb-1">Excluir Plano?</h5>
                          <p className="text-xs text-zinc-500 mb-4">Esta ação não pode ser desfeita.</p>
                          <div className="flex gap-2 w-full">
                            <button 
                              onClick={() => setPlanToDelete(null)}
                              className="flex-1 py-2 bg-zinc-100 text-zinc-600 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all"
                            >
                              Cancelar
                            </button>
                            <button 
                              onClick={async () => {
                                try {
                                  await deletePlan(plan.id);
                                  toast.success('Plano excluído');
                                  setPlanToDelete(null);
                                  fetchData();
                                } catch (err) {
                                  toast.error('Erro ao excluir plano');
                                }
                              }}
                              className="flex-1 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700 transition-all"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="text-2xl font-black text-zinc-900 mb-4">R$ {plan.price}/{plan.interval === 'monthly' ? 'mês' : 'ano'}</div>
                      
                      <div className="mb-6">
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-3">Métodos Disponíveis</p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            { id: 'pix', label: 'PIX' },
                            { id: 'creditCard', label: 'Cartão' },
                            { id: 'onSite', label: 'No Local' }
                          ].map(m => {
                            const isAvailable = (plan.permissions.availablePaymentMethods as any)?.[m.id];
                            return (
                              <button 
                                key={m.id} 
                                onClick={async () => {
                                  try {
                                    const newMethods = {
                                      ...(plan.permissions.availablePaymentMethods || {}),
                                      [m.id]: !isAvailable
                                    };
                                    await updatePlan(plan.id, {
                                      'permissions.availablePaymentMethods': newMethods
                                    } as any);
                                    setPlans(prev => prev.map(p => p.id === plan.id ? {
                                      ...p,
                                      permissions: { ...p.permissions, availablePaymentMethods: newMethods }
                                    } : p));
                                    toast.success(`Método ${m.label} atualizado no plano ${plan.name}`);
                                  } catch (err) {
                                    console.error(err);
                                    toast.error('Erro ao atualizar plano');
                                  }
                                }}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1.5 border transition-all",
                                  isAvailable 
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                                    : "bg-zinc-100 text-zinc-400 border-zinc-200 opacity-50"
                                )}
                              >
                                {isAvailable ? <CheckCircle2 size={10} /> : <AlertCircle size={10} />}
                                {m.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <ul className="space-y-2 mb-6">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button 
                        onClick={() => {
                          setEditingPlan(plan);
                          setIsPlanModalOpen(true);
                        }}
                        className="w-full py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all"
                      >
                        Editar Plano
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : activeTab === 'clinics' ? (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50/50">
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Clínica</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Responsável</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Plano</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Faturamento</th>
                    <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {clinics.map((clinic) => (
                    <tr key={clinic.id} className="hover:bg-zinc-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                            {clinic.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{clinic.name}</p>
                            <p className="text-xs text-zinc-500">Desde {clinic.joined}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-zinc-600">{clinic.owner}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
                          clinic.plan === 'enterprise' ? "bg-purple-100 text-purple-700" :
                          clinic.plan === 'profissional' ? "bg-blue-100 text-blue-700" : "bg-zinc-100 text-zinc-700"
                        )}>
                          {clinic.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {clinic.status === 'active' ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                              Ativo
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold">
                              <Clock size={12} />
                              Pendente
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-zinc-900">R$ {clinic.revenue.toLocaleString()}</td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-0">
                <div className="bg-blue-50 p-4 border-b border-blue-100 text-blue-800 text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Por segurança, as senhas dos usuários são criptografadas e não podem ser visualizadas.
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50/50">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Nome</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">Função (Role)</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-400 uppercase tracking-wider">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-bold text-zinc-900">{user.name}</td>
                        <td className="px-6 py-4 text-sm text-zinc-600">{user.email}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-zinc-100 rounded-lg text-xs font-medium uppercase text-zinc-600">
                            {user.role}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs font-mono text-zinc-400">{user.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {isPlanModalOpen && (
        <PlanModal 
          plan={editingPlan} 
          onClose={() => setIsPlanModalOpen(false)} 
          onSave={() => {
            setIsPlanModalOpen(false);
            fetchData();
          }} 
        />
      )}
    </div>
  );
}

function PlanModal({ plan, onClose, onSave }: { plan: Plan | null, onClose: () => void, onSave: () => void }) {
  const [formData, setFormData] = useState<Partial<Plan>>(plan || {
    name: '',
    description: '',
    price: 0,
    interval: 'monthly',
    features: [],
    permissions: {
      maxProfessionals: 2,
      maxServices: 10,
      hasUpsells: false,
      hasCoupons: false,
      hasReviews: true,
      hasCustomBranding: false,
      hasNPS: false,
      hasMarketing: false,
      availablePaymentMethods: {
        pix: true,
        creditCard: true,
        onSite: true
      }
    },
    isActive: true,
    isHighlighted: false,
    trialDays: 15
  });
  const [newFeature, setNewFeature] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (plan) {
        await updatePlan(plan.id, formData);
        toast.success('Plano atualizado com sucesso!');
      } else {
        await createPlan(formData as any);
        toast.success('Plano criado com sucesso!');
      }
      onSave();
    } catch (err) {
      console.error(err);
      toast.error('Erro ao salvar plano');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-zinc-900">{plan ? 'Editar Plano' : 'Novo Plano'}</h3>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Nome do Plano</label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Preço (R$)</label>
                <input 
                  type="number" 
                  required
                  value={formData.price}
                  onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Intervalo</label>
                <select 
                  value={formData.interval}
                  onChange={e => setFormData({ ...formData, interval: e.target.value as any })}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="monthly">Mensal</option>
                  <option value="yearly">Anual</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Dias de Trial</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  value={formData.trialDays}
                  onChange={e => setFormData({ ...formData, trialDays: Number(e.target.value) })}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Descrição</label>
                <textarea 
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Funcionalidades</label>
                <div className="flex gap-2 mb-2">
                  <input 
                    type="text" 
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    placeholder="Adicionar feature..."
                    className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button 
                    type="button"
                    onClick={() => {
                      if (newFeature.trim()) {
                        setFormData({ ...formData, features: [...(formData.features || []), newFeature.trim()] });
                        setNewFeature('');
                      }
                    }}
                    className="p-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700"
                  >
                    <Plus size={20} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.features?.map((f, i) => (
                    <span key={i} className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 text-zinc-600 rounded-lg text-xs font-medium">
                      {f}
                      <button 
                        type="button"
                        onClick={() => setFormData({ ...formData, features: formData.features?.filter((_, index) => index !== i) })}
                        className="hover:text-red-500"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-zinc-100 pt-6">
            <h4 className="text-sm font-bold text-zinc-900 mb-4">Permissões e Limites</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Máx. Profissionais</label>
                  <input 
                    type="number" 
                    value={formData.permissions?.maxProfessionals}
                    onChange={e => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions!, maxProfessionals: Number(e.target.value) } 
                    })}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-zinc-500 uppercase mb-1.5">Máx. Serviços</label>
                  <input 
                    type="number" 
                    value={formData.permissions?.maxServices}
                    onChange={e => setFormData({ 
                      ...formData, 
                      permissions: { ...formData.permissions!, maxServices: Number(e.target.value) } 
                    })}
                    className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { id: 'hasUpsells', label: 'Upsells' },
                  { id: 'hasCoupons', label: 'Cupons' },
                  { id: 'hasReviews', label: 'Avaliações' },
                  { id: 'hasCustomBranding', label: 'Branding' },
                  { id: 'hasNPS', label: 'NPS' },
                  { id: 'hasMarketing', label: 'Marketing' }
                ].map(p => (
                  <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={(formData.permissions as any)?.[p.id]}
                      onChange={e => setFormData({
                        ...formData,
                        permissions: { ...formData.permissions!, [p.id]: e.target.checked }
                      })}
                      className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-zinc-600 group-hover:text-zinc-900">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.isActive}
                onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-zinc-900">Plano Ativo</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox"
                checked={formData.isHighlighted}
                onChange={e => setFormData({ ...formData, isHighlighted: e.target.checked })}
                className="w-4 h-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-bold text-zinc-900">Destacar Plano (Recomendado)</span>
            </label>
          </div>
        </form>

        <div className="p-6 border-t border-zinc-100 flex justify-end gap-3">
          <button 
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-sm font-bold text-zinc-500 hover:bg-zinc-50 rounded-xl transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSubmit}
            disabled={isSaving}
            className="bg-emerald-600 text-white px-8 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isSaving && <Loader2 className="animate-spin" size={16} />}
            {plan ? 'Salvar Alterações' : 'Criar Plano'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function AdminStatCard({ label, value, icon: Icon, trend }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center mb-4 text-zinc-600">
        <Icon size={24} />
      </div>
      <p className="text-sm text-zinc-500 mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-zinc-900 mb-2">{value}</h4>
      <p className="text-xs text-emerald-600 font-bold">{trend}</p>
    </div>
  );
}
