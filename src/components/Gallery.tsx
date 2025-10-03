import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { GalleryItem as GalleryItemType } from '../types';

export const Gallery = () => {
  const { t } = useLanguage();
  const [items, setItems] = useState<GalleryItemType[]>([]);
  const [selectedItem, setSelectedItem] = useState<GalleryItemType | null>(null);
  const [showBefore, setShowBefore] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    const { data } = await supabase
      .from('gallery')
      .select('*')
      .eq('visible', true)
      .order('created_at', { ascending: false });

    if (data) {
      setItems(data as GalleryItemType[]);
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

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('nav.gallery')}
          </h2>
          <p className="text-xl text-gray-600">
            See the difference our professional cleaning makes
          </p>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Gallery items coming soon!</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {items.map((item) => (
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

              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={() => setShowBefore(true)}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    showBefore
                      ? 'bg-white text-gray-900'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  Before
                </button>
                <button
                  onClick={() => setShowBefore(false)}
                  className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                    !showBefore
                      ? 'bg-white text-gray-900'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  After
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
