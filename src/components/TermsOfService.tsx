import { ArrowLeft } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useCompanyInfo } from '../contexts/CompanyContext';

interface TermsOfServiceProps {
  onNavigate: (section: string) => void;
}

export const TermsOfService = ({ onNavigate }: TermsOfServiceProps) => {
  const { language } = useLanguage();
  const { companyInfo } = useCompanyInfo();

  const content = {
    en: {
      title: 'Terms of Service',
      lastUpdated: 'Last Updated',
      sections: [
        {
          title: '1. Acceptance of Terms',
          content: [
            'By accessing and using the services provided by ' + (companyInfo?.company_name || 'our company') + ', you accept and agree to be bound by these Terms of Service.',
            '',
            'If you do not agree to these terms, please do not use our services.',
            '',
            'We reserve the right to modify these terms at any time. Your continued use of our services constitutes acceptance of any changes.'
          ]
        },
        {
          title: '2. Service Description',
          content: [
            'We provide professional cleaning services including but not limited to:',
            '• Residential cleaning',
            '• Commercial cleaning',
            '• Deep cleaning services',
            '• Post-construction cleaning',
            '• Window cleaning',
            '• Carpet cleaning',
            '',
            'Service availability may vary by location. Specific service details will be confirmed upon booking.'
          ]
        },
        {
          title: '3. Booking and Scheduling',
          content: [
            '3.1 Quote Process',
            '• You can request a free quote through our website or by contacting us directly',
            '• Quotes are estimates and may be adjusted based on actual property conditions',
            '• Quotes are valid for 30 days from the date of issue',
            '',
            '3.2 Booking Confirmation',
            '• Services must be booked in advance',
            '• A confirmed booking requires acceptance of the quote and scheduling a service date',
            '• We will send you a confirmation email with service details',
            '',
            '3.3 Cancellation and Rescheduling',
            '• Cancellations must be made at least 24 hours before the scheduled service',
            '• Rescheduling requests should be made as early as possible',
            '• Late cancellations may be subject to a cancellation fee'
          ]
        },
        {
          title: '4. Pricing and Payment',
          content: [
            '4.1 Service Fees',
            '• Prices are based on property size, service type, and frequency',
            '• Final pricing will be confirmed before service',
            '• Additional charges may apply for services beyond the original scope',
            '',
            '4.2 Payment Terms',
            '• Payment is due upon completion of service or as otherwise agreed',
            '• We accept payments via Stripe, Google Pay, and Apple Pay',
            '• All payments are processed securely through third-party payment processors',
            '• Late payments may result in service suspension and additional fees'
          ]
        },
        {
          title: '5. Client Responsibilities',
          content: [
            'As a client, you agree to:',
            '• Provide accurate property information and special requirements',
            '• Ensure safe and accessible working conditions for our staff',
            '• Remove valuable or fragile items before service',
            '• Provide access to water, electricity, and necessary facilities',
            '• Secure pets during service',
            '• Notify us of any health or safety concerns',
            '',
            'Failure to meet these responsibilities may affect service quality or result in service cancellation.'
          ]
        },
        {
          title: '6. Our Responsibilities and Service Standards',
          content: [
            'We commit to:',
            '• Provide trained and professional cleaning staff',
            '• Use appropriate cleaning products and equipment',
            '• Maintain insurance coverage for our services',
            '• Respect your privacy and property',
            '• Complete services according to agreed specifications',
            '',
            'If you are not satisfied with our service, please contact us within 24 hours for resolution.'
          ]
        },
        {
          title: '7. Liability and Insurance',
          content: [
            '7.1 Our Liability',
            '• We maintain appropriate liability insurance',
            '• We are responsible for damage caused by our negligence',
            '• Claims must be reported within 24 hours of service',
            '',
            '7.2 Client Liability',
            '• You are responsible for any damage to our equipment caused by property conditions you failed to disclose',
            '• You are liable for injuries to our staff resulting from hazardous conditions not reported',
            '',
            '7.3 Limitation of Liability',
            '• Our liability is limited to the cost of the service performed',
            '• We are not liable for pre-existing damage or normal wear and tear',
            '• We are not responsible for loss or damage to items not secured by the client'
          ]
        },
        {
          title: '8. Intellectual Property',
          content: [
            'All content on our website, including text, graphics, logos, and images, is the property of ' + (companyInfo?.company_name || 'our company') + ' or its content suppliers.',
            '',
            'You may not reproduce, distribute, or create derivative works without our express written permission.'
          ]
        },
        {
          title: '9. Privacy and Data Protection',
          content: [
            'Your use of our services is also governed by our Privacy Policy.',
            '',
            'We collect and process personal information in accordance with applicable data protection laws.',
            '',
            'Please review our Privacy Policy for detailed information on how we handle your data.'
          ]
        },
        {
          title: '10. Dispute Resolution',
          content: [
            '10.1 Informal Resolution',
            '• We encourage you to contact us first to resolve any disputes informally',
            '• Most concerns can be resolved through direct communication',
            '',
            '10.2 Governing Law',
            '• These Terms are governed by the laws of ' + (companyInfo?.state || 'the state') + ', United States',
            '• Any disputes will be resolved in the courts of ' + (companyInfo?.state || 'the state'),
            '',
            '10.3 Arbitration',
            '• For disputes that cannot be resolved informally, both parties agree to binding arbitration',
            '• Each party will bear their own costs unless otherwise determined by the arbitrator'
          ]
        },
        {
          title: '11. Termination',
          content: [
            'We reserve the right to:',
            '• Refuse service to anyone for any reason',
            '• Terminate recurring service agreements with appropriate notice',
            '• Suspend or terminate your account for violation of these Terms',
            '',
            'You may terminate recurring services by providing written notice according to your service agreement.'
          ]
        },
        {
          title: '12. Miscellaneous',
          content: [
            '12.1 Entire Agreement',
            'These Terms constitute the entire agreement between you and ' + (companyInfo?.company_name || 'our company') + '.',
            '',
            '12.2 Severability',
            'If any provision is found unenforceable, the remaining provisions remain in full effect.',
            '',
            '12.3 No Waiver',
            'Our failure to enforce any right or provision does not constitute a waiver of that right.',
            '',
            '12.4 Assignment',
            'You may not assign these Terms without our written consent. We may assign our rights and obligations at any time.'
          ]
        },
        {
          title: '13. Contact Information',
          content: [
            'For questions about these Terms of Service, please contact us:',
            '',
            'Email: ' + (companyInfo?.email || 'contact@company.com'),
            'Phone: ' + (companyInfo?.phone || 'phone number'),
            'Address: ' + (companyInfo?.city || 'City') + ', ' + (companyInfo?.state || 'State'),
            '',
            'Thank you for choosing ' + (companyInfo?.company_name || 'our services') + '!'
          ]
        }
      ]
    },
    es: {
      title: 'Términos de Servicio',
      lastUpdated: 'Última Actualización',
      sections: [
        {
          title: '1. Aceptación de Términos',
          content: [
            'Al acceder y utilizar los servicios proporcionados por ' + (companyInfo?.company_name || 'nuestra empresa') + ', usted acepta y acuerda estar sujeto a estos Términos de Servicio.',
            '',
            'Si no está de acuerdo con estos términos, por favor no utilice nuestros servicios.',
            '',
            'Nos reservamos el derecho de modificar estos términos en cualquier momento. Su uso continuo de nuestros servicios constituye la aceptación de cualquier cambio.'
          ]
        },
        {
          title: '2. Descripción del Servicio',
          content: [
            'Proporcionamos servicios profesionales de limpieza que incluyen, entre otros:',
            '• Limpieza residencial',
            '• Limpieza comercial',
            '• Servicios de limpieza profunda',
            '• Limpieza post-construcción',
            '• Limpieza de ventanas',
            '• Limpieza de alfombras',
            '',
            'La disponibilidad del servicio puede variar según la ubicación. Los detalles específicos del servicio se confirmarán al momento de la reserva.'
          ]
        },
        {
          title: '3. Reserva y Programación',
          content: [
            '3.1 Proceso de Cotización',
            '• Puede solicitar una cotización gratuita a través de nuestro sitio web o contactándonos directamente',
            '• Las cotizaciones son estimaciones y pueden ajustarse según las condiciones reales de la propiedad',
            '• Las cotizaciones son válidas por 30 días desde la fecha de emisión',
            '',
            '3.2 Confirmación de Reserva',
            '• Los servicios deben reservarse con anticipación',
            '• Una reserva confirmada requiere la aceptación de la cotización y la programación de una fecha de servicio',
            '• Le enviaremos un correo de confirmación con los detalles del servicio',
            '',
            '3.3 Cancelación y Reprogramación',
            '• Las cancelaciones deben realizarse al menos 24 horas antes del servicio programado',
            '• Las solicitudes de reprogramación deben hacerse lo antes posible',
            '• Las cancelaciones tardías pueden estar sujetas a una tarifa de cancelación'
          ]
        },
        {
          title: '4. Precios y Pago',
          content: [
            '4.1 Tarifas de Servicio',
            '• Los precios se basan en el tamaño de la propiedad, tipo de servicio y frecuencia',
            '• El precio final se confirmará antes del servicio',
            '• Pueden aplicarse cargos adicionales por servicios más allá del alcance original',
            '',
            '4.2 Términos de Pago',
            '• El pago vence al completar el servicio o según se acuerde',
            '• Aceptamos pagos a través de Stripe, Google Pay y Apple Pay',
            '• Todos los pagos se procesan de forma segura a través de procesadores de pago de terceros',
            '• Los pagos atrasados pueden resultar en suspensión del servicio y tarifas adicionales'
          ]
        },
        {
          title: '5. Responsabilidades del Cliente',
          content: [
            'Como cliente, usted acepta:',
            '• Proporcionar información precisa de la propiedad y requisitos especiales',
            '• Garantizar condiciones de trabajo seguras y accesibles para nuestro personal',
            '• Retirar artículos valiosos o frágiles antes del servicio',
            '• Proporcionar acceso a agua, electricidad e instalaciones necesarias',
            '• Asegurar mascotas durante el servicio',
            '• Notificarnos de cualquier problema de salud o seguridad',
            '',
            'El incumplimiento de estas responsabilidades puede afectar la calidad del servicio o resultar en la cancelación del mismo.'
          ]
        },
        {
          title: '6. Nuestras Responsabilidades y Estándares de Servicio',
          content: [
            'Nos comprometemos a:',
            '• Proporcionar personal de limpieza capacitado y profesional',
            '• Utilizar productos y equipos de limpieza apropiados',
            '• Mantener cobertura de seguro para nuestros servicios',
            '• Respetar su privacidad y propiedad',
            '• Completar los servicios según las especificaciones acordadas',
            '',
            'Si no está satisfecho con nuestro servicio, contáctenos dentro de las 24 horas para resolverlo.'
          ]
        },
        {
          title: '7. Responsabilidad y Seguro',
          content: [
            '7.1 Nuestra Responsabilidad',
            '• Mantenemos un seguro de responsabilidad civil apropiado',
            '• Somos responsables por daños causados por nuestra negligencia',
            '• Los reclamos deben reportarse dentro de las 24 horas del servicio',
            '',
            '7.2 Responsabilidad del Cliente',
            '• Usted es responsable de cualquier daño a nuestro equipo causado por condiciones de propiedad que no reveló',
            '• Usted es responsable de lesiones a nuestro personal resultantes de condiciones peligrosas no reportadas',
            '',
            '7.3 Limitación de Responsabilidad',
            '• Nuestra responsabilidad se limita al costo del servicio realizado',
            '• No somos responsables por daños preexistentes o desgaste normal',
            '• No somos responsables por pérdida o daño a artículos no asegurados por el cliente'
          ]
        },
        {
          title: '8. Propiedad Intelectual',
          content: [
            'Todo el contenido de nuestro sitio web, incluidos textos, gráficos, logotipos e imágenes, es propiedad de ' + (companyInfo?.company_name || 'nuestra empresa') + ' o sus proveedores de contenido.',
            '',
            'No puede reproducir, distribuir o crear trabajos derivados sin nuestro permiso expreso por escrito.'
          ]
        },
        {
          title: '9. Privacidad y Protección de Datos',
          content: [
            'Su uso de nuestros servicios también está regido por nuestra Política de Privacidad.',
            '',
            'Recopilamos y procesamos información personal de acuerdo con las leyes aplicables de protección de datos.',
            '',
            'Revise nuestra Política de Privacidad para obtener información detallada sobre cómo manejamos sus datos.'
          ]
        },
        {
          title: '10. Resolución de Disputas',
          content: [
            '10.1 Resolución Informal',
            '• Le animamos a contactarnos primero para resolver cualquier disputa de manera informal',
            '• La mayoría de las preocupaciones pueden resolverse mediante comunicación directa',
            '',
            '10.2 Ley Aplicable',
            '• Estos Términos se rigen por las leyes de ' + (companyInfo?.state || 'el estado') + ', Estados Unidos',
            '• Cualquier disputa se resolverá en los tribunales de ' + (companyInfo?.state || 'el estado'),
            '',
            '10.3 Arbitraje',
            '• Para disputas que no puedan resolverse informalmente, ambas partes aceptan el arbitraje vinculante',
            '• Cada parte asumirá sus propios costos a menos que el árbitro determine lo contrario'
          ]
        },
        {
          title: '11. Terminación',
          content: [
            'Nos reservamos el derecho de:',
            '• Rechazar el servicio a cualquier persona por cualquier motivo',
            '• Terminar acuerdos de servicio recurrente con aviso apropiado',
            '• Suspender o terminar su cuenta por violación de estos Términos',
            '',
            'Puede terminar los servicios recurrentes proporcionando aviso por escrito según su acuerdo de servicio.'
          ]
        },
        {
          title: '12. Disposiciones Generales',
          content: [
            '12.1 Acuerdo Completo',
            'Estos Términos constituyen el acuerdo completo entre usted y ' + (companyInfo?.company_name || 'nuestra empresa') + '.',
            '',
            '12.2 Divisibilidad',
            'Si alguna disposición se considera inaplicable, las disposiciones restantes permanecen en pleno efecto.',
            '',
            '12.3 No Renuncia',
            'Nuestra falta de aplicación de cualquier derecho o disposición no constituye una renuncia a ese derecho.',
            '',
            '12.4 Cesión',
            'No puede ceder estos Términos sin nuestro consentimiento por escrito. Podemos ceder nuestros derechos y obligaciones en cualquier momento.'
          ]
        },
        {
          title: '13. Información de Contacto',
          content: [
            'Para preguntas sobre estos Términos de Servicio, contáctenos:',
            '',
            'Correo: ' + (companyInfo?.email || 'contacto@empresa.com'),
            'Teléfono: ' + (companyInfo?.phone || 'número de teléfono'),
            'Dirección: ' + (companyInfo?.city || 'Ciudad') + ', ' + (companyInfo?.state || 'Estado'),
            '',
            '¡Gracias por elegir ' + (companyInfo?.company_name || 'nuestros servicios') + '!'
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
