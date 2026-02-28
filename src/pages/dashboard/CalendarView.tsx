import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, Plus, Clock, User, ChevronLeft, ChevronRight, Loader2, Ban, Trash2 } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { auth } from '@/src/services/firebase';
import { getAgendamentos, createAgendamento, getServicos, getBloqueios, createBloqueio, deleteBloqueio } from '@/src/services/db';
import { Agendamento, Servico, Bloqueio } from '@/src/types/firebase';

import { useAuth } from '@/src/contexts/AuthContext';

export default function CalendarView() {
  const { role } = useAuth();
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        const start = new Date(selectedDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(selectedDate);
        end.setHours(23, 59, 59, 999);

        const [agData, blData, svData] = await Promise.all([
          getAgendamentos(user.uid, start.getTime(), end.getTime()),
          getBloqueios(user.uid, start.getTime(), end.getTime()),
          getServicos(user.uid)
        ]);
        setAgendamentos(agData);
        setBloqueios(blData);
        setServicos(svData);
      }
      setIsLoading(false);
    };
    loadData();
  }, [selectedDate]);

  const handleAddAgendamento = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const clienteName = prompt('Nome do cliente:');
    const servicoId = prompt('ID do serviço (ou escolha da lista):');
    const hour = prompt('Hora (ex: 14):');

    if (clienteName && hour) {
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(hour), 0, 0, 0);
      
      await createAgendamento({
        empresaId: user.uid,
        clienteId: 'guest',
        clienteName,
        clientePhone: '',
        servicoId: servicoId || 'default',
        servicoName: 'Serviço Manual',
        profissionalId: 'default',
        startTime: startTime.getTime(),
        endTime: startTime.getTime() + (60 * 60 * 1000),
        status: 'confirmed',
        totalPrice: 0
      });

      refreshData();
    }
  };

  const handleAddBloqueio = async () => {
    const user = auth.currentUser;
    if (!user) return;

    const reason = prompt('Motivo do bloqueio (ex: Almoço):');
    const startHour = prompt('Hora de início (ex: 12):');
    const endHour = prompt('Hora de fim (ex: 13):');

    if (reason && startHour && endHour) {
      const startTime = new Date(selectedDate);
      startTime.setHours(parseInt(startHour), 0, 0, 0);
      
      const endTime = new Date(selectedDate);
      endTime.setHours(parseInt(endHour), 0, 0, 0);

      await createBloqueio({
        empresaId: user.uid,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        reason
      });

      refreshData();
    }
  };

  const handleDeleteBloqueio = async (id: string) => {
    if (confirm('Deseja remover este bloqueio?')) {
      await deleteBloqueio(id);
      refreshData();
    }
  };

  const refreshData = async () => {
    const user = auth.currentUser;
    if (!user) return;
    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);
    const [agData, blData] = await Promise.all([
      getAgendamentos(user.uid, start.getTime(), end.getTime()),
      getBloqueios(user.uid, start.getTime(), end.getTime())
    ]);
    setAgendamentos(agData);
    setBloqueios(blData);
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-emerald-600" /></div>;

  if (role === 'guest') {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Acesso Restrito</h1>
        <p className="text-zinc-500">Faça login para acessar sua agenda.</p>
      </div>
    );
  }

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-zinc-900">Agenda</h1>
            <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-2 py-1 shadow-sm">
              <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() - 1)))} className="p-1 hover:bg-zinc-100 rounded-lg">
                <ChevronLeft size={20} />
              </button>
              <span className="px-4 font-medium text-sm">
                {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
              <button onClick={() => setSelectedDate(new Date(selectedDate.setDate(selectedDate.getDate() + 1)))} className="p-1 hover:bg-zinc-100 rounded-lg">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          {role === 'empresa' && (
            <div className="flex items-center gap-3">
              <button 
                onClick={handleAddBloqueio}
                className="flex items-center gap-2 bg-zinc-100 text-zinc-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-zinc-200 transition-all"
              >
                <Ban size={18} />
                Bloquear Horário
              </button>
              <button 
                onClick={handleAddAgendamento}
                className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                <Plus size={18} />
                Novo Agendamento
              </button>
            </div>
          )}
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Calendar Sidebar placeholder */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <CalendarIcon size={18} className="text-emerald-600" />
                Resumo do Dia
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Total de horários</span>
                  <span className="font-bold">{agendamentos.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Confirmados</span>
                  <span className="font-bold text-emerald-600">{agendamentos.filter(a => a.status === 'confirmed').length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline View */}
          <div className="md:col-span-3 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
              <h3 className="font-bold">Linha do Tempo</h3>
            </div>
            <div className="divide-y divide-zinc-100">
              {Array.from({ length: 14 }).map((_, i) => {
                const hour = i + 8; // 8am to 9pm
                const ags = agendamentos.filter(a => new Date(a.startTime).getHours() === hour);
                const bls = bloqueios.filter(b => {
                  const startHour = new Date(b.startTime).getHours();
                  const endHour = new Date(b.endTime).getHours();
                  return hour >= startHour && hour < endHour;
                });
                
                return (
                  <div key={hour} className="flex min-h-[80px] group">
                    <div className="w-20 p-4 text-right border-r border-zinc-100 bg-zinc-50/30">
                      <span className="text-sm font-bold text-zinc-400">{hour}:00</span>
                    </div>
                    <div className="flex-1 p-2 relative">
                      {bls.map(bl => (
                        <div 
                          key={bl.id}
                          className="bg-zinc-100 border border-zinc-200 rounded-xl p-3 shadow-sm mb-2 flex justify-between items-center"
                        >
                          <div className="flex items-center gap-2 text-zinc-500">
                            <Ban size={14} />
                            <span className="text-sm font-bold">{bl.reason}</span>
                          </div>
                          {role === 'empresa' && (
                            <button 
                              onClick={() => handleDeleteBloqueio(bl.id)}
                              className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                      {ags.map(ag => (
                        <motion.div 
                          key={ag.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 shadow-sm mb-2"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-bold text-emerald-900 text-sm">{ag.clienteName}</div>
                              <div className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                                <Clock size={12} />
                                {new Date(ag.startTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {ag.servicoName}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase">
                              <User size={10} />
                              Confirmado
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      {ags.length === 0 && role === 'empresa' && (
                        <div className="h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={handleAddAgendamento}
                            className="text-xs text-zinc-400 hover:text-emerald-600 font-medium"
                          >
                            + Agendar às {hour}:00
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
