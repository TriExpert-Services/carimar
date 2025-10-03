import { Mail, Phone, MapPin, Facebook, Instagram, Twitter, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface FooterProps {
  onNavigate: (section: string) => void;
}

export const Footer = ({ onNavigate }: FooterProps) => {
  const { t } = useLanguage();

  const quickLinks = [
    { id: 'home', label: t('nav.home') },
    { id: 'services', label: t('nav.services') },
    { id: 'quote', label: t('nav.quote') },
    { id: 'about', label: t('nav.about') },
    { id: 'contact', label: t('nav.contact') },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold">CARIMAR SERVICES</h3>
                <p className="text-xs text-gray-400">Professional Cleaning</p>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {t('footer.description')}
            </p>
            <div className="flex gap-4 mt-4">
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-pink-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-sky-500 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.quickLinks')}</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => onNavigate(link.id)}
                    className="text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.services')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>{t('services.residential.name')}</li>
              <li>{t('services.commercial.name')}</li>
              <li>{t('services.deepCleaning.name')}</li>
              <li>{t('services.windowCleaning.name')}</li>
              <li>{t('services.carpetCleaning.name')}</li>
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">{t('footer.contact')}</h4>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-400">Tampa, FL</p>
                  <p className="text-xs text-gray-500 mt-1">{t('hero.servicingArea')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <a href="tel:+18135551234" className="text-sm text-gray-400 hover:text-white transition-colors">
                  (813) 555-1234
                </a>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <a
                  href="mailto:info@carimarservices.com"
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  info@carimarservices.com
                </a>
              </div>
              <div className="pt-2">
                <p className="text-sm font-medium text-white mb-1">{t('footer.hours')}</p>
                <p className="text-xs text-gray-400">{t('footer.hoursValue')}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} CARIMAR SERVICES LLC. {t('footer.rights')}
          </p>
          <div className="flex gap-6">
            <button
              onClick={() => onNavigate('privacy')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('footer.privacy')}
            </button>
            <button
              onClick={() => onNavigate('terms')}
              className="text-sm text-gray-400 hover:text-white transition-colors"
            >
              {t('footer.terms')}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
