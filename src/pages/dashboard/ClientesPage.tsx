import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, Search, Plus, Mail, Phone, 
  Calendar, ChevronRight, MoreVertical,
  Filter, Download, UserPlus
} from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { auth } from '@/src/services/firebase';
import { getAllAgendamentos } from '@/src/services/db';
import { Agendamento } from '@/src/types/firebase';

export default function ClientesPage() {
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
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

  // Extract unique customers from appointments
  const clientesMap = new Map();
  agendamentos.forEach(ag => {
    if (!clientesMap.has(ag.clienteName)) {
      clientesMap.set(ag.clienteName, {
        name: ag.clienteName,
        phone: ag.clientePhone || '(21) 99887-7665', // Placeholder
        email: 'cliente@email.com', // Placeholder
        lastVisit: ag.startTime,
        totalVisits: 1,
        totalSpent: ag.totalPrice
      });
    } else {
      const existing = clientesMap.get(ag.clienteName);
      clientesMap.set(ag.clienteName, {
        ...existing,
        lastVisit: Math.max(existing.lastVisit, ag.startTime),
        totalVisits: existing.totalVisits + 1,
        totalSpent: existing.totalSpent + ag.totalPrice
      });
    }
  });

  const clientes = Array.from(clientesMap.values()).filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-7xl mx-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Clientes</h1>
            <p className="text-zinc-500 mt-1">Gerencie sua base de clientes e histórico de visitas.</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white border border-zinc-200 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-50 transition-all shadow-sm">
              <Download size={16} />
              Exportar
            </button>
            <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
              <UserPlus size={16} />
              Novo Cliente
            </button>
          </div>
        </header>

        {/* Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 text-zinc-400" size={20} />
            <input 
              type="text"
              placeholder="Buscar por nome, e-mail ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-2xl pl-12 pr-4 py-3.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            />
          </div>
          <button className="flex items-center gap-2 bg-white border border-zinc-200 px-6 py-3.5 rounded-2xl text-sm font-bold text-zinc-600 hover:bg-zinc-50 transition-all shadow-sm">
            <Filter size={18} />
            Filtros
          </button>
        </div>

        {/* Clients List */}
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Cliente</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Contato</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Última Visita</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-center">Visitas</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-zinc-400 uppercase tracking-widest text-right">Total Gasto</th>
                  <th className="px-6 py-4 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50">
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center text-zinc-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente, i) => (
                    <motion.tr 
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="hover:bg-zinc-50/50 transition-colors group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-zinc-100 text-zinc-600 rounded-xl flex items-center justify-center font-bold group-hover:bg-emerald-100 group-hover:text-emerald-600 transition-colors">
                            {cliente.name[0]}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-zinc-900">{cliente.name}</p>
                            <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md w-fit mt-1">Fiel</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Phone size={12} /> {cliente.phone}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <Mail size={12} /> {cliente.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-zinc-900 font-medium">
                          <Calendar size={14} className="text-zinc-400" />
                          {new Date(cliente.lastVisit).toLocaleDateString('pt-BR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-sm font-bold text-zinc-900 bg-zinc-100 px-2.5 py-1 rounded-lg">
                          {cliente.totalVisits}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-black text-zinc-900">R$ {cliente.totalSpent.toFixed(2)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 hover:bg-zinc-100 rounded-xl text-zinc-400 transition-colors">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
