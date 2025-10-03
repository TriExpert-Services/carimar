import { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle, MapPin, Users, Award, Sparkles, Droplets } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../lib/supabase';
import { HeroImage } from '../types';

interface HeroProps {
  onNavigate: (section: string) => void;
}

export const Hero = ({ onNavigate }: HeroProps) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<HeroImage[]>([]);
  const [currentImageIndices, setCurrentImageIndices] = useState<Record<number, number>>({
    1: 0,
    3: 0
  });

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      rotateImages();
    }, 300000);

    return () => clearInterval(interval);
  }, [images]);

  const loadImages = async () => {
    const { data } = await supabase
      .from('hero_images')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (data) {
      setImages(data as HeroImage[]);
    }
  };

  const rotateImages = () => {
    setCurrentImageIndices(prev => {
      const position1Images = images.filter(img => img.position === 1);
      const position3Images = images.filter(img => img.position === 3);

      return {
        1: position1Images.length > 0 ? (prev[1] + 1) % position1Images.length : 0,
        3: position3Images.length > 0 ? (prev[3] + 1) % position3Images.length : 0
      };
    });
  };

  const getImageForPosition = (position: number) => {
    const positionImages = images.filter(img => img.position === position);
    if (positionImages.length === 0) return null;
    const index = currentImageIndices[position] || 0;
    return positionImages[index];
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#1e293b] via-[#334155] to-[#1e3a52]">
      {/* Decorative gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-emerald-400/20 via-teal-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/3 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 via-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-gradient-to-br from-blue-400/20 via-cyan-400/20 to-teal-400/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md text-white rounded-full text-sm font-medium mb-8 border border-white/20">
              <CheckCircle className="w-4 h-4" />
              <span>{t('hero.servicingArea')}</span>
            </div>

            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              {t('hero.title')}
            </h1>

            <h2 className="text-2xl sm:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-300 to-cyan-300 mb-6">
              {t('hero.subtitle')}
            </h2>

            <p className="text-lg text-gray-300 mb-10 leading-relaxed">
              {t('hero.description')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <button
                onClick={() => onNavigate('quote')}
                className="group px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-semibold rounded-2xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {t('hero.ctaQuote')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('services')}
                className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20"
              >
                {t('hero.ctaServices')}
              </button>
            </div>
          </div>

          {/* Right - Decorative Cards */}
          <div className="hidden lg:grid grid-cols-2 gap-6">
            {/* Image card 1 - Rotating images */}
            {getImageForPosition(1) && (
              <div className="rounded-[3rem] h-64 backdrop-blur-sm shadow-2xl hover:scale-105 transition-all duration-1000 overflow-hidden relative">
                <img
                  key={getImageForPosition(1)?.id}
                  src={getImageForPosition(1)?.image_url}
                  alt={getImageForPosition(1)?.alt_text}
                  className="w-full h-full object-cover animate-fade-in"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/40 to-teal-500/40"></div>
              </div>
            )}

            <div className="bg-white/10 backdrop-blur-md rounded-[3rem] h-64 border border-white/20 flex items-center justify-center mt-12 hover:scale-105 transition-transform duration-500">
              <div className="text-center text-white">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <h3 className="text-4xl font-bold mb-2">5+</h3>
                <p className="text-sm opacity-80">{t('hero.yearsExperience')}</p>
              </div>
            </div>

            {/* Image card 2 - Rotating images */}
            {getImageForPosition(3) && (
              <div className="rounded-[3rem] h-64 backdrop-blur-sm shadow-2xl hover:scale-105 transition-all duration-1000 overflow-hidden relative -mt-12">
                <img
                  key={getImageForPosition(3)?.id}
                  src={getImageForPosition(3)?.image_url}
                  alt={getImageForPosition(3)?.alt_text}
                  className="w-full h-full object-cover animate-fade-in"
                />
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/30 to-cyan-500/30"></div>
              </div>
            )}

            <div className="bg-gradient-to-br from-emerald-400/80 via-teal-400/80 to-cyan-400/80 rounded-[3rem] h-64 backdrop-blur-sm shadow-2xl hover:scale-105 transition-transform duration-500 flex items-center justify-center">
              <div className="text-center text-white">
                <MapPin className="w-16 h-16 mx-auto mb-4" />
                <h3 className="text-3xl font-bold mb-2">Tampa</h3>
                <p className="text-sm">FL & Surrounding</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
