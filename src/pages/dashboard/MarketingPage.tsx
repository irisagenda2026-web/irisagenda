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
  Loader2,
  Zap,
  Sparkles,
  ArrowRight,
  ShoppingBag
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Coupon, Upsell, Servico } from '@/src/types/firebase';
import { cn } from '@/src/utils/cn';
import { 
  getCoupons, createCoupon, deleteCoupon, updateCoupon, 
  getMarketingStats, getUpsells, createUpsell, deleteUpsell, 
  updateUpsell, getServicos 
} from '@/src/services/db';

export default function MarketingPage() {
  const { user, role, empresa } = useAuth();
  const [activeTab, setActiveTab] = useState<'coupons' | 'upsells'>('coupons');
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [upsells, setUpsells] = useState<Upsell[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [stats, setStats] = useState({ reach: 0, usage: 0, revenue: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUpsellModalOpen, setIsUpsellModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New Coupon Form State
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    discount: 0,
    type: 'percentage' as 'percentage' | 'fixed',
    expiryDate: '',
    isActive: true
  });

  // New Upsell Form State
  const [newUpsell, setNewUpsell] = useState({
    title: '',
    description: '',
    triggerServiceIds: [] as string[],
    addonServiceId: '',
    discountPrice: undefined as number | undefined,
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
      const [couponsData, upsellsData, servicosData, statsData] = await Promise.all([
        getCoupons(empresa.id),
        getUpsells(empresa.id),
        getServicos(empresa.id),
        getMarketingStats(empresa.id)
      ]);
      setCoupons(couponsData);
      setUpsells(upsellsData);
      setServicos(servicosData);
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
        code: (newCoupon.code || '').toUpperCase(),
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

  const handleCreateUpsell = async (e: FormEvent) => {
    e.preventDefault();
    if (!empresa?.id) return;
    if (newUpsell.triggerServiceIds.length === 0 || !newUpsell.addonServiceId) {
      alert("Selecione pelo menos um serviço gatilho e um serviço de oferta.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      await createUpsell({
        empresaId: empresa.id,
        title: newUpsell.title,
        description: newUpsell.description,
        triggerServiceIds: newUpsell.triggerServiceIds,
        addonServiceId: newUpsell.addonServiceId,
        discountPrice: newUpsell.discountPrice ? Number(newUpsell.discountPrice) : undefined,
        isActive: newUpsell.isActive
      });
      setIsUpsellModalOpen(false);
      setNewUpsell({ title: '', description: '', triggerServiceIds: [], addonServiceId: '', discountPrice: undefined, isActive: true });
      loadData();
    } catch (error) {
      console.error("Error creating upsell:", error);
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

  const handleDeleteUpsell = async (id: string) => {
    if (!window.confirm("Tem certeza que deseja excluir esta oferta de upsell?")) return;
    try {
      await deleteUpsell(id);
      loadData();
    } catch (error) {
      console.error("Error deleting upsell:", error);
    }
  };

  const handleToggleCouponStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateCoupon(id, { isActive: !currentStatus });
      loadData();
    } catch (error) {
      console.error("Error updating coupon status:", error);
    }
  };

  const handleToggleUpsellStatus = async (id: string, currentStatus: boolean) => {
    try {
      await updateUpsell(id, { isActive: !currentStatus });
      loadData();
    } catch (error) {
      console.error("Error updating upsell status:", error);
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
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Marketing & Vendas</h1>
            <p className="text-zinc-500 mt-1">Estratégias visionárias para aumentar seu faturamento.</p>
          </div>
          <div className="flex gap-2">
            {activeTab === 'coupons' ? (
              <button 
                onClick={() => setIsModalOpen(true)}
                className="bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/20"
              >
                <Plus size={18} />
                Novo Cupom
              </button>
            ) : (
              <button 
                onClick={() => setIsUpsellModalOpen(true)}
                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Zap size={18} />
                Nova Estratégia Upsell
              </button>
            )}
          </div>
        </header>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-zinc-200">
          <button 
            onClick={() => setActiveTab('coupons')}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-all relative",
              activeTab === 'coupons' ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            Cupons de Desconto
            {activeTab === 'coupons' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-900 rounded-full" />}
          </button>
          <button 
            onClick={() => setActiveTab('upsells')}
            className={cn(
              "pb-4 px-2 text-sm font-bold transition-all relative flex items-center gap-2",
              activeTab === 'upsells' ? "text-emerald-600" : "text-zinc-400 hover:text-zinc-600"
            )}
          >
            Upsell & Add-ons
            <span className="bg-emerald-100 text-emerald-600 text-[10px] px-1.5 py-0.5 rounded-full uppercase">Novo</span>
            {activeTab === 'upsells' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-600 rounded-full" />}
          </button>
        </div>

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
                label="Conversão de Vendas" 
                value={stats.usage.toString()} 
                subValue="Ações de marketing concluídas"
                icon={ShoppingBag}
                color="text-emerald-600"
                bg="bg-emerald-50"
              />
              <StatCard 
                label="Receita Incremental" 
                value={`R$ ${stats.revenue.toLocaleString('pt-BR')}`} 
                subValue="Faturamento extra gerado"
                icon={TrendingUp}
                color="text-purple-600"
                bg="bg-purple-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                {activeTab === 'coupons' ? (
                  <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                      <h3 className="font-bold text-zinc-900">Cupons Ativos</h3>
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
                              <div className="flex items-center gap-2">
                                <button 
                                  onClick={() => handleToggleCouponStatus(coupon.id, coupon.isActive)}
                                  className={cn(
                                    "p-2 rounded-xl transition-all",
                                    coupon.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"
                                  )}
                                >
                                  <CheckCircle2 size={18} />
                                </button>
                                <button 
                                  onClick={() => handleDeleteCoupon(coupon.id)}
                                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                >
                                  <Trash2 size={18} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-zinc-100 flex justify-between items-center">
                      <h3 className="font-bold text-zinc-900">Estratégias de Upsell</h3>
                      <span className="text-xs text-zinc-400 font-medium uppercase tracking-widest">{upsells.length} ativas</span>
                    </div>
                    <div className="divide-y divide-zinc-100">
                      {upsells.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Zap className="text-emerald-300" size={32} />
                          </div>
                          <p className="text-zinc-500">Nenhuma estratégia de upsell configurada.</p>
                          <p className="text-xs text-zinc-400 mt-2">Upsells aumentam o ticket médio em até 30%.</p>
                        </div>
                      ) : (
                        upsells.map((upsell) => {
                          const addonService = servicos.find(s => s.id === upsell.addonServiceId);
                          return (
                            <div key={upsell.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-zinc-50 transition-colors">
                              <div className="flex items-center gap-4">
                                <div className={cn(
                                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                                  upsell.isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20" : "bg-zinc-100 text-zinc-400"
                                )}>
                                  <Sparkles size={24} />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-black text-zinc-900 tracking-tight">{upsell.title}</h4>
                                    <span className={cn(
                                      "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                                      upsell.isActive ? "bg-emerald-100 text-emerald-700" : "bg-zinc-200 text-zinc-600"
                                    )}>
                                      {upsell.isActive ? 'Ativo' : 'Inativo'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs text-zinc-500 mt-0.5">
                                    <span>{upsell.triggerServiceIds.length} gatilhos</span>
                                    <ArrowRight size={10} />
                                    <span className="font-bold text-emerald-600">{addonService?.name || 'Serviço removido'}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4">
                                {upsell.discountPrice && (
                                  <div className="text-right hidden sm:block">
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-0.5">Preço Especial</p>
                                    <p className="font-bold text-emerald-600">R$ {upsell.discountPrice.toLocaleString('pt-BR')}</p>
                                  </div>
                                )}
                                <div className="flex items-center gap-2">
                                  <button 
                                    onClick={() => handleToggleUpsellStatus(upsell.id, upsell.isActive)}
                                    className={cn(
                                      "p-2 rounded-xl transition-all",
                                      upsell.isActive ? "text-emerald-600 hover:bg-emerald-50" : "text-zinc-400 hover:bg-zinc-100"
                                    )}
                                  >
                                    <CheckCircle2 size={18} />
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUpsell(upsell.id)}
                                    className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}

                {/* Campaign Ideas */}
                <div className="bg-zinc-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 blur-[80px] rounded-full -mr-32 -mt-32" />
                  <div className="relative z-10">
                    <h3 className="text-2xl font-bold mb-2">Dica do Iris AI 🤖</h3>
                    <p className="text-zinc-400 mb-6 max-w-md">Identificamos que clientes que fazem **Limpeza de Pele** têm 60% mais chance de adicionar uma **Massagem Facial** se oferecida com 20% de desconto.</p>
                    <button 
                      onClick={() => {
                        setActiveTab('upsells');
                        setIsUpsellModalOpen(true);
                      }}
                      className="bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                    >
                      Implementar Upsell Sugerido
                    </button>
                  </div>
                </div>
              </div>

              {/* Sidebar: Marketing Tips */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <h3 className="font-bold text-zinc-900 mb-4 flex items-center gap-2">
                    <Megaphone size={18} className="text-emerald-600" />
                    Estratégias Visionárias
                  </h3>
                  <div className="space-y-4">
                    <MarketingTip 
                      title="Upsell no Checkout" 
                      description="Ofereça um serviço complementar rápido no momento que o cliente está finalizando a reserva." 
                    />
                    <MarketingTip 
                      title="Ancoragem de Preço" 
                      description="Mostre o valor original do add-on e o valor especial de upsell para criar percepção de vantagem." 
                    />
                    <MarketingTip 
                      title="Escassez & Urgência" 
                      description="Use frases como 'Oferta exclusiva para este agendamento' para aumentar a conversão." 
                    />
                  </div>
                </div>

                <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 rounded-3xl text-white shadow-xl shadow-emerald-600/20">
                  <h3 className="font-bold mb-2 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Faturamento Inteligente
                  </h3>
                  <p className="text-sm text-emerald-100 mb-4">O sistema de Upsell do Iris utiliza gatilhos comportamentais para sugerir o serviço certo na hora certa.</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 size={14} /> Sugestões Inteligentes
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 size={14} /> Add-ons com 1 Clique
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <CheckCircle2 size={14} /> Dashboard de Receita Extra
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

      {/* Create Upsell Modal */}
      <AnimatePresence>
        {isUpsellModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUpsellModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex justify-between items-center bg-emerald-600 text-white">
                <div>
                  <h3 className="text-2xl font-bold">Estratégia de Upsell</h3>
                  <p className="text-emerald-100 text-sm">Configure como e quando oferecer serviços extras.</p>
                </div>
                <button onClick={() => setIsUpsellModalOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateUpsell} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Título da Oferta (Chamativo)</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ex: Que tal completar sua experiência?"
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      value={newUpsell.title}
                      onChange={(e) => setNewUpsell({ ...newUpsell, title: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Descrição Persuasiva</label>
                    <textarea 
                      required
                      placeholder="Explique por que o cliente deve adicionar este serviço..."
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all h-24 resize-none"
                      value={newUpsell.description}
                      onChange={(e) => setNewUpsell({ ...newUpsell, description: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Serviço de Oferta (Add-on)</label>
                      <select 
                        required
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={newUpsell.addonServiceId}
                        onChange={(e) => setNewUpsell({ ...newUpsell, addonServiceId: e.target.value })}
                      >
                        <option value="">Selecione um serviço...</option>
                        {servicos.map(s => (
                          <option key={s.id} value={s.id}>{s.name} (R$ {s.price})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Preço Especial (Opcional)</label>
                      <input 
                        type="number"
                        placeholder="Deixe vazio para preço normal"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                        value={newUpsell.discountPrice || ''}
                        onChange={(e) => setNewUpsell({ ...newUpsell, discountPrice: e.target.value ? Number(e.target.value) : undefined })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Serviços Gatilho (Quando oferecer?)</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
                      {servicos.map(s => (
                        <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-xl cursor-pointer transition-all">
                          <input 
                            type="checkbox"
                            className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                            checked={newUpsell.triggerServiceIds.includes(s.id)}
                            onChange={(e) => {
                              const ids = e.target.checked 
                                ? [...newUpsell.triggerServiceIds, s.id]
                                : newUpsell.triggerServiceIds.filter(id => id !== s.id);
                              setNewUpsell({ ...newUpsell, triggerServiceIds: ids });
                            }}
                          />
                          <span className="text-xs font-medium text-zinc-700 truncate">{s.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={24} /> : <Zap size={24} />}
                    Ativar Estratégia de Upsell
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
