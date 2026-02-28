import React, { useState } from 'react';
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
  LogOut
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import ClientProfileModal from '../../components/ClientProfileModal';

export default function ClientDashboard() {
  const { user, logout } = useAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [appointments] = useState([
    { 
      id: '1', 
      clinic: 'Estética Iris', 
      service: 'Limpeza de Pele Profunda', 
      date: '15/03/2026', 
      time: '14:30', 
      status: 'confirmed',
      address: 'Av. Paulista, 1000 - SP'
    },
    { 
      id: '2', 
      clinic: 'Spa Harmony', 
      service: 'Massagem Relaxante', 
      date: '10/02/2026', 
      time: '10:00', 
      status: 'completed',
      address: 'Rua Oscar Freire, 500 - SP'
    }
  ]);

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-emerald-600" />
                Próximos Agendamentos
              </h2>
              <div className="space-y-4">
                {appointments.filter(a => a.status === 'confirmed').map(app => (
                  <AppointmentCard key={app.id} appointment={app} />
                ))}
                {appointments.filter(a => a.status === 'confirmed').length === 0 && (
                  <div className="bg-white p-8 rounded-3xl border border-dashed border-zinc-200 text-center">
                    <p className="text-zinc-500 text-sm mb-4">Você não tem agendamentos futuros.</p>
                    <Link to="/s/estetica-iris" className="text-emerald-600 font-bold hover:underline">Agendar agora</Link>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-zinc-900 mb-4 flex items-center gap-2">
                <History size={20} className="text-zinc-400" />
                Histórico Recente
              </h2>
              <div className="space-y-4">
                {appointments.filter(a => a.status === 'completed').map(app => (
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

function AppointmentCard({ appointment }: any) {
  const isCompleted = appointment.status === 'completed';

  return (
    <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-all group">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-2xl flex items-center justify-center font-bold",
            isCompleted ? "bg-zinc-100 text-zinc-400" : "bg-emerald-100 text-emerald-600"
          )}>
            {appointment.clinic[0]}
          </div>
          <div>
            <h4 className="font-bold text-zinc-900">{appointment.clinic}</h4>
            <p className="text-xs text-zinc-500">{appointment.service}</p>
          </div>
        </div>
        <span className={cn(
          "px-2 py-1 rounded-lg text-[10px] font-bold uppercase",
          isCompleted ? "bg-zinc-100 text-zinc-500" : "bg-emerald-100 text-emerald-700"
        )}>
          {isCompleted ? 'Concluído' : 'Confirmado'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Calendar size={16} className="text-zinc-400" />
          {appointment.date}
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-600">
          <Clock size={16} className="text-zinc-400" />
          {appointment.time}
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
        <MapPin size={14} />
        {appointment.address}
      </div>

      <div className="flex gap-2">
        {isCompleted ? (
          <button className="flex-1 bg-zinc-900 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-800 transition-all">
            Avaliar Serviço
          </button>
        ) : (
          <>
            <button className="flex-1 bg-zinc-100 text-zinc-900 py-2.5 rounded-xl text-xs font-bold hover:bg-zinc-200 transition-all">
              Reagendar
            </button>
            <button className="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all">
              Ver Detalhes
            </button>
          </>
        )}
      </div>
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
