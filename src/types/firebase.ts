export interface PlatformSettings {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
}

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
  faviconUrl?: string;
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
  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;
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
  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;
  commissionAmount?: number; // Calculated amount for this specific booking
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

export interface Profissional {
  id: string;
  empresaId: string;
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[]; // IDs of services or just strings
  isActive: boolean;
  createdAt: number;
}

export interface Bloqueio {
  id: string;
  empresaId: string;
  profissionalId: string;
  startTime: number;
  endTime: number;
  reason: string;
  createdAt: number;
}

export interface AvailabilitySlot {
  start: string; // HH:mm
  end: string; // HH:mm
  serviceIds?: string[]; // Empty means all services
  customPrice?: number;
}

export interface AvailabilityOverride {
  id: string;
  empresaId: string;
  profissionalId: string;
  date: string; // YYYY-MM-DD
  isOpen: boolean;
  slots: AvailabilitySlot[];
  updatedAt: number;
}
