import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  addMonths, 
  subMonths,
  isSameDay,
  parseISO,
  getDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  Filter,
  Calendar as CalendarIcon,
  Check,
  X,
  Settings2,
  Tag,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../utils/cn';
import { AvailabilityOverride, AvailabilitySlot, Servico } from '../../types/firebase';
import { getServicos } from '../../services/db';

interface AvailabilityCalendarProps {
  overrides: AvailabilityOverride[];
  onSaveOverride: (date: string, isOpen: boolean, slots: AvailabilitySlot[]) => Promise<void>;
  onBulkSave: (dates: string[], isOpen: boolean, slots: AvailabilitySlot[]) => Promise<void>;
  empresaId: string;
  currentMonth: Date;
  onMonthChange: (date: Date) => void;
}

export default function AvailabilityCalendar({ 
  overrides, 
  onSaveOverride, 
  onBulkSave, 
  empresaId,
  currentMonth,
  onMonthChange
}: AvailabilityCalendarProps) {
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [filterService, setFilterService] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'open' | 'closed'>('all');
  
  // Edit State
  const [editIsOpen, setEditIsOpen] = useState(true);
  const [editSlots, setEditSlots] = useState<AvailabilitySlot[]>([{ start: '08:00', end: '18:00' }]);

  useEffect(() => {
    loadServicos();
  }, [empresaId]);

  const loadServicos = async () => {
    const data = await getServicos(empresaId);
    setServicos(data);
  };

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const toggleDateSelection = (dateStr: string) => {
    setSelectedDates(prev => 
      prev.includes(dateStr) 
        ? prev.filter(d => d !== dateStr) 
        : [...prev, dateStr]
    );
  };

  const selectByDayOfWeek = (dayIdx: number) => {
    const matchingDays = days
      .filter(d => getDay(d) === dayIdx)
      .map(d => format(d, 'yyyy-MM-dd'));
    
    setSelectedDates(prev => {
      const allSelected = matchingDays.every(d => prev.includes(d));
      if (allSelected) {
        return prev.filter(d => !matchingDays.includes(d));
      }
      return Array.from(new Set([...prev, ...matchingDays]));
    });
  };

  const handleDayClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (selectedDates.length > 0) {
      toggleDateSelection(dateStr);
    } else {
      const override = overrides.find(o => o.date === dateStr);
      setSelectedDates([dateStr]);
      if (override) {
        setEditIsOpen(override.isOpen);
        setEditSlots(override.slots);
      } else {
        setEditIsOpen(true);
        setEditSlots([{ start: '08:00', end: '18:00' }]);
      }
      setIsEditing(true);
    }
  };

  const handleBulkEdit = () => {
    if (selectedDates.length === 0) return;
    setEditIsOpen(true);
    setEditSlots([{ start: '08:00', end: '18:00' }]);
    setIsEditing(true);
  };

  const addSlot = () => {
    setEditSlots([...editSlots, { start: '08:00', end: '18:00' }]);
  };

  const removeSlot = (index: number) => {
    setEditSlots(editSlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index: number, field: keyof AvailabilitySlot, value: any) => {
    const newSlots = [...editSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setEditSlots(newSlots);
  };

  const toggleServiceInSlot = (slotIndex: number, serviceId: string) => {
    const currentServices = editSlots[slotIndex].serviceIds || [];
    const newServices = currentServices.includes(serviceId)
      ? currentServices.filter(id => id !== serviceId)
      : [...currentServices, serviceId];
    updateSlot(slotIndex, 'serviceIds', newServices);
  };

  const saveChanges = async () => {
    if (selectedDates.length === 1) {
      await onSaveOverride(selectedDates[0], editIsOpen, editSlots);
    } else {
      await onBulkSave(selectedDates, editIsOpen, editSlots);
    }
    setIsEditing(false);
    setSelectedDates([]);
  };

  const selectWeekdays = () => {
    const weekdays = days
      .filter(d => getDay(d) !== 0 && getDay(d) !== 6)
      .map(d => format(d, 'yyyy-MM-dd'));
    setSelectedDates(weekdays);
  };

  const selectAll = () => {
    setSelectedDates(days.map(d => format(d, 'yyyy-MM-dd')));
  };

  return (
    <div className="space-y-6">
      {/* Filters & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 flex flex-wrap items-center gap-3 bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 text-zinc-400 mr-2">
            <Filter className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtros</span>
          </div>
          
          <select 
            value={filterService}
            onChange={(e) => setFilterService(e.target.value)}
            className="text-sm bg-zinc-50 border-zinc-200 rounded-xl focus:ring-emerald-500 py-2 pl-3 pr-8"
          >
            <option value="all">Todos os Serviços</option>
            {servicos.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-sm bg-zinc-50 border-zinc-200 rounded-xl focus:ring-emerald-500 py-2 pl-3 pr-8"
          >
            <option value="all">Todos os Status</option>
            <option value="open">Apenas Abertos</option>
            <option value="closed">Apenas Fechados</option>
          </select>

          <div className="h-6 w-px bg-zinc-200 mx-2 hidden md:block" />

          <div className="flex items-center gap-1">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((label, i) => (
              <button
                key={i}
                onClick={() => selectByDayOfWeek(i)}
                className="w-8 h-8 rounded-lg text-[10px] font-bold border border-zinc-200 hover:border-emerald-500 hover:text-emerald-600 transition-all"
                title={`Selecionar todas as ${['Domingos', 'Segundas', 'Terças', 'Quartas', 'Quintas', 'Sextas', 'Sábados'][i]}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-zinc-100 rounded-lg p-1">
              <button 
                onClick={() => onMonthChange(subMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={() => onMonthChange(addMonths(currentMonth, 1))}
                className="p-1.5 hover:bg-white hover:shadow-sm rounded-md transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <h2 className="text-sm font-bold text-zinc-900 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
          </div>
          
          {selectedDates.length > 0 && (
            <button 
              onClick={() => setSelectedDates([])}
              className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
            >
              Limpar ({selectedDates.length})
            </button>
          )}
        </div>
      </div>

      {/* Bulk Action Bar (Floating) */}
      <AnimatePresence>
        {selectedDates.length > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-zinc-900 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-6 border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
              <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center font-bold text-lg">
                {selectedDates.length}
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Dias Selecionados</p>
                <p className="text-sm font-medium">Edição em massa ativa</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={handleBulkEdit}
                className="bg-white text-zinc-900 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-100 transition-all flex items-center gap-2"
              >
                <Settings2 className="w-4 h-4" />
                Configurar Período
              </button>
              <button 
                onClick={() => setSelectedDates([])}
                className="text-zinc-400 hover:text-white transition-colors p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Calendar Grid */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-zinc-100 bg-zinc-50/50">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[140px]">
          {days.map((day, idx) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const isSelected = selectedDates.includes(dateStr);
            const override = overrides.find(o => o.date === dateStr);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            
            // Apply Filters
            let isHidden = false;
            if (filterStatus === 'open' && (!override || !override.isOpen)) isHidden = true;
            if (filterStatus === 'closed' && override?.isOpen) isHidden = true;
            if (filterService !== 'all' && override?.isOpen) {
              const hasService = override.slots.some(s => !s.serviceIds || s.serviceIds.length === 0 || s.serviceIds.includes(filterService));
              if (!hasService) isHidden = true;
            }

            return (
              <div 
                key={dateStr}
                onClick={() => handleDayClick(day)}
                className={cn(
                  "relative p-3 border-r border-b border-zinc-100 cursor-pointer transition-all group overflow-hidden",
                  !isCurrentMonth && "bg-zinc-50/50 opacity-30",
                  isSelected && "bg-emerald-50/50 ring-2 ring-emerald-500 ring-inset z-10",
                  isToday(day) && "bg-zinc-50",
                  isHidden && "opacity-10 grayscale"
                )}
              >
                <div className="flex items-center justify-between relative z-10">
                  <span className={cn(
                    "text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full transition-colors",
                    isToday(day) ? "bg-emerald-600 text-white" : "text-zinc-900",
                    isSelected && !isToday(day) && "bg-emerald-100 text-emerald-700"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {override && (
                    <div className={cn(
                      "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-tighter",
                      override.isOpen ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                    )}>
                      {override.isOpen ? 'Aberto' : 'Folga'}
                    </div>
                  )}
                </div>

                <div className="mt-2 space-y-1 relative z-10">
                  {override?.isOpen ? (
                    override.slots.slice(0, 3).map((slot, i) => (
                      <div key={i} className="flex flex-col gap-0.5">
                        <div className="text-[9px] bg-white border border-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded-md font-bold flex items-center justify-between shadow-sm">
                          <span className="flex items-center gap-1">
                            <Clock className="w-2 h-2 text-emerald-500" />
                            {slot.start}
                          </span>
                          {slot.customPrice && (
                            <span className="text-emerald-600">R${slot.customPrice}</span>
                          )}
                        </div>
                        {slot.serviceIds && slot.serviceIds.length > 0 && (
                          <div className="flex flex-wrap gap-0.5 px-0.5">
                            {slot.serviceIds.slice(0, 2).map(sid => (
                              <div key={sid} className="w-1.5 h-1.5 rounded-full bg-emerald-400" title={servicos.find(s => s.id === sid)?.name} />
                            ))}
                            {slot.serviceIds.length > 2 && <span className="text-[7px] text-zinc-400">+{slot.serviceIds.length - 2}</span>}
                          </div>
                        )}
                      </div>
                    ))
                  ) : override ? (
                    <div className="h-full flex items-center justify-center pt-4 opacity-20">
                      <X className="w-8 h-8 text-red-500" />
                    </div>
                  ) : (
                    <div className="text-[9px] text-zinc-300 italic font-medium pt-1">
                      Horário Padrão
                    </div>
                  )}
                </div>

                {/* Selection Overlay */}
                <div className={cn(
                  "absolute inset-0 bg-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity",
                  isSelected && "opacity-100"
                )} />
              </div>
            );
          })}
        </div>
      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden border border-zinc-200"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-emerald-100 text-emerald-600 p-2 rounded-xl">
                      <CalendarIcon className="w-5 h-5" />
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 tracking-tight">
                      {selectedDates.length === 1 
                        ? format(parseISO(selectedDates[0]), "dd 'de' MMMM", { locale: ptBR })
                        : `${selectedDates.length} dias selecionados`
                      }
                    </h3>
                  </div>
                  <p className="text-sm text-zinc-500 font-medium">Configure turnos, preços e serviços específicos.</p>
                </div>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="p-3 hover:bg-zinc-200 rounded-2xl transition-all"
                >
                  <X className="w-6 h-6 text-zinc-400" />
                </button>
              </div>

              <div className="p-8 space-y-8 max-h-[65vh] overflow-y-auto custom-scrollbar">
                {/* Status Toggle */}
                <div className="flex items-center justify-between p-6 bg-zinc-50 rounded-[2rem] border border-zinc-100 shadow-inner">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm",
                      editIsOpen ? "bg-emerald-600 text-white" : "bg-red-500 text-white"
                    )}>
                      {editIsOpen ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-lg">Disponibilidade do Dia</p>
                      <p className="text-sm text-zinc-500">{editIsOpen ? 'Empresa aberta para novos agendamentos' : 'Dia fechado para folga ou feriado'}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditIsOpen(!editIsOpen)}
                    className={cn(
                      "relative inline-flex h-8 w-14 items-center rounded-full transition-all shadow-sm",
                      editIsOpen ? "bg-emerald-600" : "bg-zinc-300"
                    )}
                  >
                    <span className={cn(
                      "inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-md",
                      editIsOpen ? "translate-x-7" : "translate-x-1"
                    )} />
                  </button>
                </div>

                {editIsOpen && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-bold text-zinc-900 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-emerald-600" />
                        Turnos de Atendimento
                      </h4>
                      <button 
                        onClick={addSlot}
                        className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-emerald-100 transition-all flex items-center gap-2 border border-emerald-100"
                      >
                        <Plus className="w-4 h-4" />
                        Novo Turno
                      </button>
                    </div>

                    <div className="space-y-6">
                      {editSlots.map((slot, index) => (
                        <motion.div 
                          layout
                          key={index} 
                          className="p-6 rounded-[2rem] border border-zinc-200 space-y-6 bg-white shadow-sm relative group"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center bg-zinc-100 rounded-2xl p-1.5 border border-zinc-200 shadow-inner">
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateSlot(index, 'start', e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 text-zinc-900 font-bold px-4 py-2 text-lg"
                                />
                                <span className="text-zinc-400 font-black px-2">→</span>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateSlot(index, 'end', e.target.value)}
                                  className="bg-transparent border-none focus:ring-0 text-zinc-900 font-bold px-4 py-2 text-lg"
                                />
                              </div>
                            </div>
                            <button 
                              onClick={() => removeSlot(index)}
                              className="p-3 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Service Selection Checklist */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <Tag className="w-4 h-4" />
                                Serviços Permitidos
                              </label>
                              <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                <button
                                  onClick={() => updateSlot(index, 'serviceIds', [])}
                                  className={cn(
                                    "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                                    (!slot.serviceIds || slot.serviceIds.length === 0)
                                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md"
                                      : "bg-zinc-50 border-zinc-100 text-zinc-600 hover:bg-zinc-100"
                                  )}
                                >
                                  Todos os Serviços
                                  {(!slot.serviceIds || slot.serviceIds.length === 0) && <Check className="w-4 h-4" />}
                                </button>
                                {servicos.map(s => (
                                  <button
                                    key={s.id}
                                    onClick={() => toggleServiceInSlot(index, s.id)}
                                    className={cn(
                                      "flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all",
                                      slot.serviceIds?.includes(s.id)
                                        ? "bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm"
                                        : "bg-white border-zinc-100 text-zinc-600 hover:bg-zinc-50"
                                    )}
                                  >
                                    {s.name}
                                    {slot.serviceIds?.includes(s.id) && <Check className="w-4 h-4" />}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {/* Custom Price */}
                            <div className="space-y-3">
                              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                                <DollarSign className="w-4 h-4" />
                                Preço Especial (Opcional)
                              </label>
                              <div className="relative group/input">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-lg group-focus-within/input:text-emerald-600 transition-colors">R$</div>
                                <input
                                  type="number"
                                  placeholder="Preço padrão do serviço"
                                  value={slot.customPrice || ''}
                                  onChange={(e) => updateSlot(index, 'customPrice', parseFloat(e.target.value))}
                                  className="w-full pl-12 pr-6 py-4 bg-zinc-50 border-zinc-200 rounded-2xl text-lg font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                                />
                              </div>
                              <p className="text-[10px] text-zinc-400 font-medium italic">Deixe vazio para usar o preço original do serviço.</p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="p-8 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-4">
                <button 
                  onClick={() => setIsEditing(false)}
                  className="px-8 py-4 rounded-2xl font-bold text-zinc-500 hover:bg-zinc-200 transition-all"
                >
                  Descartar
                </button>
                <button 
                  onClick={saveChanges}
                  className="bg-zinc-900 text-white px-10 py-4 rounded-2xl font-bold hover:bg-black transition-all shadow-xl flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Aplicar Configuração
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
