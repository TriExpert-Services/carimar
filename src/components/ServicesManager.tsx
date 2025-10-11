import { useState, useEffect } from 'react';
import { Briefcase, Plus, Save, Trash2, Edit2, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Service } from '../types';

export const ServicesManager = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [formData, setFormData] = useState<Partial<Service>>({
    nombre_en: '',
    nombre_es: '',
    descripcion_en: '',
    descripcion_es: '',
    precio_base: 0,
    precio_por_sqft: 0,
    icono: 'Sparkles',
    activo: true,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('nombre_en', { ascending: true });

      if (error) throw error;
      if (data) setServices(data as Service[]);
    } catch (error) {
      console.error('Error loading services:', error);
      setMessage({ type: 'error', text: 'Failed to load services' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setIsCreating(true);
    setEditingService(null);
    setFormData({
      nombre_en: '',
      nombre_es: '',
      descripcion_en: '',
      descripcion_es: '',
      precio_base: 0,
      precio_por_sqft: 0,
      icono: 'Sparkles',
      activo: true,
    });
  };

  const handleEdit = (service: Service) => {
    setEditingService(service);
    setIsCreating(false);
    setFormData(service);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingService(null);
    setFormData({
      nombre_en: '',
      nombre_es: '',
      descripcion_en: '',
      descripcion_es: '',
      precio_base: 0,
      precio_por_sqft: 0,
      icono: 'Sparkles',
      activo: true,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            nombre_en: formData.nombre_en,
            nombre_es: formData.nombre_es,
            descripcion_en: formData.descripcion_en,
            descripcion_es: formData.descripcion_es,
            precio_base: formData.precio_base,
            precio_por_sqft: formData.precio_por_sqft,
            icono: formData.icono,
            activo: formData.activo,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Service updated successfully!' });
      } else {
        const { error } = await supabase
          .from('services')
          .insert([formData]);

        if (error) throw error;
        setMessage({ type: 'success', text: 'Service created successfully!' });
      }

      await loadServices();
      handleCancel();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving service:', error);
      setMessage({ type: 'error', text: 'Failed to save service' });
    }
  };

  const handleDelete = async (serviceId: string, serviceName: string) => {
    if (!confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Service deleted successfully!' });
      await loadServices();

      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error deleting service:', error);
      setMessage({ type: 'error', text: 'Failed to delete service' });
    }
  };

  const toggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ activo: !service.activo })
        .eq('id', service.id);

      if (error) throw error;
      await loadServices();
    } catch (error) {
      console.error('Error toggling service status:', error);
      setMessage({ type: 'error', text: 'Failed to update service status' });
    }
  };

  const availableIcons = [
    'Sparkles', 'Home', 'Building2', 'Briefcase', 'HardHat',
    'Square', 'Layers', 'Droplets', 'Wind', 'Sun'
  ];

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
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-2xl flex items-center justify-center">
            <Briefcase className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Services Management</h2>
            <p className="text-gray-600">Manage your service offerings and pricing</p>
          </div>
        </div>

        {!isCreating && !editingService && (
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add New Service
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 p-4 rounded-2xl ${
          message.type === 'success'
            ? 'bg-green-50 text-green-800 border border-green-200'
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {(isCreating || editingService) && (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2.5rem] shadow-xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">
              {editingService ? 'Edit Service' : 'Create New Service'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Name (English)
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_en || ''}
                  onChange={(e) => setFormData({ ...formData, nombre_en: e.target.value })}
                  placeholder="Residential Cleaning"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Name (Spanish)
                </label>
                <input
                  type="text"
                  required
                  value={formData.nombre_es || ''}
                  onChange={(e) => setFormData({ ...formData, nombre_es: e.target.value })}
                  placeholder="Limpieza Residencial"
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (English)
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.descripcion_en || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion_en: e.target.value })}
                  placeholder="Professional home cleaning service..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description (Spanish)
                </label>
                <textarea
                  required
                  rows={3}
                  value={formData.descripcion_es || ''}
                  onChange={(e) => setFormData({ ...formData, descripcion_es: e.target.value })}
                  placeholder="Servicio profesional de limpieza de hogar..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Base Price ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.precio_base || 0}
                  onChange={(e) => setFormData({ ...formData, precio_base: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Price per Sq Ft ($)
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.precio_por_sqft || 0}
                  onChange={(e) => setFormData({ ...formData, precio_por_sqft: parseFloat(e.target.value) })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Icon
                </label>
                <select
                  value={formData.icono || 'Sparkles'}
                  onChange={(e) => setFormData({ ...formData, icono: e.target.value })}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-300 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                >
                  {availableIcons.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="activo"
                  checked={formData.activo || false}
                  onChange={(e) => setFormData({ ...formData, activo: e.target.checked })}
                  className="w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                />
                <label htmlFor="activo" className="text-sm font-semibold text-gray-700">
                  Active (visible to customers)
                </label>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
              >
                <Save className="w-5 h-5" />
                {editingService ? 'Update Service' : 'Create Service'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-8 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-300 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div
            key={service.id}
            className={`bg-white/60 backdrop-blur-sm border-2 rounded-[2rem] shadow-xl p-6 transition-all ${
              service.activo
                ? 'border-emerald-200 hover:border-emerald-400 hover:shadow-2xl'
                : 'border-gray-200 opacity-60'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-gray-900">{service.nombre_en}</h3>
                  <p className="text-sm text-gray-600">{service.nombre_es}</p>
                </div>
              </div>
              <button
                onClick={() => toggleActive(service)}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  service.activo
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {service.activo ? 'Active' : 'Inactive'}
              </button>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-sm text-gray-600 line-clamp-2">{service.descripcion_en}</p>
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Base: </span>
                  <span className="font-semibold text-emerald-600">${service.precio_base}</span>
                </div>
                <div>
                  <span className="text-gray-500">Per sq ft: </span>
                  <span className="font-semibold text-emerald-600">${service.precio_por_sqft}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(service)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-all text-sm font-medium"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(service.id, service.nombre_en)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all text-sm font-medium"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && !isCreating && (
        <div className="text-center py-20">
          <Briefcase className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">No services configured yet</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Your First Service
          </button>
        </div>
      )}
    </div>
  );
};
