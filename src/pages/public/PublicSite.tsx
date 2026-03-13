import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Star,
  MessageCircle,
  User,
  ImageIcon
} from 'lucide-react';
import { format, addDays, startOfDay, isSameDay as isSameDayDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/src/utils/cn';
import { getEmpresaBySlug, getServicos, createAgendamento, getAgendamentos, getBloqueios, getReviews, addReview, getProfissionais, getBusinessHours, getAvailabilityOverrides } from '@/src/services/db';
import { Empresa, Servico, Agendamento, Bloqueio, Review, Profissional, AvailabilityOverride } from '@/src/types/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import AuthModal from '@/src/components/AuthModal';

import { generateTimeSlots as getAvailableTimeSlots } from '@/src/utils/availability';

export default function PublicSite() {
  const { slug } = useParams<{ slug: string }>();
  const { role, user } = useAuth();
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<'service' | 'profissional' | 'datetime' | 'confirm' | 'success'>('service');
  
  // Selection State
  const [selectedService, setSelectedService] = useState<Servico | null>(null);
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [selectedProfissional, setSelectedProfissional] = useState<Profissional | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingAgendamentos, setExistingAgendamentos] = useState<Agendamento[]>([]);
  const [existingBloqueios, setExistingBloqueios] = useState<Bloqueio[]>([]);
  const [businessHours, setBusinessHours] = useState<any>(null);
  const [availabilityOverrides, setAvailabilityOverrides] = useState<AvailabilityOverride[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const DEFAULT_BUSINESS_HOURS = {
    '0': { isOpen: false, slots: [] },
    '1': { isOpen: false, slots: [] },
    '2': { isOpen: false, slots: [] },
    '3': { isOpen: false, slots: [] },
    '4': { isOpen: false, slots: [] },
    '5': { isOpen: false, slots: [] },
    '6': { isOpen: false, slots: [] },
  };

  useEffect(() => {
    const loadData = async () => {
      if (slug) {
        const emp = await getEmpresaBySlug(slug);
        if (emp) {
          setEmpresa(emp);
          const [svs, revs, profs] = await Promise.all([
            getServicos(emp.id),
            getReviews(emp.id),
            getProfissionais(emp.id)
          ]);
          setServicos(svs.filter(s => s.isActive));
          setReviews(revs);
          setProfissionais(profs.filter(p => p.isActive));
          
          // Auto-select professional if only one
          const activeProfs = profs.filter(p => p.isActive);
          if (activeProfs.length === 1) {
            setSelectedProfissional(activeProfs[0]);
          }
        }
      }
      setIsLoading(false);
    };
    loadData();
  }, [slug]);

  useEffect(() => {
    const loadSlots = async () => {
      if (empresa && selectedDate && selectedProfissional) {
        setIsLoadingSlots(true);
        const start = startOfDay(selectedDate);
        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        
        const month = format(selectedDate, 'yyyy-MM');
        
        try {
          const [ags, bls, hours, overrides] = await Promise.all([
            getAgendamentos(empresa.id, start.getTime(), end.getTime()),
            getBloqueios(empresa.id, selectedProfissional.id, start.getTime(), end.getTime()),
            getBusinessHours(empresa.id, selectedProfissional.id),
            getAvailabilityOverrides(empresa.id, selectedProfissional.id, month)
          ]);
          
          // Filter agendamentos for this professional
          setExistingAgendamentos(ags.filter(a => a.profissionalId === selectedProfissional.id));
          setExistingBloqueios(bls);
          
          // Use configured hours or default to closed
          setBusinessHours(hours || DEFAULT_BUSINESS_HOURS);
          setAvailabilityOverrides(overrides);
        } catch (error) {
          console.error("Error loading slots:", error);
        } finally {
          setIsLoadingSlots(false);
        }
      }
    };
    loadSlots();
  }, [empresa, selectedDate, selectedProfissional]);

  // Auto-select professional if only one is available for the selected service
  useEffect(() => {
    if (selectedService && step === 'profissional') {
      const availableProfs = profissionais.filter(prof => {
        if (!selectedService.professionalIds || selectedService.professionalIds.length === 0) {
          return true;
        }
        return selectedService.professionalIds.includes(prof.id);
      });

      if (availableProfs.length === 1) {
        setSelectedProfissional(availableProfs[0]);
        setStep('datetime');
      }
    }
  }, [selectedService, step, profissionais]);

  // Reset professional if no longer valid for service
  useEffect(() => {
    if (selectedService && selectedProfissional) {
      const isStillValid = !selectedService.professionalIds || 
                          selectedService.professionalIds.length === 0 || 
                          selectedService.professionalIds.includes(selectedProfissional.id);
      
      if (!isStillValid) {
        setSelectedProfissional(null);
        setSelectedTime(null);
        if (step !== 'service' && step !== 'profissional') {
          setStep('profissional');
        }
      }
    }
  }, [selectedService]);

  const generateTimeSlots = () => {
    if (!selectedService || !selectedProfissional) return [];
    
    return getAvailableTimeSlots(
      selectedDate,
      businessHours,
      availabilityOverrides,
      existingAgendamentos,
      existingBloqueios,
      selectedService.durationMinutes,
      selectedService.id,
      15 // 15 min intervals
    ).filter(slot => slot.available).map(slot => slot.time);
  };

  const handleSchedule = async (skipAuthCheck = false) => {
    if (!empresa || !selectedService || !selectedTime) return;
    
    if (!skipAuthCheck && role === 'guest') {
      setIsAuthModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    
    try {
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime.getTime() + selectedService.durationMinutes * 60000);

      // FINAL VALIDATION: Check for overlaps one last time before saving
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      const profId = selectedProfissional?.id || 'default';

      const [existingAgs, existingBls] = await Promise.all([
        getAgendamentos(empresa.id, startOfDay.getTime(), endOfDay.getTime()),
        getBloqueios(empresa.id, profId, startOfDay.getTime(), endOfDay.getTime())
      ]);

      const profAgs = existingAgs.filter(a => a.profissionalId === profId);
      
      const hasOverlap = profAgs.some(ag => {
        return startTime.getTime() < ag.endTime && endTime.getTime() > ag.startTime;
      }) || existingBls.some(bl => {
        return startTime.getTime() < bl.endTime && endTime.getTime() > bl.startTime;
      });

      if (hasOverlap) {
        alert('Este horário acabou de ser ocupado. Por favor, escolha outro horário.');
        setIsSubmitting(false);
        setStep('datetime');
        return;
      }

      const profComm = selectedService.professionalCommissions?.[profId];
      const commType = profComm?.type || selectedService.commissionType || 'percentage';
      const commValue = profComm?.value ?? selectedService.commissionValue ?? 0;

      const commissionAmount = commType === 'percentage' 
        ? (selectedService.price * commValue) / 100 
        : commValue;

      await createAgendamento({
        empresaId: empresa.id,
        clienteId: user?.uid || 'public-guest',
        clienteName: customerInfo.name,
        clientePhone: customerInfo.phone,
        servicoId: selectedService.id,
        servicoName: selectedService.name,
        profissionalId: profId,
        profissionalName: selectedProfissional?.name || 'Profissional',
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        status: 'pending',
        totalPrice: selectedService.price,
        commissionType: commType,
        commissionValue: commValue,
        commissionAmount
      });

      // WhatsApp Notification Trigger (Simulated)
      const message = `Olá ${empresa.name}! Acabei de realizar um agendamento via Iris Agenda.\n\n*Serviço:* ${selectedService.name}\n*Data:* ${startTime.toLocaleDateString('pt-BR')}\n*Hora:* ${selectedTime}\n*Cliente:* ${customerInfo.name}`;
      const waUrl = `https://wa.me/${empresa.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      
      (window as any).waUrl = waUrl; 
      setStep('success');
    } catch (error) {
      console.error(error);
      alert('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  if (!empresa) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-2">Clínica não encontrada</h1>
        <p className="text-zinc-500">O link que você acessou pode estar incorreto ou a clínica não existe mais.</p>
      </div>
    );
  }

  const primaryColor = empresa.settings?.primaryColor || '#059669';

  return (
    <div className="min-h-screen bg-zinc-50 pb-20">
      {/* Floating User Nav if logged in */}
      {role !== 'guest' && (
        <div className="fixed top-6 right-6 z-50">
          <Link 
            to={role === 'cliente' ? '/my-appointments' : '/dashboard/calendar'}
            className="flex items-center gap-2 bg-white/80 backdrop-blur-md border border-zinc-200 px-4 py-2 rounded-full shadow-lg hover:bg-white transition-all text-sm font-bold text-zinc-900"
          >
            <User size={16} className="text-emerald-600" />
            {user?.name}
          </Link>
        </div>
      )}

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => handleSchedule(true)}
        isBookingFlow={true}
      />

      {/* Header / Cover */}
      <div className="relative h-[40vh] md:h-[50vh] bg-zinc-900 overflow-hidden">
        {empresa.coverUrl ? (
          <motion.img 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5 }}
            src={empresa.coverUrl} 
            alt="Cover" 
            className="w-full h-full object-cover opacity-70" 
            referrerPolicy="no-referrer" 
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-black opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        <div className="absolute inset-0 flex items-end">
          <div className="max-w-4xl mx-auto w-full px-6 pb-12 flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-left">
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="w-32 h-32 md:w-40 md:h-40 bg-white rounded-full shadow-2xl p-1 shrink-0 overflow-hidden border-4 border-white"
            >
              {empresa.logoUrl ? (
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold text-4xl rounded-full">
                  {empresa.name[0]}
                </div>
              )}
            </motion.div>
            <div className="text-white pb-2">
              <motion.h1 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-3xl md:text-5xl font-bold mb-2"
              >
                {empresa.name}
              </motion.h1>
              <motion.div 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-white/90 text-sm md:text-base"
              >
                <div className="flex items-center gap-1 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold">4.9</span>
                  <span className="opacity-70">(120 avaliações)</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-emerald-400" />
                  <span>{empresa.address || 'Localização não informada'}</span>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 -mt-8 relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          <AnimatePresence mode="wait">
            {step === 'service' && (
              <motion.div
                key="step-service"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-10"
              >
                {/* Categories Navigation (Simulated Carousel) */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100 overflow-x-auto no-scrollbar">
                  <div className="flex gap-2 min-w-max">
                    <button 
                      onClick={() => setSelectedCategory('Todos')}
                      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === 'Todos' ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                    >
                      Todos
                    </button>
                    {Array.from(new Set(servicos.map(s => s.category || 'Geral'))).map(cat => (
                      <button 
                        key={cat} 
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${selectedCategory === cat ? 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'}`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {Object.entries(
                  servicos.reduce((acc, service) => {
                    const cat = service.category || 'Geral';
                    if (selectedCategory !== 'Todos' && cat !== selectedCategory) return acc;
                    if (!acc[cat]) acc[cat] = [];
                    acc[cat].push(service);
                    return acc;
                  }, {} as Record<string, Servico[]>)
                ).map(([category, categoryServices]: [string, Servico[]]) => (
                  <div key={category} className="space-y-4">
                    <h3 className="text-xl font-bold text-zinc-800 flex items-center gap-2">
                      <span className="w-1 h-6 bg-emerald-500 rounded-full block"></span>
                      {category}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryServices.map(service => (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          key={service.id}
                          onClick={() => {
                            setSelectedService(service);
                            setStep('profissional');
                          }}
                          className="flex items-center bg-white border border-zinc-100 p-4 rounded-2xl hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-900/5 transition-all group text-left w-full relative overflow-hidden"
                        >
                          <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-zinc-100 mr-4 relative">
                            {service.imageUrl ? (
                              <img src={service.imageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-zinc-50 text-zinc-300">
                                <ImageIcon size={24} />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 py-1 pr-8">
                            <div className="flex justify-between items-start mb-1 gap-2">
                              <h3 className="font-bold text-zinc-900 text-lg truncate group-hover:text-emerald-600 transition-colors">{service.name}</h3>
                            </div>
                            <p className="text-sm text-zinc-500 line-clamp-2 mb-2">{service.description || 'Sem descrição'}</p>
                            <div className="flex items-center gap-3 text-xs font-medium text-zinc-400">
                              <span className="flex items-center gap-1 bg-zinc-100 px-2 py-1 rounded-md text-zinc-600"><Clock size={12} /> {service.durationMinutes} min</span>
                              <span className="font-bold text-emerald-600 text-sm whitespace-nowrap">R$ {service.price}</span>
                            </div>
                          </div>
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                            <ChevronRight size={18} />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {step === 'profissional' && (
              <motion.div
                key="step-profissional"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <button onClick={() => setStep('service')} className="text-sm text-emerald-600 font-medium hover:underline">
                  ← Voltar para serviços
                </button>
                
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900 mb-2">Escolha o profissional</h2>
                  <p className="text-zinc-500">Selecione quem irá realizar o seu atendimento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profissionais
                    .filter(prof => {
                      if (!selectedService?.professionalIds || selectedService.professionalIds.length === 0) {
                        return true; // If no restrictions, show all
                      }
                      return selectedService.professionalIds.includes(prof.id);
                    })
                    .map(prof => (
                      <button
                        key={prof.id}
                        onClick={() => {
                          setSelectedProfissional(prof);
                          setStep('datetime');
                        }}
                        className="flex items-center gap-4 p-4 bg-white border border-zinc-100 rounded-3xl hover:border-emerald-500 hover:shadow-lg transition-all text-left group"
                      >
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-2xl shrink-0">
                          {prof.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-zinc-900 group-hover:text-emerald-600 transition-colors">{prof.name}</h3>
                          <p className="text-xs text-zinc-500 line-clamp-1">{prof.bio || 'Especialista'}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-300 ml-auto group-hover:text-emerald-500 transition-colors" />
                      </button>
                    ))}
                  {profissionais.filter(prof => {
                    if (!selectedService?.professionalIds || selectedService.professionalIds.length === 0) return true;
                    return selectedService.professionalIds.includes(prof.id);
                  }).length === 0 && (
                    <div className="col-span-full py-12 text-center text-zinc-500 bg-white rounded-3xl border border-dashed border-zinc-200">
                      Nenhum profissional disponível para este serviço no momento.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'datetime' && (
              <motion.div
                key="step-datetime"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <button 
                  onClick={() => {
                    const availableProfs = profissionais.filter(prof => {
                      if (!selectedService?.professionalIds || selectedService.professionalIds.length === 0) return true;
                      return selectedService.professionalIds.includes(prof.id);
                    });
                    if (availableProfs.length === 1) {
                      setStep('service');
                    } else {
                      setStep('profissional');
                    }
                  }} 
                  className="text-sm text-emerald-600 font-medium hover:underline"
                >
                  ← {
                    profissionais.filter(prof => {
                      if (!selectedService?.professionalIds || selectedService.professionalIds.length === 0) return true;
                      return selectedService.professionalIds.includes(prof.id);
                    }).length === 1 ? 'Voltar para serviços' : 'Voltar para profissionais'
                  }
                </button>
                
                <div>
                  <h2 className="text-xl font-bold text-zinc-900 mb-1">Selecione o horário</h2>
                  <p className="text-sm text-zinc-500 mb-4">Com {selectedProfissional?.name}</p>
                  
                  {/* Simple Date Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {Array.from({ length: empresa?.settings?.visibilityDays || 60 }).map((_, i) => {
                      const date = startOfDay(addDays(new Date(), i));
                      const isSelected = isSameDayDate(date, selectedDate);
                      
                      return (
                        <button
                          key={i}
                          onClick={() => setSelectedDate(date)}
                          className={cn(
                            "flex flex-col items-center min-w-[70px] p-3 rounded-2xl border transition-all",
                            isSelected 
                              ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20" 
                              : "bg-white border-zinc-200 text-zinc-600 hover:border-emerald-200"
                          )}
                        >
                          <span className="text-[10px] uppercase font-bold opacity-70">
                            {format(date, 'eee', { locale: ptBR }).replace('.', '')}
                          </span>
                          <span className="text-lg font-bold">{format(date, 'dd')}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {isLoadingSlots ? (
                    <div className="col-span-full py-12 flex justify-center">
                      <Loader2 className="animate-spin text-emerald-600" />
                    </div>
                  ) : generateTimeSlots().length > 0 ? (
                    generateTimeSlots().map(time => (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setStep('confirm');
                        }}
                        className={cn(
                          "py-3 rounded-xl border text-sm font-bold transition-all",
                          selectedTime === time 
                            ? "bg-emerald-600 border-emerald-600 text-white" 
                            : "bg-white border-zinc-200 text-zinc-700 hover:border-emerald-200"
                        )}
                      >
                        {time}
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full py-8 text-center text-zinc-500 text-sm bg-white rounded-2xl border border-zinc-100">
                      Nenhum horário disponível para esta data.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {step === 'confirm' && (
              <motion.div
                key="step-confirm"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <button onClick={() => setStep('datetime')} className="text-sm text-emerald-600 font-medium hover:underline">
                  ← Voltar para horários
                </button>

                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <h2 className="text-xl font-bold text-zinc-900 mb-6">Confirmar Agendamento</h2>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-zinc-600">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                        <User size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Profissional</p>
                        <p className="font-bold text-zinc-900">{selectedProfissional?.name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-600">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Data e Hora</p>
                        <p className="font-bold text-zinc-900">
                          {selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })} às {selectedTime}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-600">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center">
                        <Clock size={18} />
                      </div>
                      <div>
                        <p className="text-xs text-zinc-400">Serviço</p>
                        <p className="font-bold text-zinc-900">{selectedService?.name} ({selectedService?.durationMinutes} min)</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">Seu Nome</label>
                      <input 
                        type="text" 
                        value={customerInfo.name}
                        onChange={e => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                        placeholder="Como devemos te chamar?"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-zinc-700">WhatsApp</label>
                      <input 
                        type="text" 
                        value={customerInfo.phone}
                        onChange={e => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                        placeholder="(11) 99999-9999"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleSchedule}
                    disabled={isSubmitting || !customerInfo.name || !customerInfo.phone}
                    className="w-full mt-8 bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : 'Confirmar Agendamento'}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 'success' && (
              <motion.div
                key="step-success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-12 text-center"
              >
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 size={48} />
                </div>
                <h2 className="text-3xl font-bold text-zinc-900 mb-4">Agendamento Realizado!</h2>
                <p className="text-zinc-500 max-w-sm mb-8">
                  Seu horário foi reservado com sucesso. Você receberá uma confirmação via WhatsApp em breve.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a 
                    href={(window as any).waUrl}
                    target="_blank"
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                  >
                    <MessageCircle size={20} />
                    Enviar WhatsApp agora
                  </a>
                  <button 
                    onClick={() => {
                      setStep('service');
                      setSelectedService(null);
                      setSelectedTime(null);
                    }}
                    className="bg-zinc-100 text-zinc-900 px-8 py-3 rounded-xl font-bold hover:bg-zinc-200 transition-all"
                  >
                    Fazer outro agendamento
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4">Sobre a clínica</h3>
            <p className="text-sm text-zinc-600 leading-relaxed mb-6">
              {empresa.description}
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-sm text-zinc-600">
                <MapPin size={18} className="text-zinc-400 shrink-0" />
                <span>{empresa.address || 'Endereço não informado'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-zinc-600">
                <Phone size={18} className="text-zinc-400 shrink-0" />
                <span>{empresa.whatsapp || empresa.phone || 'Telefone não informado'}</span>
              </div>
            </div>
          </div>

          {empresa.gallery && empresa.gallery.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-zinc-900 mb-4">Galeria</h3>
              <div className="grid grid-cols-2 gap-2">
                {empresa.gallery.map((url, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden">
                    <img src={url} alt={`Gallery ${i}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reviews.length > 0 && (
            <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
              <h3 className="font-bold text-zinc-900 mb-4">Avaliações</h3>
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="border-b border-zinc-100 pb-4 last:border-0 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="flex text-yellow-400">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? 'fill-current' : 'text-zinc-200'} />
                        ))}
                      </div>
                      <span className="text-xs font-bold text-zinc-900">{review.clienteName}</span>
                    </div>
                    <p className="text-sm text-zinc-600 italic">"{review.comment}"</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
            <h3 className="font-bold text-emerald-900 mb-2">Precisa de ajuda?</h3>
            <p className="text-sm text-emerald-700 mb-4">
              Fale diretamente conosco pelo WhatsApp para tirar dúvidas.
            </p>
            <a 
              href={`https://wa.me/${empresa.whatsapp?.replace(/\D/g, '')}`}
              target="_blank"
              className="block w-full bg-emerald-600 text-white text-center py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all"
            >
              Chamar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
