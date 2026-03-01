import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Loader2, DollarSign, Clock, Tag, AlignLeft, Image as ImageIcon, Upload } from 'lucide-react';
import { Servico } from '@/src/types/firebase';
import { uploadImage } from '@/src/services/storage';

interface ServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Servico>) => Promise<void>;
  initialData?: Servico | null;
  categories?: string[];
  empresaId: string;
  onCorsError?: () => void;
}

export default function ServiceModal({ isOpen, onClose, onSave, initialData, categories = [], empresaId, onCorsError }: ServiceModalProps) {
  const [formData, setFormData] = useState<Partial<Servico>>({
    name: '',
    description: '',
    price: 0,
    durationMinutes: 30,
    category: '',
    isActive: true,
    imageUrl: '',
    commissionType: 'percentage',
    commissionValue: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        durationMinutes: 30,
        category: '',
        isActive: true,
        imageUrl: '',
        commissionType: 'percentage',
        commissionValue: 0
      });
    }
  }, [initialData, isOpen]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const fileName = `services/${Date.now()}-${file.name}`;
      const url = await uploadImage(`clinics/${empresaId}/services/${fileName}`, file);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (error: any) {
      console.error(error);
      if (onCorsError && (error.message?.includes('network') || error.message?.includes('CORS') || error.code === 'storage/unknown')) {
        onCorsError();
      } else {
        alert('Erro ao fazer upload da imagem.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar serviço.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
              <h2 className="text-xl font-bold text-zinc-900">
                {initialData ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-zinc-200 rounded-full text-zinc-500 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Image Upload */}
              <div className="flex justify-center">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="relative w-full h-48 bg-zinc-50 border-2 border-dashed border-zinc-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all overflow-hidden group"
                >
                  {formData.imageUrl ? (
                    <>
                      <img src={formData.imageUrl} alt="Service" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white font-medium flex items-center gap-2">
                          <ImageIcon size={20} /> Alterar Imagem
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-zinc-400 flex flex-col items-center gap-2">
                      {isUploading ? (
                        <Loader2 className="animate-spin" size={32} />
                      ) : (
                        <Upload size={32} />
                      )}
                      <span className="text-sm font-medium">
                        {isUploading ? 'Enviando...' : 'Adicionar Imagem de Capa'}
                      </span>
                    </div>
                  )}
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    className="hidden" 
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700">Nome do Serviço</label>
                <input 
                  required
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Limpeza de Pele Profunda"
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <DollarSign size={14} /> Preço (R$)
                  </label>
                  <input 
                    required
                    type="number" 
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                    <Clock size={14} /> Duração (min)
                  </label>
                  <input 
                    required
                    type="number" 
                    min="5"
                    step="5"
                    value={formData.durationMinutes}
                    onChange={e => setFormData({ ...formData, durationMinutes: Number(e.target.value) })}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Tag size={14} /> Categoria (Opcional)
                </label>
                <input 
                  type="text" 
                  list="categories"
                  value={formData.category || ''}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                  placeholder="Ex: Facial, Corporal, Massagem..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                />
                <datalist id="categories">
                  {categories.map(cat => (
                    <option key={cat} value={cat} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <AlignLeft size={14} /> Descrição
                </label>
                <textarea 
                  rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descreva os detalhes do serviço..."
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                />
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 space-y-4">
                <h4 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Configuração de Comissão
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Tipo</label>
                    <select
                      value={formData.commissionType}
                      onChange={(e) => setFormData({ ...formData, commissionType: e.target.value as any })}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="percentage">Porcentagem (%)</option>
                      <option value="fixed">Valor Fixo (R$)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Valor</label>
                    <input
                      type="number"
                      value={formData.commissionValue}
                      onChange={(e) => setFormData({ ...formData, commissionValue: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 bg-white border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </form>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3">
              <button 
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-zinc-600 font-semibold hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSubmit}
                disabled={isSaving || isUploading}
                className="px-8 py-3 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                Salvar Serviço
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
