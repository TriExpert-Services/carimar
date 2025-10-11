export type Language = 'en' | 'es';

export type UserRole = 'admin' | 'client' | 'guest';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  nombre: string;
  telefono?: string;
  direccion?: string;
  idioma_preferido: Language;
  created_at: string;
}

export interface Service {
  id: string;
  nombre_en: string;
  nombre_es: string;
  descripcion_en: string;
  descripcion_es: string;
  precio_base: number;
  precio_por_sqft: number;
  icono: string;
  activo: boolean;
}

export type PropertyType = 'residential' | 'commercial';
export type Frequency = 'once' | 'weekly' | 'biweekly' | 'monthly';
export type QuoteStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export interface Quote {
  id: string;
  user_id: string;
  tipo_servicio: string;
  tipo_propiedad: PropertyType;
  metros_cuadrados: number;
  habitaciones?: number;
  banos?: number;
  frecuencia: Frequency;
  fecha_preferida?: string;
  hora_preferida?: string;
  precio_estimado: number;
  precio_final?: number;
  estado: QuoteStatus;
  notas_cliente?: string;
  notas_admin?: string;
  created_at: string;
  updated_at: string;
}

export type BookingStatus = 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type PaymentMethod = 'stripe' | 'google_pay' | 'apple_pay';

export interface Booking {
  id: string;
  quote_id: string;
  user_id: string;
  fecha_servicio: string;
  hora_servicio: string;
  estado: BookingStatus;
  precio_final: number;
  metodo_pago?: PaymentMethod;
  pago_completado: boolean;
  created_at: string;
}

export type PaymentStatus = 'pending' | 'completed' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  booking_id: string;
  user_id: string;
  monto: number;
  metodo_pago: PaymentMethod;
  stripe_payment_id?: string;
  estado: PaymentStatus;
  created_at: string;
}

export interface Testimonial {
  id: string;
  user_id?: string;
  nombre: string;
  calificacion: number;
  comentario: string;
  aprobado: boolean;
  foto_url?: string;
  created_at: string;
}

export interface GalleryItem {
  id: string;
  titulo: string;
  descripcion: string;
  tipo_servicio: string;
  antes_url: string;
  despues_url: string;
  visible: boolean;
  created_at: string;
}

export interface HeroImage {
  id: string;
  image_url: string;
  alt_text: string;
  position: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CompanyInfo {
  id: string;
  company_name: string;
  phone: string;
  email: string;
  address?: string;
  city: string;
  state: string;
  zip_code?: string;
  business_hours_en: string;
  business_hours_es: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  service_area_en: string;
  service_area_es: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | 'quote_received'
  | 'quote_approved'
  | 'quote_rejected'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'payment_received'
  | 'system';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  created_at: string;
}

export interface SMTPConfig {
  id: string;
  provider: string;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type EmailQueueStatus = 'pending' | 'sending' | 'sent' | 'failed';

export interface EmailQueue {
  id: string;
  to_email: string;
  to_name: string;
  subject: string;
  body_html: string;
  body_text?: string;
  status: EmailQueueStatus;
  attempts: number;
  last_error?: string;
  scheduled_at: string;
  sent_at?: string;
  created_at: string;
}
