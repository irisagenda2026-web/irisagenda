import { motion } from 'framer-motion';
import { 
  Calendar, 
  Smartphone, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  MessageSquare, 
  ArrowRight,
  Star,
  Users,
  Clock
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '@/src/utils/cn';
import { useAuth } from '@/src/contexts/AuthContext';
import Logo from '@/src/components/Logo';

export default function HomePage() {
  const { role } = useAuth();
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-200 blur-[120px] rounded-full" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm font-semibold mb-8"
            >
              <Zap size={16} className="fill-emerald-500" />
              <span>A agenda #1 para clínicas de estética em 2026</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-extrabold text-zinc-900 tracking-tight mb-8"
            >
              Sua clínica no <span className="text-emerald-600 italic">piloto automático.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-zinc-600 max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              Agendamento online, gestão financeira e marketing automatizado. 
              Tudo o que você precisa para focar no que realmente importa: seus pacientes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              {role === 'guest' ? (
                <>
                  <Link
                    to="/plans"
                    className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                  >
                    Começar agora grátis
                    <ArrowRight size={20} />
                  </Link>
                  <button className="w-full sm:w-auto bg-white text-zinc-900 border border-zinc-200 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-50 transition-all">
                    Ver demonstração
                  </button>
                </>
              ) : (
                <Link
                  to={role === 'admin' ? '/admin/dashboard' : role === 'empresa' ? '/dashboard/calendar' : '/my-appointments'}
                  className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2"
                >
                  Ir para meu Painel
                  <ArrowRight size={20} />
                </Link>
              )}
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-16 flex flex-col items-center gap-4"
            >
              <div className="flex -space-x-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <img
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                    src={`https://picsum.photos/seed/user-${i}/100/100`}
                    alt="User"
                    referrerPolicy="no-referrer"
                  />
                ))}
              </div>
              <p className="text-sm text-zinc-500">
                <span className="font-bold text-zinc-900">+2.500 clínicas</span> já confiam na Iris Agenda
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
              Tudo o que seu negócio precisa em um só lugar
            </h2>
            <p className="text-zinc-600 max-w-2xl mx-auto">
              Desenvolvemos ferramentas específicas para os desafios do dia a dia de quem trabalha com beleza e saúde.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Calendar}
              title="Agenda Inteligente"
              description="Gestão de horários com bloqueios automáticos, recorrências e visão por profissional."
              color="emerald"
            />
            <FeatureCard
              icon={MessageSquare}
              title="WhatsApp Integrado"
              description="Confirmações e lembretes automáticos para reduzir faltas em até 45%."
              color="blue"
            />
            <FeatureCard
              icon={Smartphone}
              title="Mini-site Whitelabel"
              description="Um site elegante e profissional para sua clínica, pronto para receber agendamentos 24/7."
              color="purple"
            />
            <FeatureCard
              icon={TrendingUp}
              title="Financeiro Completo"
              description="Fluxo de caixa, comissões de profissionais e integração com pagamentos online."
              color="orange"
            />
            <FeatureCard
              icon={Users}
              title="CRM & Fidelização"
              description="Histórico completo dos clientes, fotos de evolução e pesquisas de NPS automáticas."
              color="pink"
            />
            <FeatureCard
              icon={ShieldCheck}
              title="Segurança Total"
              description="Seus dados protegidos com criptografia de ponta e backups diários automáticos."
              color="indigo"
            />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 bg-emerald-600 text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-emerald-500/20 skew-x-12 translate-x-1/4" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
            <StatItem value="45%" label="Redução em faltas" />
            <StatItem value="2x" label="Mais agendamentos" />
            <StatItem value="24/7" label="Disponibilidade" />
            <StatItem value="+10k" label="Usuários ativos" />
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-4">
                O que dizem os especialistas
              </h2>
              <p className="text-zinc-600">
                Histórias reais de clínicas que transformaram sua gestão com a nossa plataforma.
              </p>
            </div>
            <div className="flex gap-2">
              <div className="flex text-emerald-500">
                {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={20} fill="currentColor" />)}
              </div>
              <span className="font-bold text-zinc-900">4.9/5 no Google Reviews</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TestimonialCard
              quote="A Iris Agenda mudou completamente a forma como lidamos com as faltas. O lembrete via WhatsApp é um divisor de águas."
              author="Dra. Beatriz Silva"
              role="Clínica de Estética Avançada"
              image="https://picsum.photos/seed/doctor1/100/100"
            />
            <TestimonialCard
              quote="O mini-site é tão profissional que meus clientes acham que paguei uma fortuna para uma agência desenvolver."
              author="Ricardo Santos"
              role="Studio de Beleza & Spa"
              image="https://picsum.photos/seed/barber1/100/100"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto bg-zinc-900 rounded-[40px] p-12 md:p-20 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full" />
          
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8 relative z-10">
            Pronto para levar sua clínica <br /> para o próximo nível?
          </h2>
          <p className="text-zinc-400 text-lg mb-12 max-w-xl mx-auto relative z-10">
            Junte-se a milhares de profissionais e comece a transformar sua gestão hoje mesmo. 
            Teste grátis por 14 dias.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
            <Link
              to="/plans"
              className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20"
            >
              Criar minha conta grátis
            </Link>
            <button className="w-full sm:w-auto bg-zinc-800 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-700 transition-all">
              Falar com consultor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Logo className="h-12" />
          </div>
          <p className="text-zinc-500 text-sm">
            © 2026 Iris Agenda Tecnologia LTDA. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, description, color }: any) {
  const colors: any = {
    emerald: "bg-emerald-50 text-emerald-600",
    blue: "bg-blue-50 text-blue-600",
    purple: "bg-purple-50 text-purple-600",
    orange: "bg-orange-50 text-orange-600",
    pink: "bg-pink-50 text-pink-600",
    indigo: "bg-indigo-50 text-indigo-600",
  };

  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="p-8 rounded-3xl bg-white border border-zinc-100 shadow-sm hover:shadow-xl transition-all"
    >
      <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6", colors[color])}>
        <Icon size={28} />
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-3">{title}</h3>
      <p className="text-zinc-600 leading-relaxed">{description}</p>
    </motion.div>
  );
}

function StatItem({ value, label }: any) {
  return (
    <div>
      <div className="text-4xl md:text-5xl font-extrabold mb-2">{value}</div>
      <div className="text-emerald-100 text-sm font-medium uppercase tracking-wider">{label}</div>
    </div>
  );
}

function TestimonialCard({ quote, author, role, image }: any) {
  return (
    <div className="p-8 rounded-3xl bg-zinc-50 border border-zinc-100 relative">
      <div className="flex gap-1 text-emerald-500 mb-6">
        {[1, 2, 3, 4, 5].map((i) => <Star key={i} size={16} fill="currentColor" />)}
      </div>
      <p className="text-lg text-zinc-700 italic mb-8 leading-relaxed">
        "{quote}"
      </p>
      <div className="flex items-center gap-4">
        <img src={image} alt={author} className="w-12 h-12 rounded-full object-cover" referrerPolicy="no-referrer" />
        <div>
          <div className="font-bold text-zinc-900">{author}</div>
          <div className="text-sm text-zinc-500">{role}</div>
        </div>
      </div>
    </div>
  );
}
