export interface PlatformSettings {
  platformName: string;
  logoUrl: string;
  faviconUrl: string;
}

export type UserRole = 'admin' | 'empresa' | 'profissional' | 'cliente' | 'guest';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  empresaId?: string;
  phone?: string;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'monthly' | 'yearly';
  features: string[];
  permissions: {
    maxProfessionals: number;
    maxServices: number;
    hasUpsells: boolean;
    hasCoupons: boolean;
    hasReviews: boolean;
    hasCustomBranding: boolean;
    hasNPS: boolean;
    hasMarketing: boolean;
  };
  isActive: boolean;
  trialDays: number;
  createdAt: number;
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
  addressNumber?: string;
  province?: string;
  postalCode?: string;
  phone: string;
  whatsapp: string;
  cpfCnpj?: string;
  companyType?: 'INDIVIDUAL' | 'MEI' | 'LIMITED' | 'ASSOCIATION';
  category: 'beauty' | 'aesthetics' | 'health';
  asaasCustomerId?: string; // Asaas Customer ID
  asaasWalletId?: string; // Asaas Wallet ID for receiving payments
  asaasApiKey?: string; // Asaas API Key for the sub-account
  serviceCategories?: string[]; // Custom categories created by the company
  ownerId: string;
  planId: string; // Reference to Plan.id
  subscription: {
    status: 'trialing' | 'active' | 'past_due' | 'canceled';
    trialEndsAt: number;
    currentPeriodEnd: number;
    cancelAtPeriodEnd: boolean;
    paymentMethod?: {
      brand: string;
      last4: string;
      cardToken?: string; // For future Pagar.me integration
    };
  };
  bankAccount?: {
    bankCode: string;
    agency: string;
    account: string;
    accountDigit: string;
    bankAccountType: 'CHECKING' | 'SAVINGS';
  };
  settings: {
    primaryColor: string;
    secondaryColor: string;
    showReviews: boolean;
    visibilityDays?: number; // Number of days visible in the calendar
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
  professionalIds?: string[]; // IDs of professionals who can perform this service
  professionalCommissions?: Record<string, { type: 'percentage' | 'fixed', value: number }>;
}

export interface AgendamentoAddon {
  serviceId: string;
  name: string;
  price: number;
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
  profissionalName: string;
  startTime: number; // timestamp
  endTime: number; // timestamp
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  totalPrice: number;
  addons?: AgendamentoAddon[];
  commissionType?: 'percentage' | 'fixed';
  commissionValue?: number;
  commissionAmount?: number; // Calculated amount for this specific booking
  notes?: string;
  createdAt: number;
}

export interface Upsell {
  id: string;
  empresaId: string;
  triggerServiceIds: string[]; // Services that trigger this upsell
  addonServiceId: string; // The service being offered as an add-on
  discountPrice?: number; // Optional special price when bought as an add-on
  title: string; // Catchy title like "Complete sua experiência"
  description: string; // Why they should add this
  imageUrl?: string;
  isActive: boolean;
  createdAt: number;
}

export interface Review {
  id: string;
  empresaId: string;
  agendamentoId: string;
  rating: number; // 1-5
  comment: string;
  clienteName: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  createdAt: number;
}

export interface Coupon {
  id: string;
  empresaId: string;
  code: string;
  discount: number;
  type: 'percentage' | 'fixed';
  minPurchase?: number;
  maxDiscount?: number;
  expiryDate: number;
  usageLimit?: number;
  usageCount: number;
  isActive: boolean;
  createdAt: number;
}

export interface Profissional {
  id: string;
  empresaId: string;
  asaasWalletId?: string;
  asaasApiKey?: string;
  userId?: string; // Link to the User account
  name: string;
  email?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  specialties?: string[]; // IDs of services or just strings
  isActive: boolean;
  bankAccount?: {
    bankCode: string;
    agency: string;
    account: string;
    accountDigit: string;
    bankAccountType: 'CHECKING' | 'SAVINGS';
  };
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
