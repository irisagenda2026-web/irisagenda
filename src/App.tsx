import { BrowserRouter as Router, Routes, Route, Link, Outlet, useLocation } from 'react-router-dom';
import HomePage from './pages/landing/HomePage';
import PlansPage from './pages/landing/PlansPage';
import SignupPage from './pages/auth/SignupPage';
import LoginPage from './pages/auth/LoginPage';
import SiteEditor from './pages/dashboard/SiteEditor';
import CalendarView from './pages/dashboard/CalendarView';
import FinanceDashboard from './pages/dashboard/FinanceDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import ClientDashboard from './pages/client/ClientDashboard';
import PublicSite from './pages/public/PublicSite';
import SupportChat from './components/SupportChat';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { PlatformProvider } from './contexts/PlatformContext';
import { 
  LayoutDashboard, 
  CreditCard, 
  Home, 
  Calendar as CalendarIcon, 
  BarChart3, 
  Settings, 
  Users, 
  ShieldCheck,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useState } from 'react';
import { cn } from './utils/cn';
import Logo from './components/Logo';

function NavLink({ to, icon: Icon, label, active }: any) {
  return (
    <Link 
      to={to} 
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all",
        active 
          ? "bg-emerald-50 text-emerald-700" 
          : "text-zinc-600 hover:text-emerald-600 hover:bg-zinc-50"
      )}
    >
      <Icon size={18} />
      {label}
    </Link>
  );
}

function AppLayout() {
  const { role, logout, user } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isAdmin = role === 'admin';
  const isEmpresa = role === 'empresa';
  const isCliente = role === 'cliente';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-200 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo className="h-10" />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            {role === 'guest' && (
              <>
                <NavLink to="/" icon={Home} label="Início" active={location.pathname === '/'} />
                <NavLink to="/plans" icon={CreditCard} label="Planos" active={location.pathname === '/plans'} />
              </>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin/dashboard" icon={ShieldCheck} label="Plataforma" active={location.pathname.startsWith('/admin')} />
                <NavLink to="/admin/clinics" icon={Users} label="Clínicas" active={location.pathname === '/admin/clinics'} />
              </>
            )}

            {isEmpresa && (
              <>
                <NavLink to="/dashboard/calendar" icon={CalendarIcon} label="Agenda" active={location.pathname === '/dashboard/calendar'} />
                <NavLink to="/dashboard/finance" icon={BarChart3} label="Financeiro" active={location.pathname === '/dashboard/finance'} />
                <NavLink to="/dashboard/site" icon={LayoutDashboard} label="Meu Site" active={location.pathname === '/dashboard/site'} />
              </>
            )}

            {isCliente && (
              <>
                <NavLink to="/my-appointments" icon={CalendarIcon} label="Meus Agendamentos" active={location.pathname === '/my-appointments'} />
                <NavLink to="/s/estetica-iris" icon={Home} label="Ver Clínica" active={location.pathname.startsWith('/s/')} />
              </>
            )}
          </div>

          <div className="flex items-center gap-4">
            {role === 'guest' ? (
              <>
                <Link to="/login" className="hidden sm:block text-sm font-semibold text-zinc-600 hover:text-zinc-900 transition-colors">
                  Entrar
                </Link>
                <Link to="/plans" className="bg-zinc-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all">
                  Criar Conta
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-zinc-900">{user?.name}</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-wider">{role}</p>
                </div>
                <button 
                  onClick={logout}
                  className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  title="Sair"
                >
                  <LogOut size={20} />
                </button>
              </div>
            )}
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-zinc-600"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-b border-zinc-200 p-4 space-y-2">
            {/* Same links as desktop but stacked */}
            {isEmpresa && (
              <>
                <NavLink to="/dashboard/calendar" icon={CalendarIcon} label="Agenda" />
                <NavLink to="/dashboard/finance" icon={BarChart3} label="Financeiro" />
                <NavLink to="/dashboard/site" icon={LayoutDashboard} label="Meu Site" />
              </>
            )}
            {/* ... other roles ... */}
          </div>
        )}
      </nav>

      <main className="pt-16">
        <Outlet />
      </main>
      <SupportChat />
    </>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-zinc-50 font-sans">
            <Routes>
              {/* Public Mini-site Route (No default Nav) */}
              <Route path="/s/:slug" element={<PublicSite />} />

              {/* App Routes with Nav Layout */}
              <Route element={<AppLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/plans" element={<PlansPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/login" element={<LoginPage />} />
                
                {/* Empresa Routes */}
                <Route path="/dashboard/calendar" element={<CalendarView />} />
                <Route path="/dashboard/finance" element={<FinanceDashboard />} />
                <Route path="/dashboard/site" element={<SiteEditor />} />

                {/* Admin Routes */}
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/clinics" element={<AdminDashboard />} />
                
                {/* Cliente Routes */}
                <Route path="/my-appointments" element={<ClientDashboard />} />
              </Route>
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </PlatformProvider>
  );
}
