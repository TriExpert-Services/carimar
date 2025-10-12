import { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock, MapPin, User, DollarSign, Package, AlertCircle, CheckCircle, XCircle, CreditCard } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Quote, Order, OrderItem, OrderWithDetails } from '../types';
import { formatCurrency } from '../utils/pricing';

interface BookingWithDetails extends Booking {
  quote?: Quote;
  user_name?: string;
}

type ViewType = 'orders' | 'bookings' | 'all';
type DisplayMode = 'calendar' | 'list';

export const OrdersCalendar = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [orders, setOrders] = useState<OrderWithDetails[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<DisplayMode>('calendar');
  const [viewType, setViewType] = useState<ViewType>('all');
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null);

  useEffect(() => {
    loadData();
  }, [currentDate, viewType]);

  const loadData = async () => {
    setLoading(true);

    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

    const promises = [];

    if (viewType === 'bookings' || viewType === 'all') {
      promises.push(
        supabase
          .from('bookings')
          .select('*, users(nombre)')
          .gte('fecha_servicio', startOfMonth.toISOString().split('T')[0])
          .lte('fecha_servicio', endOfMonth.toISOString().split('T')[0])
          .order('fecha_servicio', { ascending: true })
      );
    } else {
      promises.push(Promise.resolve({ data: [] }));
    }

    if (viewType === 'orders' || viewType === 'all') {
      promises.push(
        supabase
          .from('orders')
          .select('*, users!orders_client_id_fkey(nombre, email, telefono), order_items(*)')
          .gte('service_date', startOfMonth.toISOString())
          .lte('service_date', endOfMonth.toISOString())
          .order('service_date', { ascending: true })
      );
    } else {
      promises.push(Promise.resolve({ data: [] }));
    }

    promises.push(
      supabase
        .from('quotes')
        .select('*')
        .order('created_at', { ascending: false })
    );

    const [bookingsResult, ordersResult, quotesResult] = await Promise.all(promises);

    if (bookingsResult.data) {
      const bookingsWithDetails = bookingsResult.data.map((booking: any) => ({
        ...booking,
        user_name: booking.users?.nombre || 'Unknown',
      }));
      setBookings(bookingsWithDetails);
    }

    if (ordersResult.data) {
      const ordersWithDetails = ordersResult.data.map((order: any) => ({
        ...order,
        client_name: order.users?.nombre || 'Unknown',
        client_email: order.users?.email || '',
        client_phone: order.users?.telefono || '',
        order_items: order.order_items || [],
      }));
      setOrders(ordersWithDetails);
    }

    if (quotesResult.data) {
      setQuotes(quotesResult.data as Quote[]);
    }

    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      loadData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: status as any });
      }
    }
  };

  const updateOrderPaymentStatus = async (orderId: string, paymentStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (!error) {
      loadData();
      if (selectedOrder?.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: paymentStatus as any });
      }
    }
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

  const getOrdersForDate = (date: Date) => {
    return orders.filter(order => {
      const orderDate = new Date(order.service_date);
      return orderDate.toDateString() === date.toDateString();
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
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600';
      case 'unpaid':
        return 'text-orange-600';
      case 'failed':
        return 'text-red-600';
      case 'refunded':
        return 'text-gray-600';
      default:
        return 'text-gray-500';
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
            <p className="text-gray-600">Manage orders, bookings and view schedule</p>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-2 bg-white/60 p-1 rounded-xl">
            <button
              onClick={() => setViewType('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'all'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setViewType('orders')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'orders'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              Orders ({orders.length})
            </button>
            <button
              onClick={() => setViewType('bookings')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewType === 'bookings'
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              Bookings ({bookings.length})
            </button>
          </div>

          <div className="flex gap-2 bg-white/60 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'calendar'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              Calendar
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                viewMode === 'list'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                  : 'text-gray-700 hover:bg-white'
              }`}
            >
              List
            </button>
          </div>
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
              const dayOrders = getOrdersForDate(date);
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
                    {(viewType === 'orders' || viewType === 'all') && dayOrders.slice(0, 1).map(order => (
                      <div
                        key={order.id}
                        className={`text-xs px-1 py-0.5 rounded border truncate ${getStatusColor(order.status)}`}
                        title={`Order: ${order.service_type}`}
                      >
                        {order.service_time}
                      </div>
                    ))}
                    {(viewType === 'bookings' || viewType === 'all') && dayBookings.slice(0, 1).map(booking => (
                      <div
                        key={booking.id}
                        className={`text-xs px-1 py-0.5 rounded border truncate bg-blue-100 text-blue-800 border-blue-200`}
                        title={`Booking: ${booking.user_name}`}
                      >
                        {booking.hora_servicio}
                      </div>
                    ))}
                    {(dayBookings.length + dayOrders.length) > 2 && (
                      <div className="text-xs text-gray-500">
                        +{(dayBookings.length + dayOrders.length) - 2} more
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
                Schedule for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </h4>

              {(viewType === 'orders' || viewType === 'all') && getOrdersForDate(selectedDate).length > 0 && (
                <div className="mb-6">
                  <h5 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Orders ({getOrdersForDate(selectedDate).length})
                  </h5>
                  <div className="space-y-3">
                    {getOrdersForDate(selectedDate).map(order => (
                      <div key={order.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4 hover:border-emerald-400 transition-all cursor-pointer" onClick={() => setSelectedOrder(order)}>
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold text-gray-900">{order.client_name}</span>
                            {order.created_by_agent && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">AI Agent</span>
                            )}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{order.service_time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <DollarSign className="w-4 h-4" />
                            <span className="font-semibold text-emerald-600">
                              {formatCurrency(order.total_amount)}
                            </span>
                          </div>
                          <div className="col-span-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{order.service_address}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                          <span className="text-sm text-gray-600">{order.service_type}</span>
                          <span className={`text-sm font-medium ${getPaymentStatusColor(order.payment_status)}`}>
                            {order.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(viewType === 'bookings' || viewType === 'all') && getBookingsForDate(selectedDate).length > 0 && (
                <div>
                  <h5 className="text-md font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Bookings ({getBookingsForDate(selectedDate).length})
                  </h5>
                  <div className="space-y-3">
                    {getBookingsForDate(selectedDate).map(booking => (
                      <div key={booking.id} className="bg-white/40 border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-600" />
                            <span className="font-semibold text-gray-900">{booking.user_name}</span>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200`}>
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
                </div>
              )}

              {getBookingsForDate(selectedDate).length === 0 && getOrdersForDate(selectedDate).length === 0 && (
                <p className="text-gray-500 text-center py-8">No orders or bookings for this date</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {(viewType === 'orders' || viewType === 'all') && (
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Package className="w-6 h-6" />
                All Orders ({orders.length})
              </h3>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-center py-12">No orders found</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order.id} className="bg-white/40 border border-gray-200 rounded-2xl p-6 hover:border-emerald-400 hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedOrder(order)}>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-gray-600" />
                            <span className="font-bold text-lg text-gray-900">{order.client_name}</span>
                            {order.created_by_agent && (
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full font-medium">AI Agent Order</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{order.client_email}</p>
                          {order.client_phone && (
                            <p className="text-sm text-gray-600">{order.client_phone}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-emerald-600 mb-2">
                            {formatCurrency(order.total_amount)}
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(order.service_date).toLocaleDateString()}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          <span>{order.service_time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 md:col-span-2">
                          <MapPin className="w-4 h-4" />
                          <span>{order.service_address}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-xl p-3 mb-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Service: {order.service_type}</h4>
                        {order.order_items && order.order_items.length > 0 && (
                          <div className="space-y-1">
                            {order.order_items.map(item => (
                              <div key={item.id} className="flex justify-between text-sm text-gray-600">
                                <span>{item.service_name} x{item.quantity}</span>
                                <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {order.special_instructions && (
                        <div className="bg-blue-50 rounded-xl p-3 mb-4">
                          <p className="text-sm text-gray-700">
                            <span className="font-semibold">Special Instructions:</span> {order.special_instructions}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className={`text-sm font-medium flex items-center gap-1 ${getPaymentStatusColor(order.payment_status)}`}>
                          <CreditCard className="w-4 h-4" />
                          Payment: {order.payment_status}
                        </span>
                        {order.agent_session_id && (
                          <span className="text-xs text-gray-400">Session: {order.agent_session_id.slice(0, 8)}...</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {(viewType === 'bookings' || viewType === 'all') && (
            <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Calendar className="w-6 h-6" />
                All Bookings ({bookings.length})
              </h3>
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
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border bg-blue-100 text-blue-800 border-blue-200`}>
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
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-1">Order Details</h3>
                  <p className="text-sm text-gray-500">Order ID: {selectedOrder.id.slice(0, 8)}...</p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-all"
                >
                  <XCircle className="w-6 h-6 text-gray-600" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900">{selectedOrder.client_name}</h4>
                      <p className="text-sm text-gray-600">{selectedOrder.client_email}</p>
                      {selectedOrder.client_phone && (
                        <p className="text-sm text-gray-600">{selectedOrder.client_phone}</p>
                      )}
                    </div>
                    {selectedOrder.created_by_agent && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm rounded-full font-medium">AI Agent</span>
                    )}
                  </div>
                  <div className="text-3xl font-bold text-emerald-600">
                    {formatCurrency(selectedOrder.total_amount)}
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Service Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedOrder.service_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Service Time</p>
                    <p className="font-semibold text-gray-900">{selectedOrder.service_time}</p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-1">Service Address</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.service_address}</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs text-gray-500 mb-2">Service Type</p>
                  <p className="font-semibold text-gray-900">{selectedOrder.service_type}</p>
                </div>

                {selectedOrder.order_items && selectedOrder.order_items.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-3">Order Items</p>
                    <div className="space-y-2">
                      {selectedOrder.order_items.map(item => (
                        <div key={item.id} className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{item.service_name}</p>
                            {item.description && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                            <p className="text-sm text-gray-500">Qty: {item.quantity} × {formatCurrency(item.unit_price)}</p>
                          </div>
                          <p className="font-semibold text-gray-900">{formatCurrency(item.subtotal)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedOrder.special_instructions && (
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-xs text-gray-500 mb-2">Special Instructions</p>
                    <p className="text-gray-900">{selectedOrder.special_instructions}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Order Status</label>
                    <select
                      value={selectedOrder.status}
                      onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Payment Status</label>
                    <select
                      value={selectedOrder.payment_status}
                      onChange={(e) => updateOrderPaymentStatus(selectedOrder.id, e.target.value)}
                      className="w-full px-4 py-2 rounded-xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
                  >
                    Close
                  </button>
                  {selectedOrder.status === 'completed' && (
                    <button
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-medium"
                    >
                      Generate Invoice
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
