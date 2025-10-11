import { useState, useEffect } from 'react';
import { X, Home, Sparkles, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PromotionalPopupProps {
  onNavigate?: (section: string) => void;
}

export const PromotionalPopup = ({ onNavigate }: PromotionalPopupProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useLanguage();

  useEffect(() => {
    const hasSeenPromo = localStorage.getItem('hasSeenPromo');
    const lastSeenDate = localStorage.getItem('promoLastSeen');
    const today = new Date().toDateString();

    if (!hasSeenPromo || lastSeenDate !== today) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem('hasSeenPromo', 'true');
    localStorage.setItem('promoLastSeen', new Date().toDateString());
  };

  const handleGetQuote = () => {
    handleClose();
    if (onNavigate) {
      onNavigate('quote');
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-md w-full bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-[3rem] shadow-2xl overflow-hidden animate-scaleIn">
        <button
          onClick={handleClose}
          className="absolute top-6 right-6 z-[20] w-10 h-10 flex items-center justify-center bg-white/90 hover:bg-white rounded-full shadow-lg transition-all hover:scale-110 cursor-pointer"
          aria-label="Close"
          type="button"
        >
          <X className="w-5 h-5 text-gray-700 pointer-events-none" />
        </button>

        <div className="relative p-8 pb-6">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-teal-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center">
            <div className="mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full shadow-lg mb-4">
                <Home className="w-10 h-10 text-white" />
              </div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-5 h-5 text-emerald-600" />
                <span className="text-sm font-bold text-emerald-700 uppercase tracking-wide">
                  {language === 'en' ? 'Limited Time Offer' : 'Oferta por Tiempo Limitado'}
                </span>
                <Sparkles className="w-5 h-5 text-emerald-600" />
              </div>
            </div>

            <div className="mb-6">
              <div className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 mb-2">
                20% OFF
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">
                {language === 'en' ? 'NEW CUSTOMERS' : 'NUEVOS CLIENTES'}
              </h2>
              <div className="inline-block mb-4">
                <div className="w-16 h-1 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"></div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Home className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-2">
                {language === 'en' ? 'RESIDENTIAL' : 'RESIDENCIAL'}
              </h3>
              <h3 className="text-2xl font-bold text-gray-800">
                {language === 'en' ? 'CLEANING SERVICES' : 'SERVICIOS DE LIMPIEZA'}
              </h3>
            </div>

            <p className="text-gray-700 mb-8 text-sm leading-relaxed">
              {language === 'en'
                ? 'Get 20% off your first residential cleaning service! Professional, reliable, and high-quality cleaning for your home.'
                : '¡Obtén 20% de descuento en tu primer servicio de limpieza residencial! Limpieza profesional, confiable y de alta calidad para tu hogar.'}
            </p>

            <button
              onClick={handleGetQuote}
              className="group w-full px-8 py-4 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-lg rounded-2xl hover:shadow-2xl hover:shadow-teal-500/50 transition-all duration-300 flex items-center justify-center gap-3"
            >
              {language === 'en' ? 'Claim Your Discount' : 'Reclamar Descuento'}
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-xs text-gray-500 mt-4">
              {language === 'en'
                ? '* Valid for first-time customers on residential cleaning services only'
                : '* Válido solo para nuevos clientes en servicios de limpieza residencial'}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 px-8 py-4">
          <div className="flex items-center justify-center gap-2 text-white">
            <Sparkles className="w-4 h-4" />
            <p className="text-sm font-semibold">
              {language === 'en' ? 'Professional Cleaning You Can Trust' : 'Limpieza Profesional en la que Puedes Confiar'}
            </p>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-scaleIn {
          animation: scaleIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
