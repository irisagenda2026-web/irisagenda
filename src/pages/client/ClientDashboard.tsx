import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  Star, 
  MapPin, 
  ChevronRight, 
  CheckCircle2, 
  MessageCircle,
  History,
  Bell,
  CreditCard,
  User as UserIcon,
  LogOut,
  Loader2,
  X
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ClientProfileModal from '../../components/ClientProfileModal';
import { getAgendamentosByCliente, updateAgendamentoStatus } from '../../services/db';
import { Agendamento } from '../../types/firebase';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAppointments = async () => {
      if (user?.uid) {
        setIsLoading(true);
        const ags = await getAgendamentosByCliente(user.uid);
        setAppointments(ags);
        setIsLoading(false);
      }
    };
    loadAppointments();
  }, [user]);

  const handleCancel = async (id: string) => {
    if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
      await updateAgendamentoStatus(id, 'cancelled');
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: 'cancelled' } : a));
    }
  };

  return (
    <div className="p-8 bg-zinc-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Olá, {user?.name || 'Cliente'}!</h1>
            <p className="text-zinc-500 text-sm">Gerencie seus agendamentos e histórico.</p>
          </div>
          <div className="flex gap-4">
            <button className="relative p-2 text-zinc-400 hover:text-zinc-900 transition-all">
              <Bell size={24} />
              <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-50" />
            </button>
            <button 
              onClick={() => logout()}
              className="p-2 text-zinc-400 hover:text-red-500 transition-all"
              title="Sair"
            >
              <LogOut size={24} />
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-emerald-600" size={40} />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              <section>
                <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-emerald-600" />
                  Próximos Agendamentos
                </h2>
                <div className="space-y-4">
                  {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').map(app => (
                    <AppointmentCard key={app.id} appointment={app} onCancel={() => handleCancel(app.id)} />
                  ))}
                  {appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length === 0 && (
                    <div className="bg-white p-8 rounded-3xl border border-dashed border-zinc-200 text-center">
                      <p className="text-zinc-500 text-sm mb-4">Você não tem agendamentos futuros.</p>
                    </div>
                  )}
                </div>
              </section>

              <section>
                <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                  <History size={20} className="text-zinc-400" />
                  Histórico
                </h2>
                <div className="space-y-4">
                  {appointments.filter(a => a.status === 'completed' || a.status === 'cancelled').map(app => (
                    <AppointmentCard key={app.id} appointment={app} />
                  ))}
                </div>
              </section>
            </div>
            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                <h3 className="font-bold text-zinc-900 mb-4">Minha Conta</h3>
                <div className="space-y-3">
                  <SidebarLink 
                    icon={UserIcon} 
                    label="Meus Dados" 
                    onClick={() => setIsProfileModalOpen(true)}
                  />
                  <SidebarLink icon={Star} label="Minhas Avaliações" count={3} />
                  <SidebarLink icon={MessageCircle} label="Mensagens" count={0} />
                  <SidebarLink icon={CreditCard} label="Métodos de Pagamento" />
                </div>
              </div>

              <div className="bg-emerald-600 p-6 rounded-3xl text-white shadow-xl shadow-emerald-600/20">
                <h3 className="font-bold mb-2">Iris Prime</h3>
                <p className="text-xs text-emerald-100 mb-4">Ganhe cashback e prioridade em todas as clínicas parceiras.</p>
                <button className="w-full bg-white text-emerald-600 py-2.5 rounded-xl font-bold text-sm hover:bg-emerald-50 transition-all">
                  Saiba Mais
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <ClientProfileModal 
        isOpen={isProfileModalOpen} 
        onClose={() => setIsProfileModalOpen(false)} 
        user={user}
        onUpdate={() => window.location.reload()} // Simple reload to refresh context
      />
    </div>
  );
}

function AppointmentCard({ appointment, onCancel }: any) {
  const isCompleted = appointment.status === 'completed';
  const isCancelled = appointment.status === 'cancelled';
  const isConfirmed = appointment.status === 'confirmed' || appointment.status === 'pending';

  return (
    <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold",
            isCompleted ? "bg-zinc-100 text-zinc-400" : isCancelled ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-600"
          )}>
            {appointment.profissionalName[0]}
          </div>
          <div>
            <h4 className="font-bold text-zinc-900">{appointment.servicoName}</h4>
            <p className="text-xs text-zinc-500">{appointment.profissionalName}</p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
          isCompleted ? "bg-zinc-100 text-zinc-500" : isCancelled ? "bg-red-100 text-red-500" : "bg-emerald-100 text-emerald-700"
        )}>
          {isCompleted ? 'Concluído' : isCancelled ? 'Cancelado' : 'Confirmado'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Calendar size={16} className="text-zinc-400" />
          {format(new Date(appointment.startTime), 'dd/MM/yyyy', { locale: ptBR })}
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Clock size={16} className="text-zinc-400" />
          {format(new Date(appointment.startTime), 'HH:mm', { locale: ptBR })}
        </div>
      </div>

      {isConfirmed && (
        <div className="flex gap-2">
          <button 
            onClick={onCancel}
            className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2"
          >
            <X size={14} />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
function SidebarLink({ icon: Icon, label, count, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center justify-between p-2 hover:bg-zinc-50 rounded-xl transition-all group"
    >
      <div className="flex items-center gap-3 text-zinc-600 group-hover:text-zinc-900">
        <Icon size={18} />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {count !== undefined && (
        <span className="text-[10px] font-bold bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}
