import { Award, Heart, CheckCircle, Shield } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export const About = () => {
  const { t } = useLanguage();

  const values = [
    {
      icon: Award,
      title: t('about.values.professionalism.title'),
      description: t('about.values.professionalism.description'),
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: CheckCircle,
      title: t('about.values.reliability.title'),
      description: t('about.values.reliability.description'),
      color: 'from-teal-500 to-teal-600',
    },
    {
      icon: Shield,
      title: t('about.values.quality.title'),
      description: t('about.values.quality.description'),
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Heart,
      title: t('about.values.community.title'),
      description: t('about.values.community.description'),
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-200/30 via-pink-200/30 to-rose-200/30 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-br from-emerald-200/30 via-teal-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 bg-clip-text text-transparent mb-4">
            {t('about.title')}
          </h2>
          <p className="text-xl text-gray-600">
            {t('about.subtitle')}
          </p>
        </div>

        <div className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 rounded-[3rem] p-8 md:p-12 mb-16 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
          <h3 className="text-3xl font-bold text-white mb-4 relative z-10">
            {t('about.mission.title')}
          </h3>
          <p className="text-lg text-gray-200 leading-relaxed relative z-10">
            {t('about.mission.description')}
          </p>
        </div>

        <div className="mb-16">
          <h3 className="text-3xl font-bold text-gray-900 text-center mb-12">
            {t('about.values.title')}
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="text-center group">
                  <div className={`w-20 h-20 bg-gradient-to-br ${value.color} rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500`}>
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h4 className="text-xl font-bold text-gray-900 mb-3">{value.title}</h4>
                  <p className="text-gray-600">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-sm border border-gray-200 rounded-[3rem] p-8 md:p-12 shadow-xl">
          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            {t('about.coverage.title')}
          </h3>
          <p className="text-lg text-gray-700 mb-4">
            {t('about.coverage.description')}
          </p>
          <p className="text-gray-600">
            {t('about.coverage.areas')}
          </p>
        </div>
      </div>
    </section>
  );
};
