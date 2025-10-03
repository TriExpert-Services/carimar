import { useState, useEffect } from 'react';
import { FileText, Calendar, CreditCard, User, Plus } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Quote, Booking } from '../types';
import { formatCurrency } from '../utils/pricing';

interface ClientDashboardProps {
  onNavigate: (section: string) => void;
}

export const ClientDashboard = ({ onNavigate }: ClientDashboardProps) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    if (!user) return;

    const [quotesResult, bookingsResult] = await Promise.all([
      supabase
        .from('quotes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha_servicio', { ascending: true }),
    ]);

    if (quotesResult.data) setQuotes(quotesResult.data as Quote[]);
    if (bookingsResult.data) setBookings(bookingsResult.data as Booking[]);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      in_progress: 'bg-blue-100 text-blue-800',
      cancelled: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
      </div>
    );
  }

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-96 h-96 bg-gradient-to-br from-teal-200/20 via-cyan-200/20 to-blue-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-br from-emerald-200/20 via-teal-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-2">
            {t('dashboard.client.welcome')}, {user?.nombre}!
          </h1>
          <p className="text-gray-600">{t('dashboard.client.title')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{quotes.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{t('dashboard.client.myQuotes')}</h3>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-400 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{bookings.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">{t('dashboard.client.myBookings')}</h3>
          </div>

          <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 rounded-[2rem] shadow-xl p-6 text-white hover:shadow-2xl hover:shadow-teal-500/50 transition-all">
            <button
              onClick={() => onNavigate('quote')}
              className="w-full h-full flex flex-col items-center justify-center gap-3 hover:scale-105 transition-transform"
            >
              <Plus className="w-8 h-8" />
              <span className="font-semibold">{t('dashboard.client.newQuote')}</span>
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('dashboard.client.myQuotes')}
            </h2>
            {quotes.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('dashboard.client.noQuotes')}</p>
                <button
                  onClick={() => onNavigate('quote')}
                  className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-teal-500/50 transition-all"
                >
                  Create Your First Quote
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {quotes.slice(0, 5).map((quote) => (
                  <div key={quote.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4 hover:border-teal-400 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">{quote.tipo_servicio}</h3>
                        <p className="text-sm text-gray-600">{quote.metros_cuadrados} sq ft</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(quote.estado)}`}>
                        {t(`dashboard.client.status.${quote.estado}`)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className="text-sm text-gray-500">
                        {new Date(quote.created_at).toLocaleDateString()}
                      </span>
                      <span className="font-bold text-teal-600">
                        {formatCurrency(quote.precio_estimado)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('dashboard.client.myBookings')}
            </h2>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <p className="text-gray-500">{t('dashboard.client.noBookings')}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.slice(0, 5).map((booking) => (
                  <div key={booking.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4 hover:border-emerald-400 hover:shadow-lg transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {new Date(booking.fecha_servicio).toLocaleDateString()}
                        </h3>
                        <p className="text-sm text-gray-600">{booking.hora_servicio}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.estado)}`}>
                        {t(`dashboard.client.status.${booking.estado}`)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                      <span className={`text-sm ${booking.pago_completado ? 'text-green-600' : 'text-orange-600'}`}>
                        {booking.pago_completado ? 'Paid' : 'Payment Pending'}
                      </span>
                      <span className="font-bold text-emerald-600">
                        {formatCurrency(booking.precio_final)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
