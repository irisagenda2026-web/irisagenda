import React from 'react';
import { useAuth } from '@/src/contexts/AuthContext';
import { Zap, AlertCircle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/utils/cn';

export default function SubscriptionBanner() {
  const { empresa } = useAuth();

  if (!empresa?.subscription) return null;

  const { status, trialEndsAt } = empresa.subscription;
  const isTrialing = status === 'trialing';
  const isPastDue = status === 'past_due';
  
  if (!isTrialing && !isPastDue) return null;

  const daysLeft = Math.ceil((trialEndsAt - Date.now()) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = isTrialing && daysLeft <= 3;

  return (
    <div className={cn(
      "w-full px-6 py-3 flex items-center justify-between gap-4 transition-all",
      (isExpiringSoon || isPastDue) ? "bg-red-50 text-red-700 border-b border-red-100" : "bg-zinc-900 text-white"
    )}>
      <div className="flex items-center gap-3">
        {(isExpiringSoon || isPastDue) ? (
          <AlertCircle className="text-red-600 animate-pulse" size={20} />
        ) : (
          <Zap className="text-emerald-400" size={20} />
        )}
        <p className="text-sm font-bold">
          {isPastDue 
            ? 'Sua assinatura está pendente de pagamento. Regularize para continuar usando o sistema.'
            : isExpiringSoon 
              ? `Seu período de teste termina em ${daysLeft} ${daysLeft === 1 ? 'dia' : 'dias'}!` 
              : `Você está no período de teste. Aproveite todas as funcionalidades por mais ${daysLeft} dias.`}
        </p>
      </div>
      
      <Link 
        to="/dashboard/subscription"
        className={cn(
          "px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest transition-all",
          (isExpiringSoon || isPastDue)
            ? "bg-red-600 text-white hover:bg-red-700" 
            : "bg-emerald-500 text-white hover:bg-emerald-600"
        )}
      >
        {isPastDue ? 'Pagar Agora' : isExpiringSoon ? 'Assinar Agora' : 'Ver Meu Plano'}
      </Link>
    </div>
  );
}
