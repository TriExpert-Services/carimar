import { useState, useEffect } from 'react';
import { Home, Building2, Sparkles, HardHat, Square, Layers, Briefcase, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { Service } from '../types';
import { formatCurrency } from '../utils/pricing';

interface ServicesProps {
  onNavigate: (section: string) => void;
}

const iconMap: Record<string, any> = {
  Home,
  Building2,
  Sparkles,
  HardHat,
  Square,
  Layers,
  Briefcase,
};

export const Services = ({ onNavigate }: ServicesProps) => {
  const { language, t } = useLanguage();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: true });

    if (data && !error) {
      setServices(data as Service[]);
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4">
            {t('services.title')}
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            {t('services.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service) => {
            const IconComponent = iconMap[service.icono] || Sparkles;
            const name = language === 'en' ? service.nombre_en : service.nombre_es;
            const description = language === 'en' ? service.descripcion_en : service.descripcion_es;

            return (
              <div
                key={service.id}
                className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-100 hover:border-transparent hover:scale-105 relative"
              >
                {/* Gradient border effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-400/20 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                <div className="p-8 relative z-10">
                  <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 via-teal-400 to-cyan-400 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-lg">
                    <IconComponent className="w-8 h-8 text-white" />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 mb-3">{name}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{description}</p>

                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100">
                    <div>
                      <p className="text-sm text-gray-500 mb-1">{t('services.priceFrom')}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {formatCurrency(service.precio_base)}
                      </p>
                    </div>
                    {service.precio_por_sqft > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500 mb-1">{t('services.perSqFt')}</p>
                        <p className="text-lg font-semibold text-gray-700">
                          {formatCurrency(service.precio_por_sqft)}
                        </p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => onNavigate('quote')}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-xl hover:shadow-teal-500/50 transition-all duration-300"
                  >
                    {t('services.getQuote')}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
