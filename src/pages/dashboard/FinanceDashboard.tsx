import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight,
  Loader2,
  Download
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { auth } from '@/src/services/firebase';
import { getAllAgendamentos } from '@/src/services/db';
import { Agendamento } from '@/src/types/firebase';

import { useAuth } from '@/src/contexts/AuthContext';

export default function FinanceDashboard() {
  const { role } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        const data = await getAllAgendamentos(user.uid);
        setAgendamentos(data);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const stats = {
    totalRevenue: agendamentos.reduce((acc, curr) => acc + (curr.status === 'completed' || curr.status === 'confirmed' ? curr.totalPrice : 0), 0),
    totalAppointments: agendamentos.length,
    completedAppointments: agendamentos.filter(a => a.status === 'completed').length,
    averageTicket: agendamentos.length > 0 ? agendamentos.reduce((acc, curr) => acc + curr.totalPrice, 0) / agendamentos.length : 0
  };

  // Prepare chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayName = date.toLocaleDateString('pt-BR', { weekday: 'short' });
    
    const dayRevenue = agendamentos
      .filter(a => new Date(a.startTime).toDateString() === date.toDateString())
      .reduce((acc, curr) => acc + curr.totalPrice, 0);

    return { name: dayName, revenue: dayRevenue };
  });

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  if (role !== 'empresa' && role !== 'admin') {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Acesso Restrito</h1>
        <p className="text-zinc-500">Apenas proprietários de clínicas podem acessar o painel financeiro.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Financeiro</h1>
            <p className="text-zinc-500 text-sm">Acompanhe o desempenho da sua clínica.</p>
          </div>
          <button className="flex items-center gap-2 bg-white border border-zinc-200 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-all">
            <Download size={16} />
            Exportar Relatório
          </button>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard 
            label="Faturamento Total" 
            value={`R$ ${stats.totalRevenue.toLocaleString('pt-BR')}`} 
            icon={DollarSign} 
            trend="+12%" 
            trendUp={true} 
          />
          <StatCard 
            label="Agendamentos" 
            value={stats.totalAppointments.toString()} 
            icon={Calendar} 
            trend="+5%" 
            trendUp={true} 
          />
          <StatCard 
            label="Ticket Médio" 
            value={`R$ ${stats.averageTicket.toFixed(2)}`} 
            icon={TrendingUp} 
            trend="-2%" 
            trendUp={false} 
          />
          <StatCard 
            label="Clientes Atendidos" 
            value={stats.completedAppointments.toString()} 
            icon={Users} 
            trend="+18%" 
            trendUp={true} 
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-6">Faturamento nos últimos 7 dias</h3>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickFormatter={(value) => `R$ ${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Transactions placeholder */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-6">Recebimentos Recentes</h3>
            <div className="space-y-4">
              {agendamentos.slice(0, 5).map((ag) => (
                <div key={ag.id} className="flex items-center justify-between p-3 hover:bg-zinc-50 rounded-2xl transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                      {ag.clienteName[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900">{ag.clienteName}</p>
                      <p className="text-xs text-zinc-500">{new Date(ag.startTime).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-emerald-600">+ R$ {ag.totalPrice}</span>
                </div>
              ))}
              {agendamentos.length === 0 && (
                <p className="text-center text-zinc-500 py-8 text-sm">Nenhuma transação recente.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, trend, trendUp }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 rounded-xl">
          <Icon size={20} className="text-zinc-600" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg",
          trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-sm text-zinc-500 mb-1">{label}</p>
      <h4 className="text-2xl font-bold text-zinc-900">{value}</h4>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
