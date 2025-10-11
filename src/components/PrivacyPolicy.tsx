import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCompanyInfo } from '../contexts/CompanyContext';

interface PrivacyPolicyProps {
  onNavigate: (section: string) => void;
}

export const PrivacyPolicy = ({ onNavigate }: PrivacyPolicyProps) => {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();

  const content = {
    en: {
      title: 'Privacy Policy',
      lastUpdated: 'Last Updated',
      sections: [
        {
          title: '1. Information We Collect',
          content: [
            'We collect information that you provide directly to us when you:',
            '• Create an account or use our services',
            '• Request a quote or book a cleaning service',
            '• Contact us for customer support',
            '• Sign up for our newsletter or promotional communications',
            '',
            'The information we collect may include:',
            '• Name, email address, phone number',
            '• Service address and property details',
            '• Payment information (processed securely through third-party payment processors)',
            '• Communication preferences and service history'
          ]
        },
        {
          title: '2. How We Use Your Information',
          content: [
            'We use the information we collect to:',
            '• Provide, maintain, and improve our cleaning services',
            '• Process your bookings and payments',
            '• Send you service confirmations, updates, and reminders',
            '• Respond to your inquiries and provide customer support',
            '• Send marketing communications (with your consent)',
            '• Analyze usage patterns to improve our services',
            '• Comply with legal obligations and protect our rights'
          ]
        },
        {
          title: '3. Information Sharing and Disclosure',
          content: [
            'We do not sell your personal information. We may share your information with:',
            '',
            '• Service Providers: Third parties who help us operate our business (payment processors, email services)',
            '• Cleaning Staff: Assigned employees receive necessary information to complete your service',
            '• Legal Requirements: When required by law or to protect our rights and safety',
            '',
            'We ensure all third parties maintain appropriate security measures.'
          ]
        },
        {
          title: '4. Data Security',
          content: [
            'We implement industry-standard security measures to protect your information:',
            '• Encrypted data transmission (SSL/TLS)',
            '• Secure database storage with access controls',
            '• Regular security audits and updates',
            '• Employee training on data protection',
            '',
            'However, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.'
          ]
        },
        {
          title: '5. Your Rights and Choices',
          content: [
            'You have the right to:',
            '• Access and review your personal information',
            '• Update or correct your information',
            '• Delete your account and associated data',
            '• Opt-out of marketing communications',
            '• Request a copy of your data',
            '',
            'To exercise these rights, please contact us at ' + (companyInfo?.email || 'our support email') + '.'
          ]
        },
        {
          title: '6. Cookies and Tracking',
          content: [
            'We use cookies and similar technologies to:',
            '• Remember your preferences and settings',
            '• Analyze site traffic and usage patterns',
            '• Improve user experience',
            '',
            'You can control cookies through your browser settings. Disabling cookies may affect site functionality.'
          ]
        },
        {
          title: '7. Children\'s Privacy',
          content: [
            'Our services are not directed to children under 13. We do not knowingly collect information from children under 13.',
            '',
            'If you believe we have collected information from a child under 13, please contact us immediately.'
          ]
        },
        {
          title: '8. Changes to This Policy',
          content: [
            'We may update this Privacy Policy from time to time. We will notify you of significant changes by:',
            '• Posting the new policy on our website',
            '• Sending an email notification to registered users',
            '',
            'Your continued use of our services after changes indicates acceptance of the updated policy.'
          ]
        },
        {
          title: '9. Contact Us',
          content: [
            'If you have questions about this Privacy Policy, please contact us:',
            '',
            'Email: ' + (companyInfo?.email || 'contact@company.com'),
            'Phone: ' + (companyInfo?.phone || 'phone number'),
            'Address: ' + (companyInfo?.city || 'City') + ', ' + (companyInfo?.state || 'State')
          ]
        }
      ]
    },
    es: {
      title: 'Política de Privacidad',
      lastUpdated: 'Última Actualización',
      sections: [
        {
          title: '1. Información que Recopilamos',
          content: [
            'Recopilamos información que usted nos proporciona directamente cuando:',
            '• Crea una cuenta o utiliza nuestros servicios',
            '• Solicita una cotización o reserva un servicio de limpieza',
            '• Se comunica con nosotros para soporte al cliente',
            '• Se suscribe a nuestro boletín o comunicaciones promocionales',
            '',
            'La información que recopilamos puede incluir:',
            '• Nombre, dirección de correo electrónico, número de teléfono',
            '• Dirección del servicio y detalles de la propiedad',
            '• Información de pago (procesada de forma segura a través de procesadores de pago de terceros)',
            '• Preferencias de comunicación e historial de servicios'
          ]
        },
        {
          title: '2. Cómo Usamos Su Información',
          content: [
            'Utilizamos la información que recopilamos para:',
            '• Proporcionar, mantener y mejorar nuestros servicios de limpieza',
            '• Procesar sus reservas y pagos',
            '• Enviarle confirmaciones de servicio, actualizaciones y recordatorios',
            '• Responder a sus consultas y proporcionar soporte al cliente',
            '• Enviar comunicaciones de marketing (con su consentimiento)',
            '• Analizar patrones de uso para mejorar nuestros servicios',
            '• Cumplir con obligaciones legales y proteger nuestros derechos'
          ]
        },
        {
          title: '3. Compartir y Divulgación de Información',
          content: [
            'No vendemos su información personal. Podemos compartir su información con:',
            '',
            '• Proveedores de Servicios: Terceros que nos ayudan a operar nuestro negocio (procesadores de pago, servicios de correo electrónico)',
            '• Personal de Limpieza: Los empleados asignados reciben la información necesaria para completar su servicio',
            '• Requisitos Legales: Cuando sea requerido por ley o para proteger nuestros derechos y seguridad',
            '',
            'Nos aseguramos de que todos los terceros mantengan medidas de seguridad apropiadas.'
          ]
        },
        {
          title: '4. Seguridad de Datos',
          content: [
            'Implementamos medidas de seguridad estándar de la industria para proteger su información:',
            '• Transmisión de datos encriptada (SSL/TLS)',
            '• Almacenamiento seguro en bases de datos con controles de acceso',
            '• Auditorías de seguridad y actualizaciones regulares',
            '• Capacitación de empleados en protección de datos',
            '',
            'Sin embargo, ningún método de transmisión por internet es 100% seguro. No podemos garantizar seguridad absoluta.'
          ]
        },
        {
          title: '5. Sus Derechos y Opciones',
          content: [
            'Usted tiene derecho a:',
            '• Acceder y revisar su información personal',
            '• Actualizar o corregir su información',
            '• Eliminar su cuenta y datos asociados',
            '• Optar por no recibir comunicaciones de marketing',
            '• Solicitar una copia de sus datos',
            '',
            'Para ejercer estos derechos, contáctenos en ' + (companyInfo?.email || 'nuestro correo de soporte') + '.'
          ]
        },
        {
          title: '6. Cookies y Seguimiento',
          content: [
            'Utilizamos cookies y tecnologías similares para:',
            '• Recordar sus preferencias y configuraciones',
            '• Analizar el tráfico y los patrones de uso del sitio',
            '• Mejorar la experiencia del usuario',
            '',
            'Puede controlar las cookies a través de la configuración de su navegador. Deshabilitar las cookies puede afectar la funcionalidad del sitio.'
          ]
        },
        {
          title: '7. Privacidad de los Menores',
          content: [
            'Nuestros servicios no están dirigidos a menores de 13 años. No recopilamos información de menores de 13 años a sabiendas.',
            '',
            'Si cree que hemos recopilado información de un menor de 13 años, contáctenos de inmediato.'
          ]
        },
        {
          title: '8. Cambios a Esta Política',
          content: [
            'Podemos actualizar esta Política de Privacidad de vez en cuando. Le notificaremos de cambios significativos mediante:',
            '• Publicación de la nueva política en nuestro sitio web',
            '• Envío de una notificación por correo electrónico a usuarios registrados',
            '',
            'Su uso continuo de nuestros servicios después de los cambios indica aceptación de la política actualizada.'
          ]
        },
        {
          title: '9. Contáctenos',
          content: [
            'Si tiene preguntas sobre esta Política de Privacidad, contáctenos:',
            '',
            'Correo: ' + (companyInfo?.email || 'contacto@empresa.com'),
            'Teléfono: ' + (companyInfo?.phone || 'número de teléfono'),
            'Dirección: ' + (companyInfo?.city || 'Ciudad') + ', ' + (companyInfo?.state || 'Estado')
          ]
        }
      ]
    }
  };

  const currentContent = language === 'en' ? content.en : content.es;

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {language === 'en' ? 'Back to Home' : 'Volver al Inicio'}
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {currentContent.title}
          </h1>
          <p className="text-sm text-gray-500 mb-8">
            {currentContent.lastUpdated}: {new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>

          <div className="space-y-8">
            {currentContent.sections.map((section, index) => (
              <div key={index} className="border-l-4 border-blue-500 pl-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                  {section.title}
                </h2>
                <div className="text-gray-700 space-y-2">
                  {section.content.map((paragraph, pIndex) => (
                    <p key={pIndex} className={paragraph === '' ? 'h-2' : 'leading-relaxed'}>
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-center">
              {companyInfo?.company_name} &copy; {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
