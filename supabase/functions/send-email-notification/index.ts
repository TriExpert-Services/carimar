import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface EmailRequest {
  to_email: string;
  to_name: string;
  subject: string;
  html_body: string;
  text_body?: string;
}

interface SMTPConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const emailRequest: EmailRequest = await req.json();

    const { to_email, to_name, subject, html_body, text_body } = emailRequest;

    if (!to_email || !subject || !html_body) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to_email, subject, html_body' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: smtpConfig, error: configError } = await supabaseClient
      .from('smtp_config')
      .select('*')
      .eq('active', true)
      .limit(1)
      .maybeSingle();

    if (configError || !smtpConfig) {
      return new Response(
        JSON.stringify({ error: 'SMTP configuration not found or inactive' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const config: SMTPConfig = smtpConfig;

    const { error: queueError } = await supabaseClient
      .from('email_queue')
      .insert([
        {
          to_email,
          to_name,
          subject,
          body_html: html_body,
          body_text: text_body || '',
          status: 'pending',
          scheduled_at: new Date().toISOString(),
        },
      ]);

    if (queueError) {
      console.error('Error adding email to queue:', queueError);
      return new Response(
        JSON.stringify({ error: 'Failed to queue email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Email queued successfully',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in send-email-notification:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});