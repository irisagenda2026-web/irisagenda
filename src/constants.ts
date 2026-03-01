export const PLAN_LIMITS = {
  essencial: {
    maxProfessionals: 2,
    maxServices: 10,
    features: ['Agendamento Online', 'Dashboard Básico'],
  },
  profissional: {
    maxProfessionals: 5,
    maxServices: 50,
    features: ['Agendamento Online', 'Dashboard Avançado', 'Gestão de Clientes', 'Relatórios Financeiros'],
  },
  enterprise: {
    maxProfessionals: 999, // Praticamente ilimitado
    maxServices: 999,
    features: ['Tudo do Pro', 'Suporte Prioritário', 'Múltiplas Unidades (Em breve)'],
  },
};

export const CATEGORIES = [
  { id: 'beauty', name: 'Beleza & Estética' },
  { id: 'health', name: 'Saúde' },
  { id: 'aesthetics', name: 'Bem-estar' },
];
