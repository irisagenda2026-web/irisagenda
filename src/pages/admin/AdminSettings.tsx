import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Save, Loader2, Image as ImageIcon, Globe, Type } from 'lucide-react';
import { usePlatform } from '../../contexts/PlatformContext';
import { updatePlatformSettings } from '../../services/db';

export default function AdminSettings() {
  const { settings, refreshSettings } = usePlatform();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    platformName: '',
    logoUrl: '',
    faviconUrl: ''
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        platformName: settings.platformName || '',
        logoUrl: settings.logoUrl || '',
        faviconUrl: settings.faviconUrl || ''
      });
    }
  }, [settings]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logoUrl' | 'faviconUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB to avoid huge base64 strings)
      if (file.size > 2 * 1024 * 1024) {
        setError('A imagem deve ter no máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await updatePlatformSettings(formData);
      await refreshSettings();
      setSuccess('Configurações da plataforma atualizadas com sucesso!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h2 className="text-xl font-bold text-zinc-900">Personalização da Plataforma</h2>
        <p className="text-zinc-500 text-sm">Altere a marca, logo e ícones do sistema SaaS.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm border border-red-100">
            {error}
          </div>
        )}
        {success && (
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-xl text-sm border border-emerald-100">
            {success}
          </div>
        )}

        <div className="space-y-6">
          {/* Platform Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <Type size={16} /> Nome da Plataforma
            </label>
            <input
              type="text"
              value={formData.platformName}
              onChange={(e) => setFormData({ ...formData, platformName: e.target.value })}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              placeholder="Ex: Iris Agenda"
            />
            <p className="text-xs text-zinc-500">Este nome aparecerá nos títulos das páginas e textos do sistema.</p>
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <ImageIcon size={16} /> Logo Principal
            </label>
            <div className="flex items-start gap-6">
              <div className="w-48 h-24 bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden relative group">
                {formData.logoUrl ? (
                  <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <div className="text-center text-zinc-400">
                    <ImageIcon size={24} className="mx-auto mb-1" />
                    <span className="text-xs">Sem logo</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer text-white text-xs font-bold px-3 py-1.5 bg-zinc-900/80 rounded-lg hover:bg-zinc-900">
                    Alterar
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, 'logoUrl')}
                    />
                  </label>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-600 mb-2">
                  Faça o upload da logo que aparecerá no cabeçalho e na tela de login de todos os usuários.
                </p>
                <p className="text-xs text-zinc-400">Recomendado: PNG com fundo transparente. Máx 2MB.</p>
              </div>
            </div>
          </div>

          {/* Favicon Upload */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
              <Globe size={16} /> Favicon (Ícone do Navegador)
            </label>
            <div className="flex items-start gap-6">
              <div className="w-16 h-16 bg-zinc-100 rounded-xl border-2 border-dashed border-zinc-300 flex items-center justify-center overflow-hidden relative group">
                {formData.faviconUrl ? (
                  <img src={formData.faviconUrl} alt="Favicon" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center text-zinc-400">
                    <Globe size={20} className="mx-auto" />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <label className="cursor-pointer text-white text-[10px] font-bold px-2 py-1 bg-zinc-900/80 rounded-lg hover:bg-zinc-900">
                    Mudar
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => handleImageUpload(e, 'faviconUrl')}
                    />
                  </label>
                </div>
              </div>
              <div className="flex-1">
                <p className="text-sm text-zinc-600 mb-2">
                  O ícone que aparece na aba do navegador.
                </p>
                <p className="text-xs text-zinc-400">Recomendado: Imagem quadrada (1:1), formato PNG ou ICO. Máx 2MB.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-100 flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-70"
          >
            {isLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
            Salvar Configurações
          </button>
        </div>
      </form>
    </div>
  );
}
