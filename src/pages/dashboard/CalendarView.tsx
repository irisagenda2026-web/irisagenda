import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, Plus, Clock, User, ChevronLeft, ChevronRight, 
  Loader2, Ban, Trash2, DollarSign, Scissors, X, Check, AlertCircle,
  Users, Filter, Search
} from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { auth } from '@/src/services/firebase';
import { 
  getAgendamentos, createAgendamento, getServicos, addServico, 
  getBloqueios, createBloqueio, deleteBloqueio, getProfissionais, getBusinessHours 
} from '@/src/services/db';
import { Agendamento, Servico, Bloqueio, Profissional } from '@/src/types/firebase';
import { useAuth } from '@/src/contexts/AuthContext';

export default function CalendarView() {
  const { role } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'timeline' | 'list'>('timeline');

  // Filters
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [filterProfissional, setFilterProfissional] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isApptModalOpen, setIsApptModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    const user = auth.currentUser;
    if (user) {
      const start = new Date(selectedDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(selectedDate);
      end.setHours(23, 59, 59, 999);

      const [agData, blData, svData, profData, bhData] = await Promise.all([
        getAgendamentos(user.uid, start.getTime(), end.getTime()),
        getBloqueios(user.uid, start.getTime(), end.getTime()),
        getServicos(user.uid),
        getProfissionais(user.uid),
        getBusinessHours(user.uid)
      ]);
      setAgendamentos(agData);
      setBloqueios(blData);
      setServicos(svData);
      setProfissionais(profData);
      setBusinessHours(bhData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  const handleDeleteBloqueio = async (id: string) => {
    if (confirm('Deseja remover este bloqueio?')) {
      await deleteBloqueio(id);
      loadData();
    }
  };

  if (isLoading && agendamentos.length === 0) {
    return <div className="p-8 flex justify-center min-h-screen items-center"><Loader2 className="animate-spin text-emerald-600" size={40} /></div>;
  }

  if (role === 'guest') {
    return (
      <div className="p-20 text-center min-h-screen flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <Ban size={32} className="text-zinc-400" />
        </div>
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Acesso Restrito</h1>
        <p className="text-zinc-500">Faça login para acessar sua agenda.</p>
      </div>
    );
  }

  // Math for availability
  const getDayMinutes = () => {
    if (!businessHours) return 12 * 60; // Default 12h
    const dayOfWeek = selectedDate.getDay().toString();
    const dayConfig = businessHours[dayOfWeek];
    if (!dayConfig || !dayConfig.isOpen) return 0;
    
    return dayConfig.slots.reduce((acc: number, slot: any) => {
      const [sh, sm] = slot.start.split(':').map(Number);
      const [eh, em] = slot.end.split(':').map(Number);
      return acc + ((eh * 60 + em) - (sh * 60 + sm));
    }, 0);
  };

  const totalDayMinutes = getDayMinutes();
  const bookedMinutes = agendamentos.reduce((acc, curr) => acc + ((curr.endTime - curr.startTime) / 60000), 0);
  const blockedMinutes = bloqueios.reduce((acc, curr) => acc + ((curr.endTime - curr.startTime) / 60000), 0);
  const totalAvailableMinutes = Math.max(0, totalDayMinutes - bookedMinutes - blockedMinutes);
  const occupancyRate = totalDayMinutes > 0 ? Math.round(((bookedMinutes + blockedMinutes) / totalDayMinutes) * 100) : 0;
  const expectedRevenue = agendamentos.reduce((acc, curr) => acc + curr.totalPrice, 0);

  const filteredAgendamentos = agendamentos.filter(ag => {
    const matchStatus = filterStatus === 'all' || ag.status === filterStatus;
    const matchService = filterService === 'all' || ag.servicoId === filterService;
    const matchProfissional = filterProfissional === 'all' || ag.profissionalId === filterProfissional;
    const matchSearch = ag.clienteName.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchService && matchProfissional && matchSearch;
  });

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Agenda & Reservas</h1>
            <p className="text-zinc-500 mt-1">Gerencie seus horários, serviços e disponibilidade.</p>
          </div>
          
          {role === 'empresa' && (
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button 
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl font-bold hover:bg-amber-200 transition-all shadow-sm border border-amber-200"
              >
                Abrir meu Caixa
              </button>
              <button 
                onClick={() => setIsServiceModalOpen(true)}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-zinc-200 text-zinc-700 px-4 py-2.5 rounded-xl font-semibold hover:bg-zinc-50 transition-all shadow-sm"
              >
                <Scissors size={18} />
                Serviços
              </button>
              <button 
                onClick={() => setIsApptModalOpen(true)}
                className="w-full md:w-auto flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Plus size={18} />
                Novo Agendamento
              </button>
            </div>
          )}
        </header>

        {/* View Controls & Filters */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex bg-white p-1 rounded-xl border border-zinc-200 shadow-sm w-full md:w-auto">
              <button 
                onClick={() => setViewMode('list')}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  viewMode === 'list' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
                )}
              >
                <Users size={16} />
                Lista
              </button>
              <button 
                onClick={() => setViewMode('timeline')}
                className={cn(
                  "flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
                  viewMode === 'timeline' ? "bg-zinc-900 text-white shadow-md" : "text-zinc-500 hover:bg-zinc-50"
                )}
              >
                <CalendarIcon size={16} />
                Calendário
              </button>
            </div>

            <div className="relative w-full md:w-64">
              <input 
                type="text"
                placeholder="Buscar cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              />
              <User className="absolute left-3 top-2.5 text-zinc-400" size={16} />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select 
              value={filterService}
              onChange={(e) => setFilterService(e.target.value)}
              className="flex-1 md:flex-none bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Serviço: Todos</option>
              {servicos.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <select 
              value={filterProfissional}
              onChange={(e) => setFilterProfissional(e.target.value)}
              className="flex-1 md:flex-none bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Profissional: Todos</option>
              {profissionais.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 md:flex-none bg-white border border-zinc-200 rounded-xl px-3 py-2 text-xs font-bold text-zinc-600 outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">Status: Todos</option>
              <option value="confirmed">Confirmado</option>
              <option value="pending">Pendente</option>
              <option value="cancelled">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Date Picker Card */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-zinc-900 capitalize">
                  {selectedDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors">
                    <ChevronLeft size={18} />
                  </button>
                  <button onClick={() => setSelectedDate(new Date())} className="p-1.5 hover:bg-zinc-100 rounded-lg text-xs font-bold text-emerald-600 transition-colors">
                    HOJE
                  </button>
                  <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-500 transition-colors">
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-5xl font-black text-emerald-600 tracking-tighter mb-1">
                  {selectedDate.getDate()}
                </div>
                <div className="text-zinc-500 font-medium uppercase tracking-widest text-sm">
                  {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long' })}
                </div>
              </div>
            </div>

            {/* Daily Summary Card */}
            <div className="bg-zinc-900 p-6 rounded-3xl shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 blur-[50px] rounded-full" />
              <h3 className="font-bold mb-6 flex items-center gap-2 text-zinc-100">
                <CalendarIcon size={18} className="text-emerald-400" />
                Resumo do Dia
              </h3>
              
              <div className="space-y-5 relative z-10">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-zinc-400">Ocupação</span>
                    <span className="font-bold text-emerald-400">{occupancyRate}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(occupancyRate, 100)}%` }} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="text-zinc-400 text-xs mb-1">Agendamentos</div>
                    <div className="text-xl font-bold">{agendamentos.length}</div>
                  </div>
                  <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                    <div className="text-zinc-400 text-xs mb-1">Receita Prev.</div>
                    <div className="text-xl font-bold text-emerald-400">R$ {expectedRevenue}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Services Quick List */}
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2 text-zinc-900">
                <Scissors size={18} className="text-emerald-600" />
                Seus Serviços
              </h3>
              {servicos.length === 0 ? (
                <p className="text-sm text-zinc-500 text-center py-4">Nenhum serviço cadastrado.</p>
              ) : (
                <div className="space-y-3">
                  {servicos.slice(0, 4).map(s => (
                    <div key={s.id} className="flex justify-between items-center p-2 hover:bg-zinc-50 rounded-xl transition-colors">
                      <div>
                        <p className="text-sm font-bold text-zinc-900">{s.name}</p>
                        <p className="text-xs text-zinc-500">{s.durationMinutes} min</p>
                      </div>
                      <span className="text-sm font-bold text-emerald-600">R$ {s.price}</span>
                    </div>
                  ))}
                  {servicos.length > 4 && (
                    <button onClick={() => setIsServiceModalOpen(true)} className="w-full text-center text-xs font-bold text-emerald-600 pt-2 hover:underline">
                      Ver todos ({servicos.length})
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-3">
            {viewMode === 'timeline' ? (
              <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[800px]">
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/80 flex justify-between items-center sticky top-0 z-20 backdrop-blur-md">
                  <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                    <Clock size={18} className="text-emerald-600" />
                    Linha do Tempo
                  </h3>
                  <div className="flex gap-3 text-xs font-medium">
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Confirmado</div>
                    <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-zinc-300" /> Bloqueado</div>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto relative bg-zinc-50/30">
                  {/* Timeline Grid Background */}
                  <div className="absolute inset-0 z-0">
                    {Array.from({ length: 13 }).map((_, i) => (
                      <div key={i} className="h-[80px] border-b border-zinc-100 flex w-full">
                        <div className="w-20 flex-shrink-0 border-r border-zinc-100 bg-white flex justify-center pt-2">
                          <span className="text-xs font-bold text-zinc-400">{i + 8}:00</span>
                        </div>
                        <div className="flex-1" />
                      </div>
                    ))}
                  </div>

                  {/* Events Container */}
                  <div className="absolute inset-0 z-10 pl-20 pt-0">
                    <div className="relative w-full h-full pr-4">
                      
                      {/* Render Bloqueios */}
                      {bloqueios.map(bl => {
                        const startHour = new Date(bl.startTime).getHours() + (new Date(bl.startTime).getMinutes() / 60);
                        const endHour = new Date(bl.endTime).getHours() + (new Date(bl.endTime).getMinutes() / 60);
                        const top = (startHour - 8) * 80;
                        const height = (endHour - startHour) * 80;
                        
                        // Only render if within 8:00 to 20:00
                        if (startHour < 8 || startHour >= 21) return null;

                        return (
                          <div 
                            key={bl.id}
                            className="absolute left-2 right-2 bg-zinc-100/80 backdrop-blur-sm border border-zinc-200 rounded-xl p-3 shadow-sm flex flex-col justify-center overflow-hidden group"
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-zinc-500">
                                <Ban size={14} />
                                <span className="text-sm font-bold">{bl.reason}</span>
                              </div>
                              {role === 'empresa' && (
                                <button 
                                  onClick={() => handleDeleteBloqueio(bl.id)}
                                  className="p-1.5 bg-white rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 shadow-sm"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* Render Agendamentos */}
                      {filteredAgendamentos.map(ag => {
                        const startHour = new Date(ag.startTime).getHours() + (new Date(ag.startTime).getMinutes() / 60);
                        const endHour = new Date(ag.endTime).getHours() + (new Date(ag.endTime).getMinutes() / 60);
                        const top = (startHour - 8) * 80;
                        const height = (endHour - startHour) * 80;

                        if (startHour < 8 || startHour >= 21) return null;

                        return (
                          <motion.div 
                            key={ag.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="absolute left-2 right-2 bg-emerald-50 border-l-4 border-emerald-500 border-y border-r border-y-emerald-100 border-r-emerald-100 rounded-r-xl p-3 shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                            style={{ top: `${top}px`, height: `${height}px` }}
                          >
                            <div className="flex justify-between items-start h-full">
                              <div className="flex flex-col h-full justify-between">
                                <div>
                                  <div className="font-bold text-emerald-900 text-sm leading-tight">{ag.clienteName}</div>
                                  <div className="text-xs text-emerald-700 font-medium mt-0.5">{ag.servicoName}</div>
                                </div>
                                <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold bg-emerald-100/50 w-fit px-2 py-1 rounded-md">
                                  <Clock size={10} />
                                  {new Date(ag.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(ag.endTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                              </div>
                              <div className="text-xs font-bold text-emerald-700 bg-white px-2 py-1 rounded-lg shadow-sm border border-emerald-100">
                                R$ {ag.totalPrice}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}

                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAgendamentos.length === 0 ? (
                  <div className="bg-white p-12 rounded-3xl border border-zinc-200 text-center">
                    <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CalendarIcon size={32} className="text-zinc-300" />
                    </div>
                    <h3 className="text-lg font-bold text-zinc-900">Nenhum agendamento encontrado</h3>
                    <p className="text-zinc-500">Tente mudar os filtros ou selecione outra data.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {filteredAgendamentos.map(ag => (
                      <motion.div 
                        key={ag.id}
                        layout
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group"
                      >
                        <div className="flex flex-col md:flex-row justify-between gap-4">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Data e Hora */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data e hora</p>
                              <p className="text-sm font-bold text-zinc-900">
                                {new Date(ag.startTime).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })} {new Date(ag.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                              <p className="text-xs text-zinc-500 capitalize">
                                {new Date(ag.startTime).toLocaleDateString('pt-BR', { weekday: 'long' })}
                              </p>
                            </div>

                            {/* Serviço */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Serviço</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-zinc-900">{ag.servicoName}</p>
                                <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                  <Clock size={10} /> 60 min
                                </span>
                              </div>
                              <p className="text-xs text-zinc-500">
                                <span className="font-medium">Profissional:</span> Lavínia Corrêa • Sepetiba
                              </p>
                            </div>

                            {/* Cliente */}
                            <div className="space-y-1">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Cliente</p>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-zinc-900">{ag.clienteName}</p>
                                <span className="text-[10px] bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded-md font-bold">Portal</span>
                              </div>
                              <p className="text-xs text-zinc-500">
                                <span className="font-medium">Profissional:</span> Lavínia Corrêa • Sepetiba
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-row md:flex-col justify-between items-end gap-2">
                            <div className="flex flex-col items-end gap-1">
                              <div className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2",
                                ag.status === 'confirmed' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-zinc-50 text-zinc-600 border border-zinc-100"
                              )}>
                                <Check size={14} />
                                {ag.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                              </div>
                              <div className="flex items-center gap-1 text-red-500 font-bold text-[10px] mt-1">
                                <DollarSign size={10} />
                                A pagar: R$ {ag.totalPrice.toFixed(2)}
                              </div>
                            </div>
                            <button className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-colors">
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {isApptModalOpen && (
          <NewApptModal 
            onClose={() => setIsApptModalOpen(false)} 
            selectedDate={selectedDate}
            servicos={servicos}
            profissionais={profissionais}
            onSuccess={loadData}
          />
        )}
        {isBlockModalOpen && (
          <NewBlockModal 
            onClose={() => setIsBlockModalOpen(false)} 
            selectedDate={selectedDate}
            onSuccess={loadData}
          />
        )}
        {isServiceModalOpen && (
          <ServicesModal 
            onClose={() => setIsServiceModalOpen(false)} 
            servicos={servicos}
            onSuccess={loadData}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Modals Components ---

function NewApptModal({ onClose, selectedDate, servicos, profissionais, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clienteName: '',
    servicoId: servicos.length > 0 ? servicos[0].id : '',
    profissionalId: profissionais.length > 0 ? profissionais[0].id : 'default',
    hour: '09:00'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !formData.servicoId) return;

    setLoading(true);
    try {
      const servico = servicos.find((s: any) => s.id === formData.servicoId);
      const [h, m] = formData.hour.split(':').map(Number);
      
      const startTime = new Date(selectedDate);
      startTime.setHours(h, m, 0, 0);
      
      const endTime = new Date(startTime.getTime() + (servico.durationMinutes * 60000));

      await createAgendamento({
        empresaId: user.uid,
        clienteId: 'guest',
        clienteName: formData.clienteName,
        clientePhone: '',
        servicoId: servico.id,
        servicoName: servico.name,
        profissionalId: formData.profissionalId,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        status: 'confirmed',
        totalPrice: servico.price
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar agendamento');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Plus size={20} className="text-emerald-600" />
            Novo Agendamento
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {servicos.length === 0 ? (
            <div className="bg-amber-50 text-amber-700 p-4 rounded-xl text-sm flex items-start gap-3 border border-amber-100">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <p>Você precisa cadastrar pelo menos um serviço antes de criar um agendamento. Feche esta janela e clique em "Serviços".</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Nome do Cliente</label>
                <input 
                  required
                  type="text" 
                  value={formData.clienteName}
                  onChange={e => setFormData({...formData, clienteName: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Maria Silva"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Serviço</label>
                <select 
                  required
                  value={formData.servicoId}
                  onChange={e => setFormData({...formData, servicoId: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {servicos.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name} - R$ {s.price} ({s.durationMinutes} min)</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Profissional</label>
                <select 
                  required
                  value={formData.profissionalId}
                  onChange={e => setFormData({...formData, profissionalId: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {profissionais.length === 0 ? (
                    <option value="default">Lavínia Corrêa (Padrão)</option>
                  ) : (
                    profissionais.map((p: any) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Horário</label>
                <input 
                  required
                  type="time" 
                  value={formData.hour}
                  onChange={e => setFormData({...formData, hour: e.target.value})}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-3.5 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                Confirmar Agendamento
              </button>
            </>
          )}
        </form>
      </motion.div>
    </div>
  );
}

function NewBlockModal({ onClose, selectedDate, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: '',
    startHour: '12:00',
    endHour: '13:00'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      const [sh, sm] = formData.startHour.split(':').map(Number);
      const [eh, em] = formData.endHour.split(':').map(Number);
      
      const startTime = new Date(selectedDate);
      startTime.setHours(sh, sm, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(eh, em, 0, 0);

      await createBloqueio({
        empresaId: user.uid,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        reason: formData.reason
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar bloqueio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Ban size={20} className="text-zinc-600" />
            Bloquear Horário
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700">Motivo (Ex: Almoço, Reunião)</label>
            <input 
              required
              type="text" 
              value={formData.reason}
              onChange={e => setFormData({...formData, reason: e.target.value})}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Ex: Horário de Almoço"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Início</label>
              <input 
                required
                type="time" 
                value={formData.startHour}
                onChange={e => setFormData({...formData, startHour: e.target.value})}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-zinc-700">Fim</label>
              <input 
                required
                type="time" 
                value={formData.endHour}
                onChange={e => setFormData({...formData, endHour: e.target.value})}
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-zinc-900 text-white py-3.5 rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 mt-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
            Confirmar Bloqueio
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function ServicesModal({ onClose, servicos, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    durationMinutes: '60'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return;

    setLoading(true);
    try {
      await addServico({
        empresaId: user.uid,
        name: formData.name,
        description: '',
        price: Number(formData.price),
        durationMinutes: Number(formData.durationMinutes),
        isActive: true
      });
      
      setIsAdding(false);
      setFormData({ name: '', price: '', durationMinutes: '60' });
      onSuccess();
    } catch (error) {
      console.error(error);
      alert('Erro ao criar serviço');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50/50 shrink-0">
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Scissors size={20} className="text-emerald-600" />
            Gerenciar Serviços
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {isAdding ? (
            <form onSubmit={handleSubmit} className="space-y-4 bg-zinc-50 p-5 rounded-2xl border border-zinc-200">
              <h3 className="font-bold text-zinc-900 mb-2">Novo Serviço</h3>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-700">Nome do Serviço</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  placeholder="Ex: Corte de Cabelo"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700">Preço (R$)</label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder="50.00"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-700">Duração (minutos)</label>
                  <input 
                    required
                    type="number" 
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({...formData, durationMinutes: e.target.value})}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="flex-1 bg-white border border-zinc-200 text-zinc-700 py-2 rounded-xl text-sm font-bold hover:bg-zinc-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={16} /> : <Check size={16} />}
                  Salvar
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <button 
                onClick={() => setIsAdding(true)}
                className="w-full border-2 border-dashed border-zinc-300 text-zinc-500 py-4 rounded-2xl font-bold hover:bg-zinc-50 hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Adicionar Novo Serviço
              </button>

              <div className="space-y-3 mt-6">
                {servicos.map((s: any) => (
                  <div key={s.id} className="flex justify-between items-center p-4 bg-white border border-zinc-200 rounded-2xl shadow-sm">
                    <div>
                      <p className="font-bold text-zinc-900">{s.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-zinc-500 flex items-center gap-1"><Clock size={12} /> {s.durationMinutes} min</span>
                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">R$ {s.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
