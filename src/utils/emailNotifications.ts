import { supabase } from '../lib/supabase';
import { Quote, User } from '../types';

const getEmailTemplate = (type: string, data: any, language: 'en' | 'es') => {
  const templates = {
    quote_received: {
      en: {
        subject: 'New Quote Request Received',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">New Quote Request</h2>
            <p>A new quote request has been submitted:</p>
            <ul>
              <li><strong>Service:</strong> ${data.service}</li>
              <li><strong>Property Type:</strong> ${data.propertyType}</li>
              <li><strong>Square Footage:</strong> ${data.squareFeet} sq ft</li>
              <li><strong>Estimated Price:</strong> $${data.estimatedPrice}</li>
              <li><strong>Preferred Date:</strong> ${data.preferredDate || 'Not specified'}</li>
            </ul>
            <p>Please review and respond to this quote in your admin dashboard.</p>
          </div>
        `,
      },
      es: {
        subject: 'Nueva Solicitud de Cotización Recibida',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Nueva Solicitud de Cotización</h2>
            <p>Se ha enviado una nueva solicitud de cotización:</p>
            <ul>
              <li><strong>Servicio:</strong> ${data.service}</li>
              <li><strong>Tipo de Propiedad:</strong> ${data.propertyType}</li>
              <li><strong>Pies Cuadrados:</strong> ${data.squareFeet} pies²</li>
              <li><strong>Precio Estimado:</strong> $${data.estimatedPrice}</li>
              <li><strong>Fecha Preferida:</strong> ${data.preferredDate || 'No especificada'}</li>
            </ul>
            <p>Por favor revise y responda a esta cotización en su panel de administración.</p>
          </div>
        `,
      },
    },
    quote_approved: {
      en: {
        subject: 'Your Quote Has Been Approved',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Quote Approved!</h2>
            <p>Great news! Your quote has been approved.</p>
            <ul>
              <li><strong>Service:</strong> ${data.service}</li>
              <li><strong>Final Price:</strong> $${data.finalPrice}</li>
            </ul>
            <p>Log in to your client portal to schedule your service and complete payment.</p>
          </div>
        `,
      },
      es: {
        subject: 'Su Cotización Ha Sido Aprobada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">¡Cotización Aprobada!</h2>
            <p>¡Buenas noticias! Su cotización ha sido aprobada.</p>
            <ul>
              <li><strong>Servicio:</strong> ${data.service}</li>
              <li><strong>Precio Final:</strong> $${data.finalPrice}</li>
            </ul>
            <p>Inicie sesión en su portal de cliente para programar su servicio y completar el pago.</p>
          </div>
        `,
      },
    },
    quote_rejected: {
      en: {
        subject: 'Update on Your Quote Request',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Quote Update</h2>
            <p>Thank you for your interest. Unfortunately, we are unable to proceed with your quote request at this time.</p>
            <p>Please feel free to contact us directly if you have any questions or would like to discuss alternative options.</p>
          </div>
        `,
      },
      es: {
        subject: 'Actualización de Su Solicitud de Cotización',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Actualización de Cotización</h2>
            <p>Gracias por su interés. Lamentablemente, no podemos proceder con su solicitud de cotización en este momento.</p>
            <p>No dude en contactarnos directamente si tiene alguna pregunta o desea discutir opciones alternativas.</p>
          </div>
        `,
      },
    },
    booking_confirmed: {
      en: {
        subject: 'Booking Confirmed',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">Booking Confirmed!</h2>
            <p>Your cleaning service has been confirmed.</p>
            <ul>
              <li><strong>Date:</strong> ${data.date}</li>
              <li><strong>Time:</strong> ${data.time}</li>
              <li><strong>Service:</strong> ${data.service}</li>
              <li><strong>Total:</strong> $${data.price}</li>
            </ul>
            <p>We look forward to serving you!</p>
          </div>
        `,
      },
      es: {
        subject: 'Reserva Confirmada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">¡Reserva Confirmada!</h2>
            <p>Su servicio de limpieza ha sido confirmado.</p>
            <ul>
              <li><strong>Fecha:</strong> ${data.date}</li>
              <li><strong>Hora:</strong> ${data.time}</li>
              <li><strong>Servicio:</strong> ${data.service}</li>
              <li><strong>Total:</strong> $${data.price}</li>
            </ul>
            <p>¡Esperamos servirle!</p>
          </div>
        `,
      },
    },
  };

  const template = templates[type as keyof typeof templates];
  if (!template) {
    throw new Error(`Unknown email template type: ${type}`);
  }

  return template[language];
};

export const sendEmailNotification = async (
  type: string,
  recipientEmail: string,
  recipientName: string,
  data: any,
  language: 'en' | 'es' = 'en'
) => {
  try {
    const template = getEmailTemplate(type, data, language);

    const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-email-notification`;
    const headers = {
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        to_email: recipientEmail,
        to_name: recipientName,
        subject: template.subject,
        html_body: template.html,
        text_body: template.subject,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send email');
    }

    return { success: true };
  } catch (error) {
    console.error('Error sending email notification:', error);
    return { success: false, error };
  }
};

export const createNotification = async (
  userId: string,
  type: string,
  title: string,
  message: string,
  link?: string
) => {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id: userId,
        type,
        title,
        message,
        link,
        read: false,
      },
    ]);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false, error };
  }
};

export const notifyQuoteReceived = async (quote: Quote, adminUsers: User[]) => {
  for (const admin of adminUsers) {
    await createNotification(
      admin.id,
      'quote_received',
      'New Quote Request',
      `A new quote request for ${quote.tipo_servicio} has been submitted.`,
      `/admin/quotes/${quote.id}`
    );

    await sendEmailNotification(
      'quote_received',
      admin.email,
      admin.nombre,
      {
        service: quote.tipo_servicio,
        propertyType: quote.tipo_propiedad,
        squareFeet: quote.metros_cuadrados,
        estimatedPrice: quote.precio_estimado,
        preferredDate: quote.fecha_preferida,
      },
      admin.idioma_preferido
    );
  }
};

export const notifyQuoteApproved = async (quote: Quote, client: User) => {
  await createNotification(
    client.id,
    'quote_approved',
    'Quote Approved',
    `Your quote for ${quote.tipo_servicio} has been approved!`,
    `/client/quotes/${quote.id}`
  );

  await sendEmailNotification(
    'quote_approved',
    client.email,
    client.nombre,
    {
      service: quote.tipo_servicio,
      finalPrice: quote.precio_final || quote.precio_estimado,
    },
    client.idioma_preferido
  );
};

export const notifyQuoteRejected = async (quote: Quote, client: User) => {
  await createNotification(
    client.id,
    'quote_rejected',
    'Quote Update',
    `Your quote request for ${quote.tipo_servicio} has been updated.`,
    `/client/quotes/${quote.id}`
  );

  await sendEmailNotification(
    'quote_rejected',
    client.email,
    client.nombre,
    {
      service: quote.tipo_servicio,
    },
    client.idioma_preferido
  );
};
