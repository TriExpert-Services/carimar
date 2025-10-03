import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Testimonial as TestimonialType } from '../types';

export const Testimonials = () => {
  const { t } = useLanguage();
  const [testimonials, setTestimonials] = useState<TestimonialType[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTestimonials();
  }, []);

  const loadTestimonials = async () => {
    const { data } = await supabase
      .from('testimonials')
      .select('*')
      .eq('aprobado', true)
      .order('created_at', { ascending: false });

    if (data && data.length > 0) {
      setTestimonials(data as TestimonialType[]);
    } else {
      setTestimonials([
        {
          id: '1',
          nombre: 'Maria Rodriguez',
          calificacion: 5,
          comentario: 'Excellent service! My house has never been cleaner. The team is professional and thorough.',
          aprobado: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          nombre: 'John Smith',
          calificacion: 5,
          comentario: 'Very impressed with the attention to detail. They went above and beyond my expectations.',
          aprobado: true,
          created_at: new Date().toISOString(),
        },
        {
          id: '3',
          nombre: 'Ana Martinez',
          calificacion: 5,
          comentario: 'Reliable and trustworthy. I use them weekly and they never disappoint!',
          aprobado: true,
          created_at: new Date().toISOString(),
        },
      ]);
    }
    setLoading(false);
  };

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const averageRating = testimonials.reduce((acc, t) => acc + t.calificacion, 0) / (testimonials.length || 1);

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-1/4 left-0 w-72 h-72 bg-gradient-to-br from-blue-200/20 via-cyan-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-gradient-to-br from-purple-200/20 via-pink-200/20 to-rose-200/20 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">
            {t('testimonials.title')}
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            {t('testimonials.subtitle')}
          </p>
          <div className="flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.round(averageRating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <span className="text-gray-700 font-semibold">
              {averageRating.toFixed(1)} ({testimonials.length} {t('testimonials.reviews')})
            </span>
          </div>
        </div>

        {testimonials.length > 0 && (
          <div className="relative max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-[3rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/10 to-teal-400/10 rounded-full blur-3xl"></div>
              <Quote className="w-12 h-12 text-emerald-400 mb-6 relative z-10" />

              <div className="mb-6 relative z-10">
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-6 h-6 ${
                        i < testimonials[currentIndex].calificacion
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <p className="text-xl text-gray-100 leading-relaxed mb-6">
                  "{testimonials[currentIndex].comentario}"
                </p>
                <p className="text-lg font-semibold text-white">
                  {testimonials[currentIndex].nombre}
                </p>
              </div>
            </div>

            {testimonials.length > 1 && (
              <div className="flex justify-center gap-4 mt-8">
                <button
                  onClick={prevTestimonial}
                  className="w-14 h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl hover:bg-white/20 flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronLeft className="w-6 h-6 text-white" />
                </button>
                <button
                  onClick={nextTestimonial}
                  className="w-14 h-14 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl hover:shadow-xl hover:shadow-teal-500/50 flex items-center justify-center transition-all hover:scale-110"
                >
                  <ChevronRight className="w-6 h-6 text-white" />
                </button>
              </div>
            )}

            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentIndex ? 'w-8 bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
