import React from 'react';
import { X, Copy, ExternalLink, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CorsErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CorsErrorModal({ isOpen, onClose }: CorsErrorModalProps) {
  const corsConfig = `[
  {
    "origin": ["*"],
    "method": ["GET", "HEAD", "PUT", "POST", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600
  }
]`;

  const gsutilCommand = `gsutil cors set cors.json gs://irisagenda-b6e66.firebasestorage.app`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copiado para a área de transferência!');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-zinc-100 flex justify-between items-center bg-red-50">
              <h2 className="text-xl font-bold text-red-700 flex items-center gap-2">
                ⚠️ Erro de Configuração (CORS)
              </h2>
              <button onClick={onClose} className="p-2 hover:bg-red-100 rounded-full text-red-600 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-red-800 text-sm">
                <p className="font-semibold mb-1">O upload de imagem foi bloqueado pelo Firebase Storage.</p>
                <p>Isso acontece porque o seu bucket do Firebase não está configurado para aceitar uploads deste domínio (CORS Policy).</p>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-zinc-900">Como resolver (Passo a Passo):</h3>
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-700">1. Acesse o Google Cloud Console</p>
                  <a 
                    href="https://console.cloud.google.com/storage/browser/irisagenda-b6e66.firebasestorage.app" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-emerald-600 hover:underline text-sm"
                  >
                    Ir para o Bucket <ExternalLink size={14} />
                  </a>
                  <p className="text-xs text-zinc-500">Certifique-se de estar logado na conta Google correta.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-700">2. Abra o Cloud Shell</p>
                  <p className="text-sm text-zinc-600">Clique no ícone de terminal no canto superior direito do console.</p>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-700">3. Crie o arquivo de configuração</p>
                  <div className="relative bg-zinc-900 rounded-xl p-4 group">
                    <button 
                      onClick={() => copyToClipboard(`echo '${corsConfig}' > cors.json`)}
                      className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copiar comando"
                    >
                      <Copy size={14} />
                    </button>
                    <code className="text-xs text-green-400 font-mono block whitespace-pre-wrap">
                      echo '{corsConfig}' &gt; cors.json
                    </code>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-semibold text-zinc-700">4. Aplique a configuração</p>
                  <div className="relative bg-zinc-900 rounded-xl p-4 group">
                    <button 
                      onClick={() => copyToClipboard(gsutilCommand)}
                      className="absolute top-2 right-2 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Copiar comando"
                    >
                      <Copy size={14} />
                    </button>
                    <code className="text-xs text-green-400 font-mono block whitespace-pre-wrap">
                      {gsutilCommand}
                    </code>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-50 p-4 rounded-xl text-sm text-zinc-600">
                <p>Após executar esses comandos, tente fazer o upload novamente.</p>
              </div>
            </div>

            <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors"
              >
                Entendi, vou configurar
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
