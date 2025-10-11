import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { GalleryItem as GalleryItemType } from '../types';

export const Gallery = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<GalleryItemType[]>([]);
  const [filteredItems, setFilteredItems] = useState<GalleryItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItemType | null>(null);
  const [showBefore, setShowBefore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<string>('all');

  useEffect(() => {
    loadGallery();
  }, []);

  useEffect(() => {
    if (selectedService === 'all') {
      setFilteredItems(items);
    } else {
      setFilteredItems(items.filter(item => item.tipo_servicio === selectedService));
    }
  }, [selectedService, items]);

  const loadGallery = async () => {
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data as GalleryItemType[]);
      setFilteredItems(data as GalleryItemType[]);
    }
    setLoading(false);
  };

  const openLightbox = (item: GalleryItemType) => {
    setSelectedItem(item);
    setShowBefore(true);
  };

  const closeLightbox = () => {
    setSelectedItem(null);
  };

  const uniqueServices = Array.from(new Set(items.map(item => item.tipo_servicio)));

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedItem) return;

      if (e.key === 'Escape') {
        closeLightbox();
      } else if (e.key === 'ArrowLeft') {
        setShowBefore(true);
      } else if (e.key === 'ArrowRight') {
        setShowBefore(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem]);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('gallery.title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('gallery.subtitle')}
          </p>
        </div>

        {uniqueServices.length > 0 && (
          <div className="mb-12 flex justify-center">
            <div className="inline-flex flex-wrap gap-3 bg-white rounded-2xl p-3 shadow-lg">
              <button
                onClick={() => setSelectedService('all')}
                className={`px-6 py-2 rounded-xl font-medium transition-all ${
                  selectedService === 'all'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('gallery.allServices')}
              </button>
              {uniqueServices.map((service) => (
                <button
                  key={service}
                  onClick={() => setSelectedService(service)}
                  className={`px-6 py-2 rounded-xl font-medium transition-all ${
                    selectedService === service
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {service}
                </button>
              ))}
            </div>
          </div>
        )}

        {filteredItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">{t('gallery.noItems')}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                onClick={() => openLightbox(item)}
                className="group cursor-pointer bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                <div className="relative aspect-video overflow-hidden">
                  <img
                    src={item.antes_url}
                    alt={item.titulo}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <div className="text-white">
                      <h3 className="text-xl font-bold mb-1">{item.titulo}</h3>
                      <p className="text-sm opacity-90">{item.tipo_servicio}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {selectedItem && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-12 h-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="w-6 h-6 text-white" />
            </button>

            <div className="max-w-5xl w-full">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                <h3 className="text-2xl font-bold text-white mb-2">{selectedItem.titulo}</h3>
                <p className="text-gray-200">{selectedItem.descripcion}</p>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden">
                <img
                  src={showBefore ? selectedItem.antes_url : selectedItem.despues_url}
                  alt={showBefore ? 'Before' : 'After'}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex justify-center items-center gap-4 mt-6">
                <button
                  onClick={() => setShowBefore(true)}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
                    showBefore
                      ? 'bg-white text-gray-900 shadow-xl'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  <ArrowLeft className="w-5 h-5" />
                  {t('gallery.before')}
                </button>
                <div className="text-white font-medium text-sm">
                  {showBefore ? t('gallery.before') : t('gallery.after')}
                </div>
                <button
                  onClick={() => setShowBefore(false)}
                  className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold transition-all ${
                    !showBefore
                      ? 'bg-white text-gray-900 shadow-xl'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {t('gallery.after')}
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
              <div className="text-center mt-4 text-white/70 text-sm">
                Use arrow keys ← → or click buttons to switch
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
