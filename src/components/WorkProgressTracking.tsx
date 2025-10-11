import { useState, useEffect } from 'react';
import { Activity, Calendar, Camera, CheckCircle, MapPin, Clock, User, Eye } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Booking, Employee, User as UserType, BookingPhoto, BookingLocation } from '../types';
import { formatCurrency } from '../utils/pricing';
import { getChecklistProgress } from '../utils/checklistHelpers';
import { getBookingPhotos } from '../utils/photoUpload';
import { getBookingLocations } from '../utils/locationTracking';

interface BookingWithDetails extends Booking {
  user?: UserType;
  employee?: Employee;
  progress?: { total: number; completed: number; percentage: number };
  photos?: BookingPhoto[];
  locations?: BookingLocation[];
}

export const WorkProgressTracking = () => {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);

  useEffect(() => {
    loadBookings();
  }, [selectedDate]);

  const loadBookings = async () => {
    setLoading(true);

    const { data: bookingsData, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('fecha_servicio', selectedDate)
      .not('employee_id', 'is', null)
      .order('hora_servicio', { ascending: true });

    if (error || !bookingsData) {
      setLoading(false);
      return;
    }

    const enrichedBookings = await Promise.all(
      bookingsData.map(async (booking) => {
        const [userResult, employeeResult, progress, photos, locations] = await Promise.all([
          supabase.from('users').select('*').eq('id', booking.user_id).maybeSingle(),
          booking.employee_id
            ? supabase.from('employees').select('*').eq('id', booking.employee_id).maybeSingle()
            : Promise.resolve({ data: null }),
          getChecklistProgress(booking.id),
          getBookingPhotos(booking.id),
          getBookingLocations(booking.id),
        ]);

        return {
          ...booking,
          user: userResult.data || undefined,
          employee: employeeResult.data || undefined,
          progress,
          photos,
          locations,
        } as BookingWithDetails;
      })
    );

    setBookings(enrichedBookings);
    setLoading(false);
  };

  const getStatusColor = (estado: string) => {
    switch (estado) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTotalStats = () => {
    const total = bookings.length;
    const completed = bookings.filter(b => b.estado === 'completed').length;
    const inProgress = bookings.filter(b => b.estado === 'in_progress').length;
    const notStarted = bookings.filter(b => b.estado === 'confirmed').length;
    const avgProgress =
      bookings.length > 0
        ? Math.round(
            bookings.reduce((sum, b) => sum + (b.progress?.percentage || 0), 0) / bookings.length
          )
        : 0;

    return { total, completed, inProgress, notStarted, avgProgress };
  };

  const stats = getTotalStats();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (selectedBooking) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => setSelectedBooking(null)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          ← Back to Overview
        </button>

        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Job #{selectedBooking.id.slice(0, 8)}
              </h2>
              {selectedBooking.user && (
                <div>
                  <p className="text-lg font-semibold text-gray-700">{selectedBooking.user.nombre}</p>
                  <p className="text-gray-600">{selectedBooking.user.telefono}</p>
                </div>
              )}
              {selectedBooking.employee && (
                <div className="mt-2 p-3 bg-emerald-50 rounded-xl inline-block">
                  <p className="text-sm font-semibold text-emerald-900">
                    Assigned to: {selectedBooking.employee.nombre}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(selectedBooking.precio_final)}</p>
              <span className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(selectedBooking.estado)}`}>
                {selectedBooking.estado}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Checklist Progress</h3>
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Completion</span>
                  <span className="text-sm font-bold text-emerald-600">
                    {selectedBooking.progress?.percentage}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all"
                    style={{ width: `${selectedBooking.progress?.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-600">
                  {selectedBooking.progress?.completed} of {selectedBooking.progress?.total} items completed
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Time & Location</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span>{selectedBooking.hora_servicio} ({selectedBooking.estimated_duration || 120} min)</span>
                </div>
                {selectedBooking.service_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{selectedBooking.service_address}</span>
                  </div>
                )}
                {selectedBooking.locations && selectedBooking.locations.length > 0 && (
                  <div className="mt-2 p-3 bg-blue-50 rounded-xl">
                    <p className="font-semibold text-blue-900 mb-1">GPS Records:</p>
                    {selectedBooking.locations.map((loc) => (
                      <div key={loc.id} className="text-xs text-blue-700">
                        {loc.location_type === 'start' ? '📍 Start' : '🏁 End'}: {loc.latitude.toFixed(6)}, {loc.longitude.toFixed(6)}
                        <span className="ml-2">({new Date(loc.recorded_at).toLocaleTimeString()})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos ({selectedBooking.photos?.length || 0})</h3>
            {selectedBooking.photos && selectedBooking.photos.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {selectedBooking.photos.map((photo) => (
                  <div key={photo.id} className="relative group">
                    <img
                      src={photo.photo_url}
                      alt={`${photo.photo_type} photo`}
                      className="w-full h-32 object-cover rounded-xl"
                    />
                    <span className={`absolute top-2 right-2 px-2 py-1 text-xs font-medium rounded ${
                      photo.photo_type === 'before' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'
                    }`}>
                      {photo.photo_type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No photos uploaded yet</p>
            )}
          </div>

          {selectedBooking.employee_notes && (
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Employee Notes</h3>
              <p className="text-gray-700 whitespace-pre-wrap">{selectedBooking.employee_notes}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-pink-400 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Work Progress Tracking</h2>
            <p className="text-gray-600">Monitor real-time job completion status</p>
          </div>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        />
      </div>

      <div className="grid sm:grid-cols-5 gap-4">
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">Total Jobs</p>
          <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-emerald-200 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">Completed</p>
          <p className="text-2xl font-bold text-emerald-600">{stats.completed}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-blue-200 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">Not Started</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.notStarted}</p>
        </div>
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-4">
          <p className="text-sm text-gray-600 mb-1">Avg Progress</p>
          <p className="text-2xl font-bold text-gray-900">{stats.avgProgress}%</p>
        </div>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] p-12 text-center">
          <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Jobs Scheduled</h3>
          <p className="text-gray-500">
            No bookings assigned for {new Date(selectedDate).toLocaleDateString()}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-all"
            >
              <div className="flex justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-lg font-bold text-gray-900">Job #{booking.id.slice(0, 8)}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.estado)}`}>
                      {booking.estado}
                    </span>
                  </div>

                  {booking.employee && (
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">{booking.employee.nombre}</span>
                    </div>
                  )}

                  {booking.user && (
                    <p className="text-sm text-gray-600 mb-3">Client: {booking.user.nombre}</p>
                  )}

                  <div className="bg-gray-50 rounded-xl p-3 mb-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-gray-600">Checklist Progress</span>
                      <span className="text-xs font-bold text-emerald-600">{booking.progress?.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 h-2 rounded-full transition-all"
                        style={{ width: `${booking.progress?.percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Camera className="w-4 h-4 text-gray-400" />
                      <span>{booking.photos?.length || 0} photos</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span>{booking.locations?.length || 0} GPS records</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CheckCircle className="w-4 h-4 text-gray-400" />
                      <span>
                        {booking.progress?.completed}/{booking.progress?.total} items
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold text-emerald-600 mb-2">
                    {formatCurrency(booking.precio_final)}
                  </p>
                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg transition-all text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
