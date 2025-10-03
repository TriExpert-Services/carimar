import { useState } from 'react';
import { Menu, X, Sparkles, Globe } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onNavigate: (section: string) => void;
  currentSection: string;
}

export const Header = ({ onNavigate, currentSection }: HeaderProps) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, signOut } = useAuth();

  const navItems = [
    { id: 'home', label: t('nav.home') },
    { id: 'services', label: t('nav.services') },
    { id: 'quote', label: t('nav.quote') },
    { id: 'about', label: t('nav.about') },
    { id: 'gallery', label: t('nav.gallery') },
    { id: 'testimonials', label: t('nav.testimonials') },
    { id: 'contact', label: t('nav.contact') },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'es' : 'en');
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('home');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-md shadow-2xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => onNavigate('home')}
          >
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-400 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CARIMAR SERVICES</h1>
              <p className="text-xs text-emerald-300">Professional Cleaning</p>
            </div>
          </div>

          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`text-sm font-medium transition-colors ${
                  currentSection === item.id
                    ? 'text-emerald-400'
                    : 'text-gray-300 hover:text-emerald-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
              title={language === 'en' ? 'Switch to Spanish' : 'Cambiar a Inglés'}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            {user ? (
              <>
                <button
                  onClick={() => onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'client-dashboard')}
                  className="px-4 py-2 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  {user.role === 'admin' ? t('nav.adminPortal') : t('nav.clientPortal')}
                </button>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {t('nav.logout')}
                </button>
              </>
            ) : (
              <button
                onClick={() => onNavigate('login')}
                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:shadow-lg hover:shadow-teal-500/50 transition-all"
              >
                {t('nav.login')}
              </button>
            )}
          </div>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-800 border-t border-white/10">
          <nav className="px-4 py-6 space-y-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`block w-full text-left px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  currentSection === item.id
                    ? 'bg-emerald-500/20 text-emerald-300'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}

            <div className="pt-4 border-t border-gray-200 space-y-3">
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-2 w-full px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/20"
              >
                <Globe className="w-4 h-4" />
                <span className="text-sm font-medium uppercase">{language}</span>
              </button>

              {user ? (
                <>
                  <button
                    onClick={() => {
                      onNavigate(user.role === 'admin' ? 'admin-dashboard' : 'client-dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-emerald-400 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {user.role === 'admin' ? t('nav.adminPortal') : t('nav.clientPortal')}
                  </button>
                  <button
                    onClick={async () => {
                      await handleSignOut();
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm font-medium text-gray-300 hover:bg-white/10 rounded-xl transition-colors"
                  >
                    {t('nav.logout')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                  className="block w-full px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  {t('nav.login')}
                </button>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
