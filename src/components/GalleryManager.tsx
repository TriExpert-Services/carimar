import { useState, useEffect } from 'react';
import { Upload, Trash2, Edit2, Eye, EyeOff, X, Save } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { GalleryItem } from '../types';
import { uploadImage, deleteImage, validateImageFile, compressImage } from '../utils/imageUpload';

interface GalleryFormData {
  titulo: string;
  descripcion: string;
  tipo_servicio: string;
  beforeImage: File | null;
  afterImage: File | null;
}

export const GalleryManager = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<GalleryFormData>({
    titulo: '',
    descripcion: '',
    tipo_servicio: '',
    beforeImage: null,
    afterImage: null,
  });
  const [beforePreview, setBeforePreview] = useState<string>('');
  const [afterPreview, setAfterPreview] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadGalleryItems();
  }, []);

  const loadGalleryItems = async () => {
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data as GalleryItem[]);
    }
    setLoading(false);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateImageFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');

    if (type === 'before') {
      setFormData({ ...formData, beforeImage: file });
      setBeforePreview(URL.createObjectURL(file));
    } else {
      setFormData({ ...formData, afterImage: file });
      setAfterPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    setError('');

    try {
      if (!editingItem && (!formData.beforeImage || !formData.afterImage)) {
        setError('Please upload both before and after images');
        setUploading(false);
        return;
      }

      let antesUrl = editingItem?.antes_url || '';
      let despuesUrl = editingItem?.despues_url || '';
      let antesPath = '';
      let despuesPath = '';

      if (formData.beforeImage) {
        if (editingItem?.antes_url) {
          const oldPath = editingItem.antes_url.split('/').slice(-2).join('/');
          await deleteImage(oldPath);
        }
        const compressed = await compressImage(formData.beforeImage);
        const result = await uploadImage(compressed, 'before');
        if (result.error) {
          setError(result.error);
          setUploading(false);
          return;
        }
        antesUrl = result.url;
        antesPath = result.path;
      }

      if (formData.afterImage) {
        if (editingItem?.despues_url) {
          const oldPath = editingItem.despues_url.split('/').slice(-2).join('/');
          await deleteImage(oldPath);
        }
        const compressed = await compressImage(formData.afterImage);
        const result = await uploadImage(compressed, 'after');
        if (result.error) {
          if (antesPath) await deleteImage(antesPath);
          setError(result.error);
          setUploading(false);
          return;
        }
        despuesUrl = result.url;
        despuesPath = result.path;
      }

      const galleryData = {
        titulo: formData.titulo,
        descripcion: formData.descripcion,
        tipo_servicio: formData.tipo_servicio,
        antes_url: antesUrl,
        despues_url: despuesUrl,
      };

      if (editingItem) {
        await supabase.from('gallery').update(galleryData).eq('id', editingItem.id);
      } else {
        await supabase.from('gallery').insert([galleryData]);
      }

      resetForm();
      loadGalleryItems();
    } catch (err) {
      setError('Failed to save gallery item');
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setFormData({
      titulo: item.titulo,
      descripcion: item.descripcion,
      tipo_servicio: item.tipo_servicio,
      beforeImage: null,
      afterImage: null,
    });
    setBeforePreview(item.antes_url);
    setAfterPreview(item.despues_url);
    setShowForm(true);
  };

  const handleDelete = async (item: GalleryItem) => {
    if (!confirm('Are you sure you want to delete this gallery item?')) return;

    const beforePath = item.antes_url.split('/').slice(-2).join('/');
    const afterPath = item.despues_url.split('/').slice(-2).join('/');

    await deleteImage(beforePath);
    await deleteImage(afterPath);
    await supabase.from('gallery').delete().eq('id', item.id);

    loadGalleryItems();
  };

  const toggleVisibility = async (item: GalleryItem) => {
    await supabase
      .from('gallery')
      .update({ visible: !item.visible })
      .eq('id', item.id);

    loadGalleryItems();
  };

  const resetForm = () => {
    setFormData({
      titulo: '',
      descripcion: '',
      tipo_servicio: '',
      beforeImage: null,
      afterImage: null,
    });
    setBeforePreview('');
    setAfterPreview('');
    setEditingItem(null);
    setShowForm(false);
    setError('');
  };

  const serviceTypes = [
    'Residential Cleaning',
    'Commercial Cleaning',
    'Deep Cleaning',
    'Post-Construction Cleaning',
    'Window Cleaning',
    'Carpet Cleaning',
    'Office Cleaning',
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">{t('dashboard.admin.manageGallery')}</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-medium"
        >
          {showForm ? <X className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
          {showForm ? t('common.cancel') : t('common.upload')}
        </button>
      </div>

      {showForm && (
        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[2rem] shadow-xl p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">
            {editingItem ? t('common.edit') : t('common.upload')} Gallery Item
          </h3>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={formData.tipo_servicio}
                  onChange={(e) => setFormData({ ...formData, tipo_servicio: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="">Select service type</option>
                  {serviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Before Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'before')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {beforePreview && (
                  <img
                    src={beforePreview}
                    alt="Before preview"
                    className="mt-4 w-full h-48 object-cover rounded-xl"
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  After Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageChange(e, 'after')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                {afterPreview && (
                  <img
                    src={afterPreview}
                    alt="After preview"
                    className="mt-4 w-full h-48 object-cover rounded-xl"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/50 transition-all font-medium disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {uploading ? 'Uploading...' : t('common.save')}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all font-medium"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all"
          >
            <div className="relative aspect-video">
              <img
                src={item.antes_url}
                alt={item.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex gap-2">
                <button
                  onClick={() => toggleVisibility(item)}
                  className={`p-2 rounded-lg ${
                    item.visible
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-500 hover:bg-gray-600'
                  } text-white transition-colors`}
                >
                  {item.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="p-4">
              <h3 className="font-bold text-gray-900 mb-1">{item.titulo}</h3>
              <p className="text-sm text-gray-600 mb-2">{item.tipo_servicio}</p>
              <p className="text-sm text-gray-500 line-clamp-2 mb-4">{item.descripcion}</p>

              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  <Edit2 className="w-4 h-4" />
                  {t('common.edit')}
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('common.delete')}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          No gallery items yet. Click the upload button to add your first item.
        </div>
      )}
    </div>
  );
};
