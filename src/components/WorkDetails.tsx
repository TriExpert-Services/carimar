import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  MapPin,
  Clock,
  Play,
  CheckCircle,
  Camera,
  Upload,
  X,
  Star,
  Navigation as NavigationIcon,
  AlertCircle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Booking, User as UserType, ChecklistItem, BookingChecklistCompletion } from '../types';
import { formatCurrency } from '../utils/pricing';
import { recordBookingLocation, getCurrentLocation } from '../utils/locationTracking';
import { uploadBookingPhoto, validateImageFile, compressImage, getBookingPhotos } from '../utils/photoUpload';
import { getBookingChecklistWithItems, updateChecklistItem, getChecklistProgress } from '../utils/checklistHelpers';

interface BookingWithUser extends Booking {
  user?: UserType;
}

interface Props {
  booking: BookingWithUser;
  onBack: () => void;
}

interface ChecklistItemWithCompletion extends BookingChecklistCompletion {
  item?: ChecklistItem;
}

interface BookingPhotoData {
  id: string;
  photo_url: string;
  photo_type: 'before' | 'after';
  room_area?: string;
}

export const WorkDetails = ({ booking, onBack }: Props) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'checklist' | 'photos' | 'notes'>('checklist');
  const [checklist, setChecklist] = useState<ChecklistItemWithCompletion[]>([]);
  const [photos, setPhotos] = useState<BookingPhotoData[]>([]);
  const [uploading, setUploading] = useState(false);
  const [locationRecorded, setLocationRecorded] = useState({ start: false, end: false });
  const [notes, setNotes] = useState(booking.employee_notes || '');
  const [progress, setProgress] = useState({ total: 0, completed: 0, percentage: 0 });
  const [isStarting, setIsStarting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadWorkData();
    checkLocationRecords();
  }, [booking.id]);

  const loadWorkData = async () => {
    const checklistData = await getBookingChecklistWithItems(booking.id);
    setChecklist(checklistData);

    const photosData = await getBookingPhotos(booking.id);
    setPhotos(photosData);

    const progressData = await getChecklistProgress(booking.id);
    setProgress(progressData);
  };

  const checkLocationRecords = async () => {
    const { data } = await supabase
      .from('booking_locations')
      .select('location_type')
      .eq('booking_id', booking.id);

    if (data) {
      setLocationRecorded({
        start: data.some(l => l.location_type === 'start'),
        end: data.some(l => l.location_type === 'end'),
      });
    }
  };

  const handleStartWork = async () => {
    setIsStarting(true);
    try {
      const locationResult = await recordBookingLocation(booking.id, 'start');

      if (!locationResult.success) {
        alert('Could not record location. Please enable location services.');
        setIsStarting(false);
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .update({ estado: 'in_progress' })
        .eq('id', booking.id);

      if (error) {
        alert('Error starting work: ' + error.message);
      } else {
        setLocationRecorded(prev => ({ ...prev, start: true }));
        booking.estado = 'in_progress';
        alert('Work started successfully! Location recorded.');
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setIsStarting(false);
  };

  const handleCompleteWork = async () => {
    if (progress.percentage < 100) {
      alert('Please complete all required checklist items before finishing.');
      return;
    }

    const beforePhotos = photos.filter(p => p.photo_type === 'before').length;
    const afterPhotos = photos.filter(p => p.photo_type === 'after').length;

    if (beforePhotos === 0 || afterPhotos === 0) {
      if (!confirm('You have not uploaded both before and after photos. Continue anyway?')) {
        return;
      }
    }

    setIsCompleting(true);
    try {
      const locationResult = await recordBookingLocation(booking.id, 'end');

      if (!locationResult.success) {
        alert('Could not record location. Please enable location services.');
        setIsCompleting(false);
        return;
      }

      const { error } = await supabase
        .from('bookings')
        .update({
          estado: 'completed',
          employee_notes: notes,
        })
        .eq('id', booking.id);

      if (error) {
        alert('Error completing work: ' + error.message);
      } else {
        await supabase.from('notifications').insert([
          {
            user_id: booking.user_id,
            type: 'booking_confirmed',
            title: 'Work Completed',
            message: 'Your cleaning service has been completed. Check the photos and details.',
            link: '/client-dashboard',
          },
        ]);

        setLocationRecorded(prev => ({ ...prev, end: true }));
        alert('Work completed successfully! Location recorded.');
        onBack();
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setIsCompleting(false);
  };

  const toggleChecklistItem = async (item: ChecklistItemWithCompletion) => {
    const newCompleted = !item.completed;
    const success = await updateChecklistItem(item.id, { completed: newCompleted });

    if (success) {
      setChecklist(prev =>
        prev.map(i => (i.id === item.id ? { ...i, completed: newCompleted } : i))
      );
      const progressData = await getChecklistProgress(booking.id);
      setProgress(progressData);
    }
  };

  const updateItemRating = async (item: ChecklistItemWithCompletion, rating: number) => {
    const success = await updateChecklistItem(item.id, { quality_rating: rating });
    if (success) {
      setChecklist(prev =>
        prev.map(i => (i.id === item.id ? { ...i, quality_rating: rating } : i))
      );
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, photoType: 'before' | 'after') => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;

    const file = e.target.files[0];
    const validation = validateImageFile(file);

    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setUploading(true);
    try {
      const compressedFile = await compressImage(file);
      const result = await uploadBookingPhoto({
        bookingId: booking.id,
        photoType,
        file: compressedFile,
        uploadedBy: user.id,
      });

      if (result.success && result.url) {
        const newPhotos = await getBookingPhotos(booking.id);
        setPhotos(newPhotos);
        alert(`${photoType === 'before' ? 'Before' : 'After'} photo uploaded successfully!`);
      } else {
        alert('Error uploading photo: ' + result.error);
      }
    } catch (error) {
      alert('Error: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
    setUploading(false);
  };

  const saveNotes = async () => {
    const { error } = await supabase
      .from('bookings')
      .update({ employee_notes: notes })
      .eq('id', booking.id);

    if (error) {
      alert('Error saving notes: ' + error.message);
    } else {
      alert('Notes saved successfully!');
    }
  };

  const beforePhotos = photos.filter(p => p.photo_type === 'before');
  const afterPhotos = photos.filter(p => p.photo_type === 'after');

  return (
    <section className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-8 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Job #{booking.id.slice(0, 8)}</h1>
              {booking.user && (
                <div className="mb-3 p-4 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-gray-900 text-lg">{booking.user.nombre}</p>
                  <p className="text-gray-600">{booking.user.email}</p>
                  <p className="text-gray-600">{booking.user.telefono}</p>
                </div>
              )}
              <div className="space-y-2 text-gray-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{booking.fecha_servicio} at {booking.hora_servicio}</span>
                  <span className="text-sm">({booking.estimated_duration || 120} minutes)</span>
                </div>
                {booking.service_address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    <span>{booking.service_address}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(booking.precio_final)}</p>
              <span
                className={`inline-block mt-2 px-4 py-2 rounded-full text-sm font-medium ${
                  booking.estado === 'in_progress'
                    ? 'bg-blue-100 text-blue-800'
                    : booking.estado === 'completed'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                {booking.estado === 'in_progress' ? 'In Progress' : booking.estado === 'completed' ? 'Completed' : 'Not Started'}
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            {booking.estado !== 'in_progress' && booking.estado !== 'completed' && (
              <button
                onClick={handleStartWork}
                disabled={isStarting || locationRecorded.start}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Play className="w-5 h-5" />
                {isStarting ? 'Starting...' : locationRecorded.start ? 'Already Started' : 'Start Work & Record Location'}
              </button>
            )}

            {booking.estado === 'in_progress' && (
              <button
                onClick={handleCompleteWork}
                disabled={isCompleting || locationRecorded.end}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed md:col-span-2"
              >
                <CheckCircle className="w-5 h-5" />
                {isCompleting ? 'Completing...' : locationRecorded.end ? 'Already Completed' : 'Complete Work & Record Location'}
              </button>
            )}
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Checklist Progress</span>
              <span className="text-sm font-bold text-emerald-600">{progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {progress.completed} of {progress.total} items completed
            </p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-8">
          <div className="flex gap-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('checklist')}
              className={`pb-3 px-4 font-semibold transition-all ${
                activeTab === 'checklist'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Checklist ({progress.total})
            </button>
            <button
              onClick={() => setActiveTab('photos')}
              className={`pb-3 px-4 font-semibold transition-all ${
                activeTab === 'photos'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Photos ({photos.length})
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`pb-3 px-4 font-semibold transition-all ${
                activeTab === 'notes'
                  ? 'border-b-2 border-emerald-500 text-emerald-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Notes
            </button>
          </div>

          {activeTab === 'checklist' && (
            <div className="space-y-3">
              {checklist.length === 0 ? (
                <div className="text-center py-12">
                  <AlertCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No checklist items for this job</p>
                </div>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className={`border rounded-xl p-4 transition-all ${
                      item.completed
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => toggleChecklistItem(item)}
                        className={`flex-shrink-0 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                          item.completed
                            ? 'bg-green-500 border-green-500'
                            : 'border-gray-300 hover:border-emerald-500'
                        }`}
                      >
                        {item.completed && <CheckCircle className="w-4 h-4 text-white" />}
                      </button>
                      <div className="flex-1">
                        <p className={`font-medium ${item.completed ? 'text-green-900 line-through' : 'text-gray-900'}`}>
                          {item.item?.name_en}
                          {item.item?.is_required && <span className="text-red-500 ml-1">*</span>}
                        </p>
                        {item.item?.description_en && (
                          <p className="text-sm text-gray-600 mt-1">{item.item.description_en}</p>
                        )}
                        {item.completed && (
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-600">Quality:</span>
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                key={rating}
                                onClick={() => updateItemRating(item, rating)}
                                className={`${
                                  item.quality_rating && item.quality_rating >= rating
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                } hover:text-yellow-400 transition-colors`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Before Photos ({beforePhotos.length})</h3>
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all cursor-pointer">
                    <Upload className="w-5 h-5" />
                    Upload Before Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'before')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {beforePhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="Before"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      {photo.room_area && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          {photo.room_area}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">After Photos ({afterPhotos.length})</h3>
                  <label className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all cursor-pointer">
                    <Upload className="w-5 h-5" />
                    Upload After Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoUpload(e, 'after')}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {afterPhotos.map((photo) => (
                    <div key={photo.id} className="relative group">
                      <img
                        src={photo.photo_url}
                        alt="After"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      {photo.room_area && (
                        <span className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded">
                          {photo.room_area}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {uploading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Uploading photo...</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this job (issues, special requests, observations, etc.)"
                className="w-full h-64 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
              />
              <button
                onClick={saveNotes}
                className="mt-4 px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg transition-all font-semibold"
              >
                Save Notes
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
