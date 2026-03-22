import { useState, useEffect, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, 
  Plus, 
  Trash2, 
  Calendar, 
  Users, 
  TrendingUp, 
  Megaphone,
  CheckCircle2,
  Clock,
  Tag,
  Percent,
  ChevronRight,
  X,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon } from '@/src/types/firebase';
import { cn } from '@/src/utils/cn';
import { getCoupons, createCoupon, deleteCoupon, updateCoupon, getMarketingStats } from '@/src/services/db';

export default function MarketingPage() {
  const { user, role, empresa } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState({ reach: 0, usage: 0, revenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    expiryDate: '',
    isActive: true
  });

  useEffect(() => {
    if (empresa?.id) {
      loadData();
    }
  }, [empresa?.id]);

  const loadData = async () => {
    if (!empresa?.id) return;
    setIsLoading(true);
    try {
      const [couponsData, statsData] = await Promise.all([
        getCoupons(empresa.id),
        getMarketingStats(empresa.id)
      ]);
      setCoupons(couponsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading marketing data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCoupon = async (e: FormEvent) => {
    e.preventDefault();
    if (!empresa?.id) return;
    
    setIsSubmitting(true);
    try {
      await createCoupon({
        empresaId: empresa.id,
        code: newCoupon.code.toUpperCase(),
        discount: Number(newCoupon.discount),
        type: newCoupon.type,
        expiryDate: new Date(newCoupon.expiryDate).getTime(),
        isActive: newCoupon.isActive
      });
      setIsModalOpen(false);
      setNewCoupon({ code: '', discount: 0, type: 'percentage', expiryDate: '', isActive: true });
      loadData();
    } catch (error) {
      console.error("Error creating coupon:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir este cupom?")) return;
    try {
      await deleteCoupon(id);
      loadData();
    } catch (error) {
      console.error("Error deleting coupon:", error);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateCoupon(id, { isActive: !currentStatus });
      loadData();
    } catch (error) {
      console.error("Error updating coupon status:", error);
    }
  };

  if (role !== 'empresa') {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Apenas administradores da clínica podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Marketing & Ofertas</h1>
            <p className="text-zinc-500 mt-1">Crie promoções e atraia mais clientes para sua clínica.</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
          >
            <Plus size={18} />
            Criar Nova Oferta
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : (
          <>
            {/* Marketing Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <StatCard 
                label="Alcance das Ofertas" 
                value={stats.reach.toLocaleString()} 
                subValue="Pessoas viram suas ofertas"
                icon={Megaphone}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <StatCard 
                label="Cupons Utilizados" 
                value={stats.usage.toString()} 
                subValue="Total de usos registrados"
                icon={Ticket}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <StatCard 
                label="Receita Gerada" 
                value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} 
                subValue="Através de promoções"
                icon={TrendingUp}
                color="text-purple-600"
                bg="bg-purple-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Coupons List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                    <h3 className="font-bold text-zinc-900">Cupons</h3>
                    <span className="text-xs text-zinc-400 font-medium uppercase tracking-widest">{coupons.length} cupons</span>
                  </div>
                  <div className="divide-y divide-zinc-100">
                    {coupons.length === 0 ? (
                      <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Ticket className="text-zinc-300" size={32} />
                        </div>
                        <p className="text-zinc-500">Nenhum cupom criado ainda.</p>
                      </div>
                    ) : (
                      coupons.map((coupon) => (
                        <div key={coupon.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "w-12 h-12 rounded-2xl flex items-center justify-center",
                              coupon.isActive ? "bg-emerald-50 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                            )}>
                              {coupon.type === 'percentage' ? <Percent size={24} /> : <Tag size={24} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-black text-zinc-900 tracking-tight">{coupon.code}</h4>
                                <span className={cn(
                                  "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                  coupon.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
                                )}>
                                  {coupon.isActive ? 'Ativo' : 'Inativo'}
                                </span>
                              </div>
                              <p className="text-sm text-zinc-500">
                                Desconto de {coupon.type === 'percentage' ? `${coupon.discount}%` : `R$ ${coupon.discount.toLocaleString('pt-BR')}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-8">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Usos</p>
                              <p className="font-bold text-zinc-900">{coupon.usageCount}</p>
                            </div>
                            <div className="text-right hidden sm:block">
                              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">Expira em</p>
                              <p className="text-sm font-medium text-zinc-600">{new Date(coupon.expiryDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleToggleStatus(coupon.id, coupon.isActive)}
                                className={cn(
                                  "p-2 rounded-xl transition-all",
                                  coupon.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"
                                )}
                                title={coupon.isActive ? "Desativar" : "Ativar"}
                              >
                                <CheckCircle2 size={18} />
                              </button>
                              <button 
                                onClick={() => handleDeleteCoupon(coupon.id)}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                title="Excluir"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Campaign Ideas */}
                <div className="bg-zinc-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full -mr-32 -mt-32" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Dica do Iris AI 🤖</h3>
                    <p className="text-zinc-400 mb-6 max-w-md">Identificamos que 15 clientes não retornam há mais de 45 dias. Que tal criar uma campanha de "Saudades" com 15% de desconto?</p>
                    <button className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                      Criar Campanha Agora
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar: Marketing Tips */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <Megaphone size={18} className="text-emerald-600" />
                    Dicas de Marketing
                  </h3>
                  <div className="space-y-4">
                    <MarketingTip 
                      title="Fidelização" 
                      description="Ofereça um desconto para clientes que agendarem o retorno no momento do checkout." 
                    />
                    <MarketingTip 
                      title="Horários Ociosos" 
                      description="Crie cupons válidos apenas para terças e quartas-feiras para preencher sua agenda." 
                    />
                    <MarketingTip 
                      title="Indicação" 
                      description="Dê um bônus para clientes que indicarem amigos. O boca a boca é sua melhor ferramenta." 
                    />
                  </div>
                </div>

                <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-600/20">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Plano Profissional
                  </h3>
                  <p className="text-sm text-emerald-100 mb-4">Você está aproveitando todas as ferramentas de marketing inclusas no seu plano.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 size={14} /> Cupons Ilimitados
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 size={14} /> Campanhas por WhatsApp
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 size={14} /> Relatórios de Conversão
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Coupon Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                <h3 className="text-xl font-bold text-zinc-900">Novo Cupom</h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-zinc-100 rounded-xl transition-all">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateCoupon} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Código do Cupom</label>
                  <input 
                    type="text"
                    required
                    placeholder="EX: VERAO2026"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all uppercase"
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Tipo</label>
                    <select 
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newCoupon.type}
                      onChange={(e) => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Valor</label>
                    <input 
                      type="number"
                      required
                      min="0"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newCoupon.discount}
                      onChange={(e) => setNewCoupon({ ...newCoupon, discount: Number(e.target.value) })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Data de Expiração</label>
                  <input 
                    type="date"
                    required
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    value={newCoupon.expiryDate}
                    onChange={(e) => setNewCoupon({ ...newCoupon, expiryDate: e.target.value })}
                  />
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                    Criar Cupom
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

function StatCard({ label, value, subValue, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", bg)}>
        <Icon size={24} className={color} />
      </div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{value}</h3>
      <p className="text-xs text-zinc-500 mt-1">{subValue}</p>
    </div>
  );
}

function MarketingTip({ title, description }: any) {
  return (
    <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 group hover:border-emerald-200 transition-all cursor-pointer">
      <div className="flex justify-between items-center mb-1">
        <h4 className="text-sm font-bold text-zinc-900">{title}</h4>
        <ChevronRight size={14} className="text-zinc-300 group-hover:text-emerald-500 transition-colors" />
      </div>
      <p className="text-xs text-zinc-500 leading-relaxed">{description}</p>
    </div>
  );
}
