import { useState, useEffect } from 'react';
import { MapPin, Clock, Navigation, User, Calendar, Printer, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Employee, User as UserType } from '../types';
import { formatCurrency } from '../utils/pricing';

interface BookingWithDetails extends Booking {
  user?: UserType;
}

interface EmployeeSchedule {
  employee: Employee;
  bookings: BookingWithDetails[];
  totalHours: number;
  totalRevenue: number;
}

export const DailyRoutes = () => {
  const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules();
  }, [selectedDate]);

  const loadSchedules = async () => {
    setLoading(true);

    const bookingsResult = await supabase
      .from('bookings')
      .select('*')
      .eq('fecha_servicio', selectedDate)
      .not('employee_id', 'is', null)
      .in('estado', ['confirmed', 'in_progress'])
      .order('hora_servicio', { ascending: true });

    if (!bookingsResult.data) {
      setLoading(false);
      return;
    }

    const bookingsWithDetails = await Promise.all(
      bookingsResult.data.map(async (booking) => {
        const userResult = await supabase
          .from('users')
          .select('*')
          .eq('id', booking.user_id)
          .maybeSingle();

        return {
          ...booking,
          user: userResult.data || undefined,
        } as BookingWithDetails;
      })
    );

    const employeeIds = [...new Set(bookingsWithDetails.map(b => b.employee_id))];
    const employeesResult = await supabase
      .from('employees')
      .select('*')
      .in('id', employeeIds);

    if (employeesResult.data) {
      const employeeSchedules: EmployeeSchedule[] = employeesResult.data.map((employee: Employee) => {
        const employeeBookings = bookingsWithDetails.filter(
          b => b.employee_id === employee.id
        );

        const totalHours = employeeBookings.reduce(
          (sum, b) => sum + (b.estimated_duration || 120) / 60,
          0
        );

        const totalRevenue = employeeBookings.reduce(
          (sum, b) => sum + b.precio_final,
          0
        );

        return {
          employee,
          bookings: employeeBookings,
          totalHours,
          totalRevenue,
        };
      });

      setSchedules(employeeSchedules.sort((a, b) =>
        a.employee.nombre.localeCompare(b.employee.nombre)
      ));
    }

    setLoading(false);
  };

  const handlePrint = () => {
    window.print();
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  const getTravelTime = (booking1: BookingWithDetails, booking2: BookingWithDetails): number => {
    if (!booking1.service_address || !booking2.service_address) return 15;
    return 20;
  };

  const totalBookings = schedules.reduce((sum, s) => sum + s.bookings.length, 0);
  const totalRevenue = schedules.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalHours = schedules.reduce((sum, s) => sum + s.totalHours, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4 print:mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center print:hidden">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Daily Routes</h2>
            <p className="text-gray-600 print:hidden">Optimized schedules by employee and location</p>
          </div>
        </div>

        <div className="flex gap-3 print:hidden">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/50 transition-all font-semibold"
          >
            <Printer className="w-5 h-5" />
            Print Routes
          </button>
        </div>
      </div>

      <div className="grid sm:grid-cols-4 gap-4 print:mb-6">
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 print:border print:border-gray-300">
          <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
          <p className="text-2xl font-bold text-gray-900">{totalBookings}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 print:border print:border-gray-300">
          <p className="text-sm text-gray-600 mb-1">Active Employees</p>
          <p className="text-2xl font-bold text-gray-900">{schedules.length}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 print:border print:border-gray-300">
          <p className="text-sm text-gray-600 mb-1">Total Hours</p>
          <p className="text-2xl font-bold text-gray-900">{totalHours.toFixed(1)}h</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 print:border print:border-gray-300">
          <p className="text-sm text-gray-600 mb-1">Expected Revenue</p>
          <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalRevenue)}</p>
        </div>
      </div>

      {schedules.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Routes Scheduled</h3>
          <p className="text-gray-500">
            No bookings assigned for {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {schedules.map((schedule, index) => (
            <div
              key={schedule.employee.id}
              className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl overflow-hidden print:break-inside-avoid print:mb-8 print:border print:border-gray-300"
            >
              <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-6 text-white print:bg-gray-100 print:text-gray-900">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <User className="w-6 h-6" />
                      <h3 className="text-2xl font-bold">{schedule.employee.nombre}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm opacity-90">
                      <span>{schedule.employee.telefono}</span>
                      <span>{schedule.employee.email}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm opacity-90 mb-1">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                    <p className="text-2xl font-bold">{schedule.bookings.length} stops</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  {schedule.bookings.map((booking, bookingIndex) => {
                    const startTime = timeToMinutes(booking.hora_servicio);
                    const endTime = startTime + (booking.estimated_duration || 120);
                    const nextBooking = schedule.bookings[bookingIndex + 1];
                    const travelTime = nextBooking ? getTravelTime(booking, nextBooking) : 0;

                    return (
                      <div key={booking.id} className="print:break-inside-avoid">
                        <div className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow print:border print:border-gray-300">
                          <div className="flex items-start gap-4">
                            <div className="flex flex-col items-center">
                              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-white font-bold print:bg-gray-200 print:text-gray-900">
                                {bookingIndex + 1}
                              </div>
                              {nextBooking && (
                                <div className="w-0.5 h-12 bg-gray-300 my-2"></div>
                              )}
                            </div>

                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-bold text-gray-900 mb-1">
                                    Booking #{booking.id.slice(0, 8)}
                                  </h4>
                                  {booking.user && (
                                    <p className="text-sm text-gray-600">
                                      Client: {booking.user.nombre}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-lg font-bold text-emerald-600">
                                    {formatCurrency(booking.precio_final)}
                                  </p>
                                </div>
                              </div>

                              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span>
                                    {booking.hora_servicio} - {formatTime(endTime)}
                                    <span className="text-gray-500 ml-1">
                                      ({booking.estimated_duration || 120} min)
                                    </span>
                                  </span>
                                </div>

                                {booking.service_address ? (
                                  <div className="flex items-start gap-2 text-gray-600 sm:col-span-2">
                                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <span>{booking.service_address}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 text-yellow-600 sm:col-span-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    <span className="text-xs">No address provided</span>
                                  </div>
                                )}
                              </div>

                              {booking.employee_notes && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg print:border print:border-blue-300">
                                  <p className="text-sm text-blue-900">
                                    <span className="font-semibold">Notes:</span> {booking.employee_notes}
                                  </p>
                                </div>
                              )}

                              {booking.user?.telefono && (
                                <div className="mt-2 text-sm text-gray-600">
                                  Contact: {booking.user.telefono}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {nextBooking && (
                          <div className="flex items-center gap-2 py-2 px-16 text-sm text-gray-500">
                            <Navigation className="w-4 h-4" />
                            <span>Travel time: ~{travelTime} minutes</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200 grid sm:grid-cols-3 gap-4 print:border-t print:border-gray-300">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
                    <p className="text-xl font-bold text-gray-900">{schedule.bookings.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Work Hours</p>
                    <p className="text-xl font-bold text-gray-900">{schedule.totalHours.toFixed(1)}h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                    <p className="text-xl font-bold text-emerald-600">
                      {formatCurrency(schedule.totalRevenue)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #root, #root * {
            visibility: visible;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:break-inside-avoid {
            break-inside: avoid;
          }
          .print\\:mb-8 {
            margin-bottom: 2rem;
          }
          .print\\:mb-6 {
            margin-bottom: 1.5rem;
          }
          .print\\:border {
            border-width: 1px;
          }
          .print\\:border-gray-300 {
            border-color: #d1d5db;
          }
          .print\\:bg-gray-100 {
            background-color: #f3f4f6 !important;
          }
          .print\\:text-gray-900 {
            color: #111827 !important;
          }
          .print\\:bg-gray-200 {
            background-color: #e5e7eb !important;
          }
        }
      `}</style>
    </div>
  );
};
