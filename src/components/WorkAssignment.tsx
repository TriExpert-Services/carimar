import { useState, useEffect } from 'react';
import { UserCheck, Calendar, MapPin, Clock, AlertCircle, CheckCircle, Filter } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Employee, User } from '../types';
import { formatCurrency } from '../utils/pricing';

interface BookingWithUser extends Booking {
  user?: User;
  employee?: Employee;
}

export const WorkAssignment = () => {
  const [bookings, setBookings] = useState<BookingWithUser[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unassigned' | 'assigned'>('all');
  const [selectedDate, setSelectedDate] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [bookingsResult, employeesResult] = await Promise.all([
      supabase
        .from('bookings')
        .select('*')
        .order('fecha_servicio', { ascending: true })
        .order('hora_servicio', { ascending: true }),
      supabase.from('employees').select('*').eq('active', true).order('nombre', { ascending: true }),
    ]);

    if (bookingsResult.data) {
      const bookingsWithDetails = await Promise.all(
        bookingsResult.data.map(async (booking) => {
          const [userResult, employeeResult] = await Promise.all([
            supabase.from('users').select('*').eq('id', booking.user_id).maybeSingle(),
            booking.employee_id
              ? supabase.from('employees').select('*').eq('id', booking.employee_id).maybeSingle()
              : Promise.resolve({ data: null }),
          ]);

          return {
            ...booking,
            user: userResult.data || undefined,
            employee: employeeResult.data || undefined,
          } as BookingWithUser;
        })
      );
      setBookings(bookingsWithDetails);
    }

    if (employeesResult.data) setEmployees(employeesResult.data as Employee[]);
    setLoading(false);
  };

  const assignEmployee = async (bookingId: string, employeeId: string) => {
    await supabase.from('bookings').update({ employee_id: employeeId }).eq('id', bookingId);

    await supabase.from('notifications').insert([
      {
        user_id: bookings.find(b => b.id === bookingId)?.user_id,
        type: 'booking_assigned',
        title: 'Employee Assigned',
        message: 'An employee has been assigned to your booking.',
        link: '/client-dashboard',
      },
    ]);

    loadData();
  };

  const unassignEmployee = async (bookingId: string) => {
    await supabase.from('bookings').update({ employee_id: null }).eq('id', bookingId);
    loadData();
  };

  const checkEmployeeAvailability = (employeeId: string, bookingDate: string, bookingTime: string): boolean => {
    const conflictingBookings = bookings.filter(
      b =>
        b.employee_id === employeeId &&
        b.fecha_servicio === bookingDate &&
        b.estado !== 'cancelled' &&
        b.estado !== 'completed'
    );

    if (conflictingBookings.length === 0) return true;

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const bookingStart = timeToMinutes(bookingTime);

    return !conflictingBookings.some(cb => {
      const cbStart = timeToMinutes(cb.hora_servicio);
      const cbEnd = cbStart + (cb.estimated_duration || 120);
      const bookingEnd = bookingStart + 120;

      return (
        (bookingStart >= cbStart && bookingStart < cbEnd) ||
        (bookingEnd > cbStart && bookingEnd <= cbEnd) ||
        (bookingStart <= cbStart && bookingEnd >= cbEnd)
      );
    });
  };

  const filteredBookings = bookings.filter(booking => {
    if (filterStatus === 'unassigned' && booking.employee_id) return false;
    if (filterStatus === 'assigned' && !booking.employee_id) return false;
    if (selectedDate && booking.fecha_servicio !== selectedDate) return false;
    return true;
  });

  const unassignedCount = bookings.filter(b => !b.employee_id && b.estado !== 'cancelled').length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
            <UserCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Work Assignment</h2>
            <p className="text-gray-600">Assign employees to bookings</p>
          </div>
        </div>

        {unassignedCount > 0 && (
          <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 text-yellow-800 rounded-xl">
            <AlertCircle className="w-5 h-5" />
            <span className="font-semibold">{unassignedCount} unassigned bookings</span>
          </div>
        )}
      </div>

      <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-3">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="font-semibold text-gray-700">Filters</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Bookings</option>
              <option value="unassigned">Unassigned Only</option>
              <option value="assigned">Assigned Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setFilterStatus('all');
                setSelectedDate('');
              }}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredBookings.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] p-12 text-center">
            <UserCheck className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-500">No bookings found</p>
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <div
              key={booking.id}
              className={`bg-white/60 backdrop-blur-sm border rounded-2xl p-6 hover:shadow-lg transition-all ${
                booking.employee_id
                  ? 'border-green-200 bg-green-50/30'
                  : 'border-yellow-200 bg-yellow-50/30'
              }`}
            >
              <div className="flex justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-bold text-gray-900">
                      Booking #{booking.id.slice(0, 8)}
                    </h3>
                    {booking.employee_id ? (
                      <span className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                        <CheckCircle className="w-3 h-3" />
                        Assigned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                        <AlertCircle className="w-3 h-3" />
                        Unassigned
                      </span>
                    )}
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        booking.estado === 'confirmed'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.estado === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {booking.estado}
                    </span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {new Date(booking.fecha_servicio).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {booking.hora_servicio} ({booking.estimated_duration || 120} min)
                    </div>
                    {booking.service_address && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {booking.service_address}
                      </div>
                    )}
                  </div>

                  {booking.user && (
                    <div className="bg-white/60 rounded-xl p-3 mb-3">
                      <p className="text-sm font-semibold text-gray-700">Client: {booking.user.nombre}</p>
                      <p className="text-xs text-gray-600">{booking.user.email}</p>
                      {booking.user.telefono && (
                        <p className="text-xs text-gray-600">{booking.user.telefono}</p>
                      )}
                    </div>
                  )}

                  {booking.employee && (
                    <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-200">
                      <p className="text-sm font-semibold text-emerald-900">
                        Assigned to: {booking.employee.nombre}
                      </p>
                      <p className="text-xs text-emerald-700">{booking.employee.email}</p>
                      <p className="text-xs text-emerald-700">{booking.employee.telefono}</p>
                    </div>
                  )}
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600 mb-2">
                    {formatCurrency(booking.precio_final)}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {booking.employee_id ? 'Change Employee' : 'Assign Employee'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={booking.employee_id || ''}
                    onChange={(e) => assignEmployee(booking.id, e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  >
                    <option value="">Select an employee...</option>
                    {employees.map((employee) => {
                      const isAvailable = checkEmployeeAvailability(
                        employee.id,
                        booking.fecha_servicio,
                        booking.hora_servicio
                      );
                      return (
                        <option
                          key={employee.id}
                          value={employee.id}
                          disabled={!isAvailable && employee.id !== booking.employee_id}
                        >
                          {employee.nombre} {!isAvailable && employee.id !== booking.employee_id ? '(Busy)' : ''}
                        </option>
                      );
                    })}
                  </select>

                  {booking.employee_id && (
                    <button
                      onClick={() => unassignEmployee(booking.id)}
                      className="px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-medium"
                    >
                      Unassign
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {employees.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900 mb-1">No Active Employees</h3>
              <p className="text-sm text-yellow-700">
                You need to add employees before you can assign them to bookings. Go to the Employees tab to add team members.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
