import { useState, useEffect } from 'react';
import { ClipboardCheck, Calendar, MapPin, Camera, Navigation as NavigationIcon, Clock, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Booking, User as UserType, Employee } from '../types';
import { formatCurrency } from '../utils/pricing';
import { WorkDetails } from './WorkDetails';

interface BookingWithDetails extends Booking {
  user?: UserType;
}

export const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todayBookings, setTodayBookings] = useState<BookingWithDetails[]>([]);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress'>('all');

  useEffect(() => {
    if (user) {
      loadEmployeeData();
    }
  }, [user]);

  const loadEmployeeData = async () => {
    if (!user) return;

    const { data: employeeData } = await supabase
      .from('employees')
      .select('*')
      .eq('email', user.email)
      .maybeSingle();

    if (employeeData) {
      setEmployee(employeeData as Employee);
      await loadTodayBookings(employeeData.id);
    }

    setLoading(false);
  };

  const loadTodayBookings = async (employeeId: string) => {
    const today = new Date().toISOString().split('T')[0];

    const { data: bookings } = await supabase
      .from('bookings')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('fecha_servicio', today)
      .in('estado', ['confirmed', 'in_progress'])
      .order('hora_servicio', { ascending: true });

    if (bookings) {
      const bookingsWithDetails = await Promise.all(
        bookings.map(async (booking) => {
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', booking.user_id)
            .maybeSingle();

          return {
            ...booking,
            user: userData || undefined,
          } as BookingWithDetails;
        })
      );

      setTodayBookings(bookingsWithDetails);
    }
  };

  const getFilteredBookings = () => {
    if (activeFilter === 'all') return todayBookings;
    return todayBookings.filter(b => {
      if (activeFilter === 'pending') return b.estado === 'confirmed';
      if (activeFilter === 'in_progress') return b.estado === 'in_progress';
      return true;
    });
  };

  const getTimeStatus = (booking: Booking) => {
    const now = new Date();
    const bookingTime = new Date(`${booking.fecha_servicio}T${booking.hora_servicio}`);
    const diff = bookingTime.getTime() - now.getTime();
    const minutesDiff = Math.floor(diff / 60000);

    if (minutesDiff < -30) return { status: 'overdue', label: 'Overdue', color: 'text-red-600' };
    if (minutesDiff < 0) return { status: 'ongoing', label: 'Ongoing', color: 'text-orange-600' };
    if (minutesDiff < 60) return { status: 'soon', label: 'Starting Soon', color: 'text-yellow-600' };
    return { status: 'scheduled', label: 'Scheduled', color: 'text-blue-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Employee Profile Found</h2>
          <p className="text-gray-600">Please contact your administrator to set up your employee profile.</p>
        </div>
      </div>
    );
  }

  if (selectedBooking) {
    return (
      <WorkDetails
        booking={selectedBooking}
        onBack={() => {
          setSelectedBooking(null);
          if (employee) loadTodayBookings(employee.id);
        }}
      />
    );
  }

  const filteredBookings = getFilteredBookings();
  const pendingCount = todayBookings.filter(b => b.estado === 'confirmed').length;
  const inProgressCount = todayBookings.filter(b => b.estado === 'in_progress').length;

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 relative overflow-hidden">
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-br from-emerald-200/20 via-teal-200/20 to-cyan-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-gradient-to-br from-blue-200/20 via-cyan-200/20 to-teal-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent">
                Welcome, {employee.nombre}!
              </h1>
              <p className="text-gray-600">Employee Dashboard - Today's Schedule</p>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{todayBookings.length}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Today's Jobs</h3>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-orange-400 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{pendingCount}</span>
            </div>
            <h3 className="text-gray-600 font-medium">Pending Start</h3>
          </div>

          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-6 hover:shadow-2xl transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-3xl font-bold text-gray-900">{inProgressCount}</span>
            </div>
            <h3 className="text-gray-600 font-medium">In Progress</h3>
          </div>
        </div>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              activeFilter === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            All ({todayBookings.length})
          </button>
          <button
            onClick={() => setActiveFilter('pending')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              activeFilter === 'pending'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setActiveFilter('in_progress')}
            className={`px-6 py-2 rounded-xl font-semibold transition-all ${
              activeFilter === 'in_progress'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                : 'bg-white/60 text-gray-700 hover:bg-white'
            }`}
          >
            In Progress ({inProgressCount})
          </button>
        </div>

        {filteredBookings.length === 0 ? (
          <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] p-12 text-center">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Jobs Scheduled</h3>
            <p className="text-gray-500">
              {activeFilter === 'all'
                ? "You don't have any jobs scheduled for today."
                : `No jobs with status: ${activeFilter === 'pending' ? 'Pending' : 'In Progress'}`}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredBookings.map((booking) => {
              const timeStatus = getTimeStatus(booking);
              return (
                <div
                  key={booking.id}
                  className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-xl font-bold text-gray-900">
                          Job #{booking.id.slice(0, 8)}
                        </h3>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            booking.estado === 'in_progress'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {booking.estado === 'in_progress' ? 'In Progress' : 'Not Started'}
                        </span>
                        <span className={`text-sm font-medium ${timeStatus.color}`}>
                          {timeStatus.label}
                        </span>
                      </div>

                      {booking.user && (
                        <div className="mb-3 p-3 bg-gray-50 rounded-xl">
                          <p className="font-semibold text-gray-900">{booking.user.nombre}</p>
                          <p className="text-sm text-gray-600">{booking.user.telefono}</p>
                        </div>
                      )}

                      <div className="grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {booking.hora_servicio} ({booking.estimated_duration || 120} min)
                        </div>
                        {booking.service_address && (
                          <div className="flex items-start gap-2 sm:col-span-2">
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <span>{booking.service_address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-emerald-600 mb-2">
                        {formatCurrency(booking.precio_final)}
                      </p>
                      <button
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBooking(booking);
                        }}
                      >
                        <ClipboardCheck className="w-4 h-4" />
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="mt-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-emerald-900 mb-1">Important Reminders</h3>
              <ul className="text-sm text-emerald-700 space-y-1">
                <li>• Click on a job to view details, complete checklist, and upload photos</li>
                <li>• Record your location when starting and completing each job</li>
                <li>• Take before and after photos for documentation</li>
                <li>• Complete all required checklist items before finishing a job</li>
                <li>• Add notes if you encounter any issues or special circumstances</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
