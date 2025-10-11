import { useState, useEffect } from 'react';
import { LanguageProvider } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { Hero } from './components/Hero';
import { Services } from './components/Services';
import { QuoteForm } from './components/QuoteForm';
import { About } from './components/About';
import { Gallery } from './components/Gallery';
import { Testimonials } from './components/Testimonials';
import { Contact } from './components/Contact';
import { Auth } from './components/Auth';
import { ClientDashboard } from './components/ClientDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { PromotionalPopup } from './components/PromotionalPopup';

function AppContent() {
  const [currentSection, setCurrentSection] = useState('home');
  const { user, loading } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentSection]);

  useEffect(() => {
    if (!loading && user) {
      const shouldRedirect = currentSection === 'login' || currentSection === 'home';

      if (shouldRedirect) {
        const targetSection = user.role === 'admin' ? 'admin-dashboard' : 'client-dashboard';
        if (currentSection !== targetSection) {
          setCurrentSection(targetSection);
        }
      }
    }
  }, [user, loading, currentSection]);

  const handleNavigate = (section: string) => {
    setCurrentSection(section);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-teal-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const renderSection = () => {
    if (currentSection === 'login' && !user) {
      return <Auth onNavigate={handleNavigate} />;
    }

    if (currentSection === 'client-dashboard' && user?.role === 'client') {
      return <ClientDashboard onNavigate={handleNavigate} />;
    }

    if (currentSection === 'admin-dashboard' && user?.role === 'admin') {
      return <AdminDashboard />;
    }

    return (
      <>
        {currentSection === 'home' && <Hero onNavigate={handleNavigate} />}
        {currentSection === 'services' && <Services onNavigate={handleNavigate} />}
        {currentSection === 'quote' && <QuoteForm onNavigate={handleNavigate} />}
        {currentSection === 'about' && <About />}
        {currentSection === 'gallery' && <Gallery />}
        {currentSection === 'testimonials' && <Testimonials />}
        {currentSection === 'contact' && <Contact />}
      </>
    );
  };

  const showFooter = !['login', 'client-dashboard', 'admin-dashboard'].includes(currentSection);
  const showPromo = !user && ['home', 'services', 'about'].includes(currentSection);

  return (
    <div className="min-h-screen bg-white">
      <Header onNavigate={handleNavigate} currentSection={currentSection} />
      <main className="pt-16">{renderSection()}</main>
      {showFooter && <Footer onNavigate={handleNavigate} />}
      {showPromo && <PromotionalPopup onNavigate={handleNavigate} />}
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
