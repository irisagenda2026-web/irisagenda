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
  Sparkles
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { createEmpresa, addServico, createAgendamento, getAllEmpresas, getAllUsers, getPlans, createPlan } from '../../services/db';
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
        getPlans()
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
                  <button className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all">
                    Criar Novo Plano
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {plans.map(plan => (
                    <div key={plan.id} className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="text-lg font-bold text-zinc-900">{plan.name}</h4>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">ATIVO</span>
                      </div>
                      <div className="text-2xl font-black text-zinc-900 mb-4">R$ {plan.price}/mês</div>
                      
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
                                    await updateDoc(doc(db, 'plans', plan.id), {
                                      'permissions.availablePaymentMethods': newMethods
                                    });
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
                        {plan.features.slice(0, 3).map((f, i) => (
                          <li key={i} className="text-xs text-zinc-500 flex items-center gap-2">
                            <CheckCircle2 size={12} className="text-emerald-500" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <button className="w-full py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all">
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
