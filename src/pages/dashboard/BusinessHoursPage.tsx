import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  AlertCircle, 
  CheckCircle2,
  Calendar as CalendarIcon,
  ChevronRight,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { auth } from '../../services/firebase';
import { getBusinessHours, saveBusinessHours } from '../../services/db';
import { cn } from '../../utils/cn';

const DAYS_OF_WEEK = [
  { id: '0', label: 'Domingo' },
  { id: '1', label: 'Segunda-feira' },
  { id: '2', label: 'Terça-feira' },
  { id: '3', label: 'Quarta-feira' },
  { id: '4', label: 'Quinta-feira' },
  { id: '5', label: 'Sexta-feira' },
  { id: '6', label: 'Sábado' },
];

interface TimeSlot {
  start: string;
  end: string;
}

interface DaySchedule {
  isOpen: boolean;
  slots: TimeSlot[];
}

interface BusinessHours {
  [key: string]: DaySchedule;
}

const DEFAULT_HOURS: BusinessHours = {
  '0': { isOpen: false, slots: [] },
  '1': { isOpen: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  '2': { isOpen: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  '3': { isOpen: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  '4': { isOpen: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  '5': { isOpen: true, slots: [{ start: '08:00', end: '12:00' }, { start: '13:00', end: '18:00' }] },
  '6': { isOpen: true, slots: [{ start: '08:00', end: '12:00' }] },
};

export default function BusinessHoursPage() {
  const [hours, setHours] = useState<BusinessHours>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadHours();
  }, []);

  const loadHours = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const data = await getBusinessHours(user.uid);
      if (data) {
        setHours(data);
      }
    } catch (error) {
      console.error('Erro ao carregar horários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    setSaving(true);
    setMessage(null);

    try {
      await saveBusinessHours(user.uid, hours);
      setMessage({ type: 'success', text: 'Horários salvos com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Erro ao salvar horários:', error);
      setMessage({ type: 'error', text: 'Erro ao salvar horários. Tente novamente.' });
    } finally {
      setSaving(false);
    }
  };

  const toggleDay = (dayId: string) => {
    setHours(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        isOpen: !prev[dayId].isOpen,
        slots: !prev[dayId].isOpen && prev[dayId].slots.length === 0 
          ? [{ start: '08:00', end: '18:00' }] 
          : prev[dayId].slots
      }
    }));
  };

  const addSlot = (dayId: string) => {
    setHours(prev => {
      const lastSlot = prev[dayId].slots[prev[dayId].slots.length - 1];
      const newStart = lastSlot ? lastSlot.end : '08:00';
      // Add 1 hour or default to 09:00
      const [h, m] = newStart.split(':').map(Number);
      const newEnd = `${String(Math.min(h + 1, 23)).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      
      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          slots: [...prev[dayId].slots, { start: newStart, end: newEnd }]
        }
      };
    });
  };

  const removeSlot = (dayId: string, index: number) => {
    setHours(prev => ({
      ...prev,
      [dayId]: {
        ...prev[dayId],
        slots: prev[dayId].slots.filter((_, i) => i !== index)
      }
    }));
  };

  const updateSlot = (dayId: string, index: number, field: 'start' | 'end', value: string) => {
    setHours(prev => {
      const newSlots = [...prev[dayId].slots];
      newSlots[index] = { ...newSlots[index], [field]: value };
      return {
        ...prev,
        [dayId]: {
          ...prev[dayId],
          slots: newSlots
        }
      };
    });
  };

  const copySchedule = (sourceDayId: string) => {
    const sourceSchedule = hours[sourceDayId];
    setHours(prev => {
      const next = { ...prev };
      // Copy to all other days except Sunday (0) and Saturday (6) if it's a weekday
      // Or just provide a simple "Apply to all" for now
      DAYS_OF_WEEK.forEach(day => {
        if (day.id !== sourceDayId) {
          next[day.id] = JSON.parse(JSON.stringify(sourceSchedule));
        }
      });
      return next;
    });
    
    setMessage({ type: 'success', text: `Horário de ${DAYS_OF_WEEK.find(d => d.id === sourceDayId)?.label} aplicado a todos os dias!` });
    setTimeout(() => setMessage(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Disponibilidade</h1>
          <p className="text-zinc-500 mt-1">Configure os horários de funcionamento da sua empresa.</p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Salvar Alterações
        </button>
      </header>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl flex items-center gap-3",
            message.type === 'success' ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-red-50 text-red-700 border border-red-100"
          )}
        >
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="font-medium">{message.text}</p>
        </motion.div>
      )}

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-zinc-100">
          {DAYS_OF_WEEK.map((day) => {
            const schedule = hours[day.id];
            return (
              <div key={day.id} className="p-6 transition-colors hover:bg-zinc-50/50">
                <div className="flex flex-col md:flex-row md:items-start gap-6">
                  {/* Day Toggle */}
                  <div className="w-full md:w-48 flex items-center justify-between md:justify-start gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        schedule.isOpen ? "bg-emerald-100 text-emerald-600" : "bg-zinc-100 text-zinc-400"
                      )}>
                        <CalendarIcon className="w-5 h-5" />
                      </div>
                      <span className={cn(
                        "font-bold text-lg",
                        schedule.isOpen ? "text-zinc-900" : "text-zinc-400"
                      )}>
                        {day.label}
                      </span>
                    </div>
                    
                    <button
                      onClick={() => toggleDay(day.id)}
                      className={cn(
                        "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                        schedule.isOpen ? "bg-emerald-600" : "bg-zinc-300"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                          schedule.isOpen ? "translate-x-6" : "translate-x-1"
                        )}
                      />
                    </button>

                    {schedule.isOpen && (
                      <button
                        onClick={() => copySchedule(day.id)}
                        title="Aplicar este horário a todos os outros dias"
                        className="p-2 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Slots Section */}
                  <div className="flex-1 space-y-4">
                    {!schedule.isOpen ? (
                      <div className="h-12 flex items-center">
                        <span className="text-zinc-400 italic text-sm font-medium uppercase tracking-wider">Fechado</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {schedule.slots.map((slot, index) => (
                          <div key={index} className="flex items-center gap-3 group">
                            <div className="flex items-center bg-zinc-100 rounded-xl p-1 border border-zinc-200">
                              <input
                                type="time"
                                value={slot.start}
                                onChange={(e) => updateSlot(day.id, index, 'start', e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-zinc-900 font-medium px-3 py-1.5"
                              />
                              <span className="text-zinc-400 font-bold px-1">às</span>
                              <input
                                type="time"
                                value={slot.end}
                                onChange={(e) => updateSlot(day.id, index, 'end', e.target.value)}
                                className="bg-transparent border-none focus:ring-0 text-zinc-900 font-medium px-3 py-1.5"
                              />
                            </div>
                            
                            <button
                              onClick={() => removeSlot(day.id, index)}
                              className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                        
                        <button
                          onClick={() => addSlot(day.id)}
                          className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 font-bold text-sm py-2 px-3 rounded-lg hover:bg-emerald-50 transition-all w-fit"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Intervalo
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex gap-4">
        <div className="bg-amber-100 text-amber-600 w-10 h-10 rounded-full flex items-center justify-center shrink-0">
          <AlertCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-amber-900">Importante</h3>
          <p className="text-amber-800/80 text-sm mt-1 leading-relaxed">
            As alterações nos horários de expediente afetarão apenas os novos agendamentos. 
            Agendamentos já existentes fora dos novos horários não serão cancelados automaticamente.
            Certifique-se de que os intervalos (ex: almoço) estão corretamente configurados para evitar agendamentos indesejados.
          </p>
        </div>
      </div>
    </div>
  );
}
