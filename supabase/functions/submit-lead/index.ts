import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface LeadData {
  full_name: string;
  email: string;
  phone: string;
  branding_id: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const leadData: LeadData = await req.json();

    console.log('Received lead submission:', leadData);

    // Validate required fields
    if (!leadData.full_name || !leadData.email || !leadData.phone || !leadData.branding_id) {
      console.log('Validation failed: Missing required fields');
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: full_name, email, phone, branding_id' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadData.email)) {
      console.log('Validation failed: Invalid email format');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid email format' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Verify branding exists
    const { data: branding, error: brandingError } = await supabaseAdmin
      .from('brandings')
      .select('id, name')
      .eq('id', leadData.branding_id)
      .single();

    if (brandingError || !branding) {
      console.log('Validation failed: Invalid branding_id');
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid branding_id' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Insert lead into database
    const { data: lead, error: insertError } = await supabaseAdmin
      .from('leads')
      .insert({
        full_name: leadData.full_name.trim(),
        email: leadData.email.trim().toLowerCase(),
        phone: leadData.phone.trim(),
        branding_id: leadData.branding_id
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting lead:', insertError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to save lead' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('Lead saved successfully:', lead.id);

    // Send Telegram notification
    try {
      const telegramResponse = await fetch(
        `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-telegram-notification`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`
          },
          body: JSON.stringify({
            event_type: 'new_lead',
            data: {
              full_name: lead.full_name,
              email: lead.email,
              phone: lead.phone,
              branding: branding.name
            }
          })
        }
      );

      const telegramResult = await telegramResponse.json();
      console.log('Telegram notification result:', telegramResult);
    } catch (telegramError) {
      // Don't fail the request if Telegram notification fails
      console.error('Error sending Telegram notification:', telegramError);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Lead submitted successfully',
        lead_id: lead.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-lead:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
