import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Quote } from '../types';
import { formatCurrency } from '../utils/pricing';

interface BookingWithDetails extends Booking {
  quote?: Quote;
  user_name?: string;
}

export const OrdersCalendar = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const loadData = async () => {
    setLoading(true);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const [bookingsResult, quotesResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('*, users(nombre)')
        .gte('fecha_servicio', startOfMonth.toISOString().split('T')[0])
        .lte('fecha_servicio', endOfMonth.toISOString().split('T')[0])
        .order('fecha_servicio', { ascending: true }),
      supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false }),
    ]);

    if (bookingsResult.data) {
      const bookingsWithDetails = bookingsResult.data.map((booking: any) => ({
        ...booking,
        user_name: booking.users?.nombre || 'Unknown',
      }));
      setBookings(bookingsWithDetails);
    }

    if (quotesResult.data) {
      setQuotes(quotesResult.data as Quote[]);
    }

    setLoading(false);
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];

    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }

    return days;
  };

  const getBookingsForDate = (date: Date) => {
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.fecha_servicio);
      return bookingDate.toDateString() === date.toDateString();
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const pendingQuotes = quotes.filter(q => q.estado === 'pending');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-2xl flex items-center justify-center">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Orders & Calendar</h2>
            <p className="text-gray-600">Manage bookings and view schedule</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('calendar')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === 'calendar'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            Calendar View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              viewMode === 'list'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {pendingQuotes.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-yellow-800 font-medium">
            You have {pendingQuotes.length} pending quote{pendingQuotes.length !== 1 ? 's' : ''} awaiting approval
          </p>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-bold text-gray-900">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={previousMonth}
                className="p-2 rounded-xl bg-white/60 hover:bg-white transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextMonth}
                className="p-2 rounded-xl bg-white/60 hover:bg-white transition-all"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 mb-2">
            {weekDays.map(day => (
              <div key={day} className="text-center font-semibold text-gray-600 py-2">
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {getDaysInMonth().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dayBookings = getBookingsForDate(date);
              const isToday = date.toDateString() === new Date().toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();

              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`aspect-square p-2 rounded-2xl border-2 transition-all hover:border-emerald-400 ${
                    isToday ? 'border-emerald-500 bg-emerald-50' :
                    isSelected ? 'border-teal-500 bg-teal-50' :
                    'border-gray-200 bg-white/40'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-900 mb-1">
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 2).map(booking => (
                      <div
                        key={booking.id}
                        className={`text-xs px-1 py-0.5 rounded border truncate ${getStatusColor(booking.estado)}`}
                      >
                        {booking.hora_servicio}
                      </div>
                    ))}
                    {dayBookings.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{dayBookings.length - 2} more
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {selectedDate && (
            <div className="mt-8 pt-8 border-t border-gray-200">
              <h4 className="text-lg font-bold text-gray-900 mb-4">
                Bookings for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>
              {getBookingsForDate(selectedDate).length === 0 ? (
                <p className="text-gray-500 text-center py-8">No bookings for this date</p>
              ) : (
                <div className="space-y-3">
                  {getBookingsForDate(selectedDate).map(booking => (
                    <div key={booking.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-600" />
                          <span className="font-semibold text-gray-900">{booking.user_name}</span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.estado)}`}>
                          {booking.estado}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          <span>{booking.hora_servicio}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold text-emerald-600">
                            {formatCurrency(booking.precio_final)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">All Bookings</h3>
          {bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-12">No bookings found</p>
          ) : (
            <div className="space-y-4">
              {bookings.map(booking => (
                <div key={booking.id} className="bg-white/40 border border-gray-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-lg transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="w-5 h-5 text-gray-600" />
                        <span className="font-bold text-lg text-gray-900">{booking.user_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(booking.fecha_servicio).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{booking.hora_servicio}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-emerald-600 mb-2">
                        {formatCurrency(booking.precio_final)}
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(booking.estado)}`}>
                        {booking.estado}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <span className={`text-sm ${booking.pago_completado ? 'text-green-600 font-medium' : 'text-orange-600'}`}>
                      {booking.pago_completado ? 'Paid' : 'Payment Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
