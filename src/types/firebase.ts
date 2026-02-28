export type UserRole = 'admin' | 'empresa' | 'cliente' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  empresaId?: string;
}

export interface Empresa {
  id: string;
  name: string;
  slug: string; // for the mini-site URL: irisagenda.com/s/slug
  description: string;
  logoUrl?: string;
  coverUrl?: string;
  address: string;
  phone: string;
  whatsapp: string;
  category: 'beauty' | 'aesthetics' | 'health';
  ownerId: string;
  plan: 'basic' | 'pro' | 'enterprise';
  settings: {
    primaryColor: string;
    secondaryColor: string;
    showReviews: boolean;
  };
  gallery?: string[];
  createdAt: number;
}

export interface Servico {
  id: string;
  empresaId: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
  isActive: boolean;
  category?: string;
  imageUrl?: string;
}

export interface Agendamento {
  id: string;
  empresaId: string;
  clienteId: string;
  clienteName: string;
  clientePhone: string;
  servicoId: string;
  servicoName: string;
  profissionalId: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  notes?: string;
  createdAt: number;
}

export interface Review {
  id: string;
  empresaId: string;
  agendamentoId: string;
  rating: number; // 1-5
  comment: string;
  clienteName: string;
  createdAt: number;
}

export interface Bloqueio {
  id: string;
  empresaId: string;
  startTime: number;
  endTime: number;
  reason: string;
  createdAt: number;
}
