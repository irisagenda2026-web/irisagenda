import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Save, Image as ImageIcon, Plus, Trash2, Layout, DollarSign, Info, Loader2, Upload, Clock } from 'lucide-react';
import { cn } from '@/src/utils/cn';
import { auth } from '@/src/services/firebase';
import { getEmpresa, updateEmpresa, getServicos, addServico, updateServico, deleteServico } from '@/src/services/db';
import { uploadImage, deleteImage } from '@/src/services/storage';
import { Empresa, Servico } from '@/src/types/firebase';
import { useAuth } from '@/src/contexts/AuthContext';
import CorsErrorModal from '@/src/components/CorsErrorModal';
import ServiceModal from '@/src/components/ServiceModal';

export default function SiteEditor() {
  const { role } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'services' | 'gallery'>('info');
  const [empresa, setEmpresa] = useState<Empresa | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showCorsModal, setShowCorsModal] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      const user = auth.currentUser;
      if (user) {
        const data = await getEmpresa(user.uid);
        setEmpresa(data);
      }
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleSave = async () => {
    if (!empresa) return;
    setIsSaving(true);
    try {
      await updateEmpresa(empresa.id, empresa);
      alert('Alterações salvas com sucesso!');
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar alterações.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <Loader2 className="animate-spin text-emerald-600" size={40} />
      </div>
    );
  }

  if (role !== 'empresa' && role !== 'admin') {
    return (
      <div className="p-20 text-center">
        <h1 className="text-2xl font-bold text-zinc-900 mb-4">Acesso Restrito</h1>
        <p className="text-zinc-500">Apenas proprietários de clínicas podem editar o mini-site.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">Configuração do Mini-site</h1>
            <p className="text-zinc-500">Personalize como seus clientes veem sua clínica online.</p>
          </div>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70"
          >
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Alterações
          </button>
        </header>

        <div className="flex gap-8">
          {/* Sidebar Nav */}
          <aside className="w-64 space-y-2">
            <NavButton 
              active={activeTab === 'info'} 
              onClick={() => setActiveTab('info')} 
              icon={Info} 
              label="Informações Gerais" 
            />
            <NavButton 
              active={activeTab === 'services'} 
              onClick={() => setActiveTab('services')} 
              icon={DollarSign} 
              label="Serviços e Preços" 
            />
            <NavButton 
              active={activeTab === 'gallery'} 
              onClick={() => setActiveTab('gallery')} 
              icon={ImageIcon} 
              label="Galeria de Fotos" 
            />
            <div className="pt-4 mt-4 border-t border-zinc-200">
              <a 
                href={`/s/${empresa?.slug}`} 
                target="_blank"
                className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
              >
                <Layout size={18} />
                Ver meu site
              </a>
            </div>
          </aside>

          {/* Content Area */}
          <main className="flex-1 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-8">
              {activeTab === 'info' && <GeneralInfoForm empresa={empresa} setEmpresa={setEmpresa} onCorsError={() => setShowCorsModal(true)} />}
              {activeTab === 'services' && <ServicesForm empresaId={empresa?.id} onCorsError={() => setShowCorsModal(true)} />}
              {activeTab === 'gallery' && <GalleryForm empresa={empresa} setEmpresa={setEmpresa} onCorsError={() => setShowCorsModal(true)} />}
            </div>
          </main>
        </div>
      </div>
      <CorsErrorModal isOpen={showCorsModal} onClose={() => setShowCorsModal(false)} />
    </div>
  );
}

function NavButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
        active 
          ? "bg-white text-emerald-600 shadow-sm border border-zinc-200" 
          : "text-zinc-500 hover:bg-zinc-100"
      )}
    >
      <Icon size={18} />
      {label}
    </button>
  );
}

function GeneralInfoForm({ empresa, setEmpresa, onCorsError }: { empresa: Empresa | null, setEmpresa: any, onCorsError: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingFavicon, setIsUploadingFavicon] = useState(false);
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!empresa) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateEmpresa(empresa.id, empresa);
      alert('Informações salvas com sucesso!');
    } catch (error) {
      console.error(error);
      alert('Erro ao salvar informações.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadImage(`clinics/${empresa.id}/logo-${Date.now()}`, file);
      const updated = { ...empresa, logoUrl: url };
      setEmpresa(updated);
      await updateEmpresa(empresa.id, { logoUrl: url });
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('network') || error.message?.includes('CORS') || error.code === 'storage/unknown') {
        onCorsError();
      } else {
        alert('Erro ao enviar logo.');
      }
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingCover(true);
    try {
      const url = await uploadImage(`clinics/${empresa.id}/cover-${Date.now()}`, file);
      const updated = { ...empresa, coverUrl: url };
      setEmpresa(updated);
      await updateEmpresa(empresa.id, { coverUrl: url });
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('network') || error.message?.includes('CORS') || error.code === 'storage/unknown') {
        onCorsError();
      } else {
        alert('Erro ao enviar capa.');
      }
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingFavicon(true);
    try {
      const url = await uploadImage(`clinics/${empresa.id}/favicon-${Date.now()}`, file);
      const updated = { ...empresa, faviconUrl: url };
      setEmpresa(updated);
      await updateEmpresa(empresa.id, { faviconUrl: url });
    } catch (error: any) {
      console.error(error);
      if (error.message?.includes('network') || error.message?.includes('CORS') || error.code === 'storage/unknown') {
        onCorsError();
      } else {
        alert('Erro ao enviar favicon.');
      }
    } finally {
      setIsUploadingFavicon(false);
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {/* Visual Identity Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-900">Logo</label>
          <div 
            onClick={() => logoInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all overflow-hidden relative group bg-zinc-50"
          >
            {empresa.logoUrl ? (
              <>
                <img src={empresa.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-[10px] font-bold">Alterar</span>
                </div>
              </>
            ) : (
              <div className="text-zinc-400 flex flex-col items-center gap-1">
                {isUploadingLogo ? <Loader2 className="animate-spin" size={16} /> : <ImageIcon size={16} />}
                <span className="text-[10px] font-medium">Logo</span>
              </div>
            )}
            <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={handleLogoUpload} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-zinc-900">Favicon</label>
          <div 
            onClick={() => faviconInputRef.current?.click()}
            className="aspect-square rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all overflow-hidden relative group bg-zinc-50"
          >
            {empresa.faviconUrl ? (
              <>
                <img src={empresa.faviconUrl} alt="Favicon" className="w-12 h-12 object-contain" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-[10px] font-bold">Alterar</span>
                </div>
              </>
            ) : (
              <div className="text-zinc-400 flex flex-col items-center gap-1">
                {isUploadingFavicon ? <Loader2 className="animate-spin" size={16} /> : <Layout size={16} />}
                <span className="text-[10px] font-medium">Favicon</span>
              </div>
            )}
            <input type="file" ref={faviconInputRef} className="hidden" accept="image/*" onChange={handleFaviconUpload} />
          </div>
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-bold text-zinc-900">Capa do Site</label>
          <div 
            onClick={() => coverInputRef.current?.click()}
            className="h-full min-h-[100px] rounded-2xl border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/10 transition-all overflow-hidden relative group bg-zinc-50"
          >
            {empresa.coverUrl ? (
              <>
                <img src={empresa.coverUrl} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-white text-xs font-bold">Alterar Capa</span>
                </div>
              </>
            ) : (
              <div className="text-zinc-400 flex flex-col items-center gap-1">
                {isUploadingCover ? <Loader2 className="animate-spin" size={16} /> : <Layout size={16} />}
                <span className="text-[10px] font-medium">Banner</span>
              </div>
            )}
            <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={handleCoverUpload} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Nome da Clínica</label>
          <input 
            type="text" 
            value={empresa.name}
            onChange={e => setEmpresa({ ...empresa, name: e.target.value })}
            placeholder="Ex: Estética Avançada Iris"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Slug da URL</label>
          <div className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5">
            <span className="text-zinc-400 text-sm">irisagenda.com/s/</span>
            <input 
              type="text" 
              value={empresa.slug}
              onChange={e => setEmpresa({ ...empresa, slug: e.target.value })}
              placeholder="estetica-iris"
              className="flex-1 bg-transparent border-none outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-semibold text-zinc-700">Descrição/Bio</label>
        <textarea 
          rows={4}
          value={empresa.description}
          onChange={e => setEmpresa({ ...empresa, description: e.target.value })}
          placeholder="Conte um pouco sobre sua clínica e especialidades..."
          className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">WhatsApp de Contato</label>
          <input 
            type="text" 
            value={empresa.whatsapp}
            onChange={e => setEmpresa({ ...empresa, whatsapp: e.target.value })}
            placeholder="(11) 99999-9999"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-semibold text-zinc-700">Endereço</label>
          <input 
            type="text" 
            value={empresa.address}
            onChange={e => setEmpresa({ ...empresa, address: e.target.value })}
            placeholder="Rua das Flores, 123 - São Paulo"
            className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
      </div>
    </form>
  );
}

function ServicesForm({ empresaId, onCorsError }: { empresaId?: string, onCorsError: () => void }) {
  const [services, setServices] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Servico | null>(null);

  useEffect(() => {
    if (empresaId) {
      loadServices();
    }
  }, [empresaId]);

  const loadServices = async () => {
    if (!empresaId) return;
    const data = await getServicos(empresaId);
    setServices(data);
    setIsLoading(false);
  };

  const handleSaveService = async (data: Partial<Servico>) => {
    if (!empresaId) return;

    if (editingService) {
      await updateServico(editingService.id, data);
    } else {
      await addServico({
        empresaId,
        name: data.name!,
        price: data.price!,
        durationMinutes: data.durationMinutes!,
        description: data.description || '',
        category: data.category || 'Geral',
        isActive: true,
        imageUrl: data.imageUrl || '',
        commissionType: data.commissionType,
        commissionValue: data.commissionValue
      });
    }
    await loadServices();
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este serviço?')) {
      await deleteServico(id);
      await loadServices();
    }
  };

  const openNewServiceModal = () => {
    setEditingService(null);
    setIsModalOpen(true);
  };

  const openEditServiceModal = (service: Servico) => {
    setEditingService(service);
    setIsModalOpen(true);
  };

  // Extract unique categories
  const categories: string[] = Array.from(new Set(services.map(s => s.category || 'Geral')));

  if (isLoading) return <Loader2 className="animate-spin mx-auto text-emerald-600" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-bold text-zinc-900">Seus Serviços</h3>
          <p className="text-sm text-zinc-500">Gerencie os serviços oferecidos pela sua clínica.</p>
        </div>
        <button 
          onClick={openNewServiceModal}
          className="flex items-center gap-2 text-sm bg-zinc-900 text-white px-4 py-2 rounded-xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-900/10"
        >
          <Plus size={16} />
          Novo Serviço
        </button>
      </div>

      <div className="space-y-3">
        {services.map((service) => (
          <div 
            key={service.id} 
            onClick={() => openEditServiceModal(service)}
            className="flex items-center justify-between p-4 bg-white border border-zinc-200 rounded-2xl group hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">
                {service.name[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-zinc-900">{service.name}</h4>
                  {service.category && (
                    <span className="text-[10px] bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wide">
                      {service.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-zinc-500 line-clamp-1">{service.description || 'Sem descrição'}</p>
                <div className="flex items-center gap-3 mt-1 text-xs font-medium text-zinc-400">
                  <span className="flex items-center gap-1"><Clock size={12} /> {service.durationMinutes} min</span>
                  <span className="flex items-center gap-1 text-emerald-600"><DollarSign size={12} /> R$ {service.price}</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
              <button 
                onClick={(e) => { e.stopPropagation(); handleDeleteService(service.id); }}
                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Excluir"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
        {services.length === 0 && (
          <div className="text-center py-12 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4 text-zinc-400">
              <DollarSign size={24} />
            </div>
            <h3 className="font-bold text-zinc-900">Nenhum serviço cadastrado</h3>
            <p className="text-sm text-zinc-500 mb-4">Comece adicionando os serviços que você oferece.</p>
            <button 
              onClick={openNewServiceModal}
              className="text-emerald-600 font-bold hover:underline text-sm"
            >
              Adicionar primeiro serviço
            </button>
          </div>
        )}
      </div>

      <ServiceModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveService}
        initialData={editingService}
        categories={categories}
        empresaId={empresaId || ''}
        onCorsError={onCorsError}
      />
    </div>
  );
}

function GalleryForm({ empresa, setEmpresa, onCorsError }: { empresa: Empresa | null, setEmpresa: any, onCorsError: () => void }) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!empresa) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !empresa) return;

    setIsUploading(true);
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const url = await uploadImage(`clinics/${empresa.id}/gallery/${fileName}`, file);
      
      const newGallery = [...(empresa.gallery || []), url];
      const updatedEmpresa = { ...empresa, gallery: newGallery };
      setEmpresa(updatedEmpresa);
      await updateEmpresa(empresa.id, { gallery: newGallery });
    } catch (err: any) {
      console.error(err);
      if (err.message && (err.message.includes('network') || err.message.includes('CORS') || err.code === 'storage/unknown')) {
        onCorsError();
      } else {
        alert('Erro ao fazer upload da imagem.');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (url: string) => {
    if (!confirm('Deseja remover esta foto?')) return;

    try {
      // Extract path from URL (simplified for demo)
      // In a real app, you'd store the path or use a more robust way to get it
      const newGallery = (empresa.gallery || []).filter(u => u !== url);
      setEmpresa({ ...empresa, gallery: newGallery });
      await updateEmpresa(empresa.id, { gallery: newGallery });
    } catch (err) {
      console.error(err);
      alert('Erro ao remover imagem.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          className="hidden" 
          accept="image/*"
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="aspect-square border-2 border-dashed border-zinc-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-zinc-400 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer bg-zinc-50 disabled:opacity-50"
        >
          {isUploading ? <Loader2 className="animate-spin" size={32} /> : <Plus size={32} />}
          <span className="text-xs font-semibold">{isUploading ? 'Enviando...' : 'Adicionar Foto'}</span>
        </button>
        
        {empresa.gallery?.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-3xl overflow-hidden group">
            <img 
              src={url} 
              alt={`Gallery ${i}`} 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
              <button 
                onClick={() => handleDelete(url)}
                className="p-2 bg-white text-red-500 rounded-full shadow-lg"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

