import { useState, useEffect } from 'react';
import { FileText, Calendar, DollarSign, Users, CheckCircle, XCircle, Image, Building2, ClipboardList, Mail } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Quote, Booking, User } from '../types';
import { formatCurrency } from '../utils/pricing';
import { GalleryManager } from './GalleryManager';
import { CompanySettings } from './CompanySettings';
import { OrdersCalendar } from './OrdersCalendar';
import { SMTPSettings } from './SMTPSettings';

export const AdminDashboard = () => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'overview' | 'gallery' | 'company' | 'orders' | 'smtp'>('overview');
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [quotesResult, bookingsResult, usersResult] = await Promise.all([
      supabase.from('quotes').select('*').order('created_at', { ascending: false }),
      supabase.from('bookings').select('*').order('fecha_servicio', { ascending: false }),
      supabase.from('users').select('*').eq('role', 'client'),
    ]);

    if (quotesResult.data) setQuotes(quotesResult.data as Quote[]);
    if (bookingsResult.data) setBookings(bookingsResult.data as Booking[]);
    if (usersResult.data) setUsers(usersResult.data as User[]);
    setLoading(false);
  };

  const approveQuote = async (quoteId: string) => {
    await supabase.from('quotes').update({ estado: 'approved' }).eq('id', quoteId);
    loadData();
  };

  const rejectQuote = async (quoteId: string) => {
    await supabase.from('quotes').update({ estado: 'rejected' }).eq('id', quoteId);
    loadData();
  };

  const pendingQuotes = quotes.filter((q) => q.estado === 'pending');
  const todayBookings = bookings.filter(
    (b) => new Date(b.fecha_servicio).toDateString() === new Date().toDateString()
  );
  const monthlyRevenue = bookings
    .filter((b) => {
      const date = new Date(b.fecha_servicio);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && b.pago_completado;
    })
    .reduce((sum, b) => sum + b.precio_final, 0);

  const recentUsers = users.filter((u) => {
    const created = new Date(u.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return created >= thirtyDaysAgo;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 via-teal-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-br from-purple-200/20 via-pink-200/20 to-rose-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-2">{t('dashboard.admin.title')}</h1>
          <p className="text-gray-600">{t('dashboard.admin.overview')}</p>
        </div>

        <div className="mb-8 flex gap-4 flex-wrap">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            <FileText className="w-5 h-5" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'orders'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('company')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'company'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            Company
          </button>
          <button
            onClick={() => setActiveTab('gallery')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'gallery'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            <Image className="w-5 h-5" />
            {t('dashboard.admin.manageGallery')}
          </button>
          <button
            onClick={() => setActiveTab('smtp')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'smtp'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            <Mail className="w-5 h-5" />
            Email
          </button>
        </div>

        {activeTab === 'gallery' ? (
          <GalleryManager />
        ) : activeTab === 'company' ? (
          <CompanySettings />
        ) : activeTab === 'orders' ? (
          <OrdersCalendar />
        ) : activeTab === 'smtp' ? (
          <SMTPSettings />
        ) : (
          <>
            <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pendingQuotes.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{t('dashboard.admin.pendingQuotes')}</h3>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{todayBookings.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{t('dashboard.admin.todayBookings')}</h3>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-gray-900">{formatCurrency(monthlyRevenue)}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{t('dashboard.admin.monthlyRevenue')}</h3>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{recentUsers.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{t('dashboard.admin.newClients')}</h3>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('dashboard.admin.manageQuotes')}</h2>
          {pendingQuotes.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No pending quotes</p>
          ) : (
            <div className="space-y-4">
              {pendingQuotes.map((quote) => (
                <div key={quote.id} className="bg-white/40 border border-gray-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
                  <div className="flex flex-wrap justify-between items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-lg text-gray-900 mb-2">{quote.tipo_servicio}</h3>
                      <div className="grid sm:grid-cols-2 gap-2 text-sm text-gray-600">
                        <p>Property: {quote.tipo_propiedad}</p>
                        <p>Size: {quote.metros_cuadrados} sq ft</p>
                        <p>Frequency: {quote.frecuencia}</p>
                        <p>Date: {quote.fecha_preferida || 'Not specified'}</p>
                      </div>
                      {quote.notas_cliente && (
                        <p className="mt-3 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                          <span className="font-semibold">Notes:</span> {quote.notas_cliente}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-3 items-end">
                      <span className="text-2xl font-bold text-emerald-600">
                        {formatCurrency(quote.precio_estimado)}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => approveQuote(quote.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all text-sm font-medium"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {t('dashboard.admin.approve')}
                        </button>
                        <button
                          onClick={() => rejectQuote(quote.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-rose-500 text-white rounded-xl hover:shadow-lg hover:shadow-red-500/50 transition-all text-sm font-medium"
                        >
                          <XCircle className="w-4 h-4" />
                          {t('dashboard.admin.reject')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Bookings</h2>
            {bookings.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No bookings yet</p>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4 hover:border-teal-400 transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {new Date(booking.fecha_servicio).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-gray-600">{booking.hora_servicio}</p>
                      </div>
                      <span className="font-bold text-teal-600">{formatCurrency(booking.precio_final)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.estado === 'completed' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {booking.estado}
                      </span>
                      <span className={`text-sm ${booking.pago_completado ? 'text-green-600' : 'text-orange-600'}`}>
                        {booking.pago_completado ? 'Paid' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Clients</h2>
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No new clients</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.slice(0, 5).map((user) => (
                  <div key={user.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4 hover:border-purple-400 transition-all">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{user.nombre}</h3>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        {user.telefono && <p className="text-sm text-gray-600">{user.telefono}</p>}
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
          </>
        )}
      </div>
    </section>
  );
};
