import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Smile, 
  Meh, 
  Frown,
  Filter,
  Download,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Review } from '@/src/types/firebase';
import { cn } from '@/src/utils/cn';
import { getReviews } from '@/src/services/db';

export default function NPSPage() {
  const { role, empresa } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'positive' | 'neutral' | 'negative'>('all');

  useEffect(() => {
    if (empresa?.id) {
      loadReviews();
    }
  }, [empresa?.id]);

  const loadReviews = async () => {
    if (!empresa?.id) return;
    setIsLoading(true);
    try {
      const data = await getReviews(empresa.id);
      // Add sentiment if missing
      const enrichedData = data.map(r => ({
        ...r,
        sentiment: r.sentiment || (r.rating >= 4 ? 'positive' : r.rating === 3 ? 'neutral' : 'negative')
      }));
      setReviews(enrichedData);
    } catch (error) {
      console.error("Error loading reviews:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredReviews = reviews.filter(r => {
    if (filter === 'all') return true;
    return r.sentiment === filter;
  });

  // Calculate NPS
  // NPS = % Promoters (4-5) - % Detractors (1-2)
  const promoters = reviews.filter(r => r.rating >= 4).length;
  const detractors = reviews.filter(r => r.rating <= 2).length;
  const npsScore = reviews.length > 0 
    ? Math.round(((promoters - detractors) / reviews.length) * 100)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 50) return 'text-blue-600';
    if (score >= 0) return 'text-orange-600';
    return 'text-red-600';
  };

  if (role !== 'empresa') {
    return (
      <div className="p-8 text-center">
        <p className="text-zinc-500">Apenas administradores da clínica podem acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-zinc-50 min-h-screen pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Satisfação do Cliente (NPS)</h1>
            <p className="text-zinc-500 mt-1">Monitore o que seus clientes estão dizendo sobre seus serviços.</p>
          </div>
          <button className="bg-white text-zinc-900 border border-zinc-200 px-6 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 hover:bg-zinc-50 transition-all shadow-sm">
            <Download size={18} />
            Exportar Relatório
          </button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-emerald-600" size={32} />
          </div>
        ) : (
          <>
            {/* NPS Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm md:col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">Seu Score NPS</p>
                  <h3 className={cn("text-6xl font-black tracking-tighter", getScoreColor(npsScore))}>
                    {npsScore}
                  </h3>
                  <p className="text-sm font-medium text-zinc-500 mt-2">
                    {npsScore >= 75 ? 'Excelente' : npsScore >= 50 ? 'Muito Bom' : npsScore >= 0 ? 'Razoável' : 'Crítico'}
                  </p>
                </div>
                <div className="hidden sm:block w-32 h-32 relative">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      className="text-zinc-100"
                    />
                    <circle
                      cx="64"
                      cy="64"
                      r="58"
                      stroke="currentColor"
                      strokeWidth="12"
                      fill="transparent"
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * Math.max(0, npsScore)) / 100}
                      className={getScoreColor(npsScore)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <TrendingUp size={24} className={getScoreColor(npsScore)} />
                  </div>
                </div>
              </div>

              <StatCard 
                label="Avaliações" 
                value={reviews.length.toString()} 
                subValue="Total recebido"
                icon={MessageSquare}
                color="text-blue-600"
                bg="bg-blue-50"
              />
              <StatCard 
                label="Média de Estrelas" 
                value={(reviews.reduce((acc, r) => acc + r.rating, 0) / (reviews.length || 1)).toFixed(1)} 
                subValue="De 5.0 possíveis"
                icon={Star}
                color="text-yellow-500"
                bg="bg-yellow-50"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Reviews List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h3 className="font-bold text-zinc-900">Feedback dos Clientes</h3>
                    <div className="flex items-center gap-2 bg-zinc-50 p-1 rounded-xl border border-zinc-200">
                      <FilterButton active={filter === 'all'} onClick={() => setFilter('all')} label="Todos" />
                      <FilterButton active={filter === 'positive'} onClick={() => setFilter('positive')} label="Positivos" />
                      <FilterButton active={filter === 'negative'} onClick={() => setFilter('negative')} label="Críticos" />
                    </div>
                  </div>
                  
                  <div className="divide-y divide-zinc-100">
                    {filteredReviews.length === 0 ? (
                      <div className="p-12 text-center">
                        <p className="text-zinc-500">Nenhuma avaliação encontrada para este filtro.</p>
                      </div>
                    ) : (
                      filteredReviews.map((review) => (
                        <div key={review.id} className="p-6 hover:bg-zinc-50 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center font-bold text-zinc-600">
                                {review.clienteName.charAt(0)}
                              </div>
                              <div>
                                <h4 className="font-bold text-zinc-900">{review.clienteName}</h4>
                                <div className="flex items-center gap-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star 
                                      key={i} 
                                      size={12} 
                                      className={cn(i < review.rating ? "text-yellow-400 fill-yellow-400" : "text-zinc-200")} 
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs text-zinc-400 font-medium">
                              {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <p className="text-sm text-zinc-600 leading-relaxed mb-4">
                            "{review.comment}"
                          </p>
                          <div className="flex items-center gap-2">
                            <SentimentTag sentiment={review.sentiment || 'neutral'} />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Sentiment Analysis */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                  <h3 className="font-bold text-zinc-900 mb-6">Análise de Sentimento</h3>
                  <div className="space-y-6">
                    <SentimentBar 
                      label="Positivo" 
                      percentage={reviews.length > 0 ? Math.round((reviews.filter(r => r.sentiment === 'positive').length / reviews.length) * 100) : 0} 
                      color="bg-emerald-500" 
                      icon={Smile}
                      iconColor="text-emerald-500"
                    />
                    <SentimentBar 
                      label="Neutro" 
                      percentage={reviews.length > 0 ? Math.round((reviews.filter(r => r.sentiment === 'neutral').length / reviews.length) * 100) : 0} 
                      color="bg-zinc-400" 
                      icon={Meh}
                      iconColor="text-zinc-400"
                    />
                    <SentimentBar 
                      label="Negativo" 
                      percentage={reviews.length > 0 ? Math.round((reviews.filter(r => r.sentiment === 'negative').length / reviews.length) * 100) : 0} 
                      color="bg-red-500" 
                      icon={Frown}
                      iconColor="text-red-500"
                    />
                  </div>
                </div>

                <div className="bg-zinc-900 p-6 rounded-3xl text-white">
                  <h4 className="font-bold mb-2">Insight do Iris AI 🤖</h4>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    A maioria das avaliações negativas menciona o "tempo de espera". Sugerimos revisar os intervalos entre agendamentos para melhorar a satisfação.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon: Icon, color, bg }: any) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
      <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", bg)}>
        <Icon size={24} className={color} />
      </div>
      <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
      <h3 className="text-3xl font-black text-zinc-900 tracking-tight">{value}</h3>
      <p className="text-xs text-zinc-500 mt-1">{subValue}</p>
    </div>
  );
}

function FilterButton({ active, onClick, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "px-3 py-1.5 rounded-lg text-xs font-bold transition-all",
        active ? "bg-white text-zinc-900 shadow-sm" : "text-zinc-500 hover:text-zinc-700"
      )}
    >
      {label}
    </button>
  );
}

function SentimentTag({ sentiment }: { sentiment: 'positive' | 'neutral' | 'negative' }) {
  const configs = {
    positive: { label: 'Positivo', color: 'bg-emerald-50 text-emerald-700 border-emerald-100', icon: Smile },
    neutral: { label: 'Neutro', color: 'bg-zinc-50 text-zinc-600 border-zinc-100', icon: Meh },
    negative: { label: 'Negativo', color: 'bg-red-50 text-red-700 border-red-100', icon: Frown },
  };

  const config = configs[sentiment];
  const Icon = config.icon;

  return (
    <span className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider", config.color)}>
      <Icon size={12} />
      {config.label}
    </span>
  );
}

function SentimentBar({ label, percentage, color, icon: Icon, iconColor }: any) {
  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Icon size={16} className={iconColor} />
          <span className="text-xs font-bold text-zinc-600">{label}</span>
        </div>
        <span className="text-xs font-bold text-zinc-900">{percentage}%</span>
      </div>
      <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
    </div>
  );
}
