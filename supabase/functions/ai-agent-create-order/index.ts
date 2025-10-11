import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-API-Key',
};

interface OrderItem {
  service_name: string;
  description?: string;
  quantity: number;
  unit_price: number;
}

interface CreateOrderRequest {
  client_email: string;
  client_name: string;
  client_phone?: string;
  service_type: string;
  service_address: string;
  service_date: string;
  service_time: string;
  items: OrderItem[];
  special_instructions?: string;
  agent_session_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = req.headers.get('X-API-Key');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!apiKey || apiKey !== Deno.env.get('AI_AGENT_API_KEY')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const requestData: CreateOrderRequest = await req.json();

    const {
      client_email,
      client_name,
      client_phone,
      service_type,
      service_address,
      service_date,
      service_time,
      items,
      special_instructions,
      agent_session_id,
    } = requestData;

    if (!client_email || !service_type || !service_address || !service_date || !service_time || !items || items.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let clientId: string;
    
    const { data: existingUser, error: userCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('email', client_email)
      .maybeSingle();

    if (existingUser) {
      clientId = existingUser.id;
    } else {
      const tempPassword = crypto.randomUUID();
      
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: client_email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          nombre: client_name,
          telefono: client_phone || '',
        },
      });

      if (authError || !authData.user) {
        throw new Error(`Failed to create auth user: ${authError?.message}`);
      }

      clientId = authData.user.id;

      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: clientId,
          email: client_email,
          nombre: client_name,
          telefono: client_phone || '',
          role: 'client',
        });

      if (userError) {
        throw new Error(`Failed to create user profile: ${userError.message}`);
      }

      await supabase.auth.admin.inviteUserByEmail(client_email);
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        client_id: clientId,
        service_type,
        service_address,
        service_date,
        service_time,
        status: 'pending',
        payment_status: 'unpaid',
        special_instructions,
        created_by_agent: true,
        agent_session_id: agent_session_id || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      throw new Error(`Failed to create order: ${orderError?.message}`);
    }

    const orderItems = items.map((item) => ({
      order_id: order.id,
      service_name: item.service_name,
      description: item.description || null,
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal: item.quantity * item.unit_price,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) {
      await supabase.from('orders').delete().eq('id', order.id);
      throw new Error(`Failed to create order items: ${itemsError.message}`);
    }

    const { data: updatedOrder } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', order.id)
      .single();

    await supabase.from('notifications').insert({
      user_id: clientId,
      type: 'order_created',
      title: 'New Order Created',
      message: `Your order for ${service_type} has been created and is pending confirmation.`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        order: updatedOrder,
        message: 'Order created successfully',
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating order:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});