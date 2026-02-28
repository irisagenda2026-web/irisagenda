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
  Download,
  Eye,
  EyeOff,
  RefreshCcw,
  FileText,
  CreditCard
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
import { cn } from '@/src/utils/cn';
import { useAuth } from '@/src/contexts/AuthContext';

export default function FinanceDashboard() {
  const { role } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBalance, setShowBalance] = useState(true);

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
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Financeiro</h1>
            <p className="text-zinc-500 mt-1">Acompanhe o desempenho e recebimentos da sua clínica.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-all shadow-sm">
              <Download size={16} />
              Relatórios
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all shadow-lg">
              <CreditCard size={16} />
              Sacar Saldo
            </button>
          </div>
        </header>

        {/* Saldo Card (Next Go Style) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-1 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-3xl rounded-full -mr-8 -mt-8" />
            <div className="flex flex-col h-full justify-between">
              <div className="flex justify-between items-center mb-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Saldo disponível</p>
                <div className="flex gap-2">
                  <button 
                    onClick={() => setShowBalance(!showBalance)}
                    className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400 transition-colors"
                  >
                    {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
                  </button>
                  <button className="p-1.5 hover:bg-zinc-50 rounded-lg text-zinc-400 transition-colors">
                    <RefreshCcw size={16} />
                  </button>
                </div>
              </div>
              <div>
                <h2 className="text-3xl font-black text-zinc-900 tracking-tighter">
                  {showBalance ? `R$ ${stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : '••••••'}
                </h2>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full">Liberado para saque</span>
                </div>
              </div>
            </div>
          </div>

          <div className="md:col-span-2 grid grid-cols-2 gap-4">
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
          </div>
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

          {/* Recent Transactions (Next Go Style) */}
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <FileText size={18} className="text-emerald-600" />
                Vendas Recentes
              </h3>
              <button className="text-xs font-bold text-emerald-600 hover:underline">Ver todas</button>
            </div>
            <div className="space-y-3">
              {agendamentos.slice(0, 6).map((ag) => (
                <div key={ag.id} className="group p-4 hover:bg-zinc-50 border border-transparent hover:border-zinc-100 rounded-2xl transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                        {ag.clienteName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{ag.clienteName}</p>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                          {new Date(ag.startTime).toLocaleDateString('pt-BR')} • {new Date(ag.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-zinc-900">R$ {ag.totalPrice.toFixed(2)}</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">Confirmado</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-50 group-hover:border-zinc-100 transition-colors">
                    <span className="text-[10px] text-zinc-500 font-medium">Serviço:</span>
                    <span className="text-[10px] font-bold text-zinc-700">{ag.servicoName}</span>
                  </div>
                </div>
              ))}
              {agendamentos.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-3">
                    <FileText size={24} className="text-zinc-300" />
                  </div>
                  <p className="text-zinc-500 text-sm">Nenhuma transação recente.</p>
                </div>
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
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="p-2 bg-zinc-50 rounded-xl">
          <Icon size={20} className="text-zinc-600" />
        </div>
        <div className={cn(
          "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg",
          trendUp ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
        )}>
          {trendUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {trend}
        </div>
      </div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      <h4 className="text-2xl font-black text-zinc-900 tracking-tight">{value}</h4>
    </div>
  );
}
