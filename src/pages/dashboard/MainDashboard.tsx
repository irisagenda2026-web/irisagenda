import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, Users, Calendar, DollarSign, 
  ArrowUpRight, Clock, Plus, ChevronRight,
  TrendingUp, Star, MessageSquare
} from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { auth } from '@/src/services/firebase';
import { getAgendamentos, getServicos } from '@/src/services/db';
import { Agendamento, Servico } from '@/src/types/firebase';
import { Link } from 'react-router-dom';

export default function MainDashboard() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const tonight = new Date();
        tonight.setHours(23,59,59,999);

        const [agData, svData] = await Promise.all([
          getAgendamentos(user.uid, today.getTime(), tonight.getTime()),
          getServicos(user.uid)
        ]);
        setAgendamentos(agData);
        setServicos(svData);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const stats = [
    { label: 'Receita Hoje', value: `R$ ${agendamentos.reduce((acc, curr) => acc + curr.totalPrice, 0)}`, icon: DollarSign, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Agendamentos', value: agendamentos.length, icon: Calendar, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Novos Clientes', value: '12', icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Avaliação', value: '4.9', icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Olá, Lavínia! 👋</h1>
          <p className="text-zinc-500 mt-1">Aqui está o que está acontecendo na sua clínica hoje.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm"
            >
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{stat.label}</p>
              <h3 className="text-2xl font-black text-zinc-900 tracking-tight">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Today's Agenda */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                  <Clock size={18} className="text-emerald-600" />
                  Próximos Agendamentos
                </h3>
                <Link to="/dashboard/calendar" className="text-xs font-bold text-emerald-600 hover:underline flex items-center gap-1">
                  Ver agenda completa <ChevronRight size={14} />
                </Link>
              </div>
              <div className="p-2">
                {agendamentos.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-zinc-500 text-sm">Nenhum agendamento para hoje ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {agendamentos.slice(0, 5).map((ag) => (
                      <div key={ag.id} className="flex items-center justify-between p-4 hover:bg-zinc-50 rounded-2xl transition-all group">
                        <div className="flex items-center gap-4">
                          <div className="text-center min-w-[60px]">
                            <p className="text-sm font-black text-zinc-900">
                              {new Date(ag.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase">Hoje</p>
                          </div>
                          <div className="w-px h-8 bg-zinc-100" />
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{ag.clienteName}</p>
                            <p className="text-xs text-zinc-500">{ag.servicoName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Confirmado</span>
                          <ChevronRight size={16} className="text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link to="/dashboard/calendar" className="bg-emerald-600 p-6 rounded-3xl text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition-all group">
                <Plus size={24} className="mb-4 group-hover:scale-110 transition-transform" />
                <h4 className="font-bold text-lg">Novo Agendamento</h4>
                <p className="text-emerald-100 text-sm mt-1">Adicione um cliente manualmente à sua agenda.</p>
              </Link>
              <Link to="/dashboard/site" className="bg-zinc-900 p-6 rounded-3xl text-white shadow-lg hover:bg-zinc-800 transition-all group">
                <LayoutDashboard size={24} className="mb-4 group-hover:scale-110 transition-transform text-emerald-400" />
                <h4 className="font-bold text-lg">Editar Mini-site</h4>
                <p className="text-zinc-400 text-sm mt-1">Personalize sua página de reservas online.</p>
              </Link>
            </div>
          </div>

          {/* Sidebar: Insights & Tips */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <TrendingUp size={18} className="text-blue-600" />
                Insights da Semana
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                  <p className="text-xs font-bold text-blue-700 uppercase mb-1">Dica de Crescimento</p>
                  <p className="text-sm text-blue-900">Seus horários de **sexta-feira à tarde** estão 90% ocupados. Que tal abrir uma vaga extra?</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
                  <p className="text-xs font-bold text-purple-700 uppercase mb-1">Fidelização</p>
                  <p className="text-sm text-purple-900">**5 clientes** não retornam há mais de 30 dias. Envie um cupom de retorno!</p>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full" />
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Star size={18} className="text-amber-400" />
                Iris Club
              </h3>
              <p className="text-sm text-zinc-400 mb-6">Transforme suas indicações em dinheiro. Ganhe até **R$ 2.000** por mês.</p>
              <button className="w-full bg-white text-zinc-900 py-3 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all">
                Conhecer Next Club
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
