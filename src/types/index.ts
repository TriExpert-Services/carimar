export type Language = 'en' | 'es';

export type UserRole = 'admin' | 'client' | 'employee' | 'guest';

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
  employee_id?: string;
  service_address?: string;
  estimated_duration?: number;
  employee_notes?: string;
  latitude?: number;
  longitude?: number;
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

export interface Employee {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  skills: string[];
  hourly_rate: number;
  active: boolean;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkRoute {
  id: string;
  employee_id: string;
  route_date: string;
  booking_ids: string[];
  total_distance: number;
  estimated_duration: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | 'quote_received'
  | 'quote_approved'
  | 'quote_rejected'
  | 'booking_confirmed'
  | 'booking_reminder'
  | 'booking_assigned'
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

export type ChecklistFrequency = 'everyday' | 'weekly' | 'monthly' | 'all';

export interface ChecklistTemplate {
  id: string;
  service_type: string;
  frequency: ChecklistFrequency;
  room_type: string;
  name_en: string;
  name_es: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChecklistItem {
  id: string;
  template_id: string;
  name_en: string;
  name_es: string;
  description_en?: string;
  description_es?: string;
  order_index: number;
  is_required: boolean;
  created_at: string;
}

export interface QuoteChecklistSelection {
  id: string;
  quote_id: string;
  checklist_item_id: string;
  selected: boolean;
  notes?: string;
  created_at: string;
}

export interface BookingChecklistCompletion {
  id: string;
  booking_id: string;
  checklist_item_id: string;
  completed: boolean;
  completed_at?: string;
  employee_notes?: string;
  quality_rating?: number;
  created_at: string;
}

export type PhotoType = 'before' | 'after';

export interface BookingPhoto {
  id: string;
  booking_id: string;
  photo_type: PhotoType;
  photo_url: string;
  room_area?: string;
  uploaded_by: string;
  created_at: string;
}

export type LocationType = 'start' | 'end';

export interface BookingLocation {
  id: string;
  booking_id: string;
  location_type: LocationType;
  latitude: number;
  longitude: number;
  recorded_at: string;
  accuracy?: number;
  created_at: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
export type OrderPaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed';

export interface Order {
  id: string;
  booking_id?: string;
  client_id: string;
  service_type: string;
  service_address: string;
  service_date: string;
  service_time: string;
  status: OrderStatus;
  total_amount: number;
  payment_status: OrderPaymentStatus;
  payment_intent_id?: string;
  special_instructions?: string;
  created_by_agent: boolean;
  agent_session_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  created_at: string;
}

export interface OrderWithDetails extends Order {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  order_items?: OrderItem[];
}

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  id: string;
  invoice_number: string;
  order_id: string;
  client_id: string;
  issue_date: string;
  due_date: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount: number;
  status: InvoiceStatus;
  payment_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}
