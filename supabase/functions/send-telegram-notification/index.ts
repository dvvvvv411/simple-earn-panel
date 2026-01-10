import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TelegramConfig {
  bot_token: string | null;
  chat_id: string | null;
  enabled: boolean;
  notify_new_user: boolean;
  notify_deposit_created: boolean;
  notify_deposit_paid: boolean;
  notify_withdrawal: boolean;
  notify_support_ticket: boolean;
  notify_kyc_submitted: boolean;
}

interface NotificationData {
  event_type: 'new_user' | 'deposit_created' | 'deposit_paid' | 'withdrawal_created' | 'support_ticket' | 'kyc_submitted' | 'test';
  data: Record<string, unknown>;
}

function formatMessage(eventType: string, data: Record<string, unknown>): string {
  const now = new Date().toLocaleString('de-DE', { 
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const branding = data.branding || '?';

  switch (eventType) {
    case 'test':
      return `🧪 *Test-Nachricht*\n━━━━━━━━━━━━━━━━\n✅ Telegram-Benachrichtigungen funktionieren!\n📅 ${now}`;
    
    case 'new_user':
      const phone = data.phone || 'Nicht angegeben';
      return `🆕 *Neuer Benutzer*\n━━━━━━━━━━━━━━━━\n📧 Email: ${data.email || 'Unbekannt'}\n👤 Name: ${data.name || 'Nicht angegeben'}\n📞 Telefon: ${phone}\n🏷️ Branding: ${branding}\n📅 ${now}`;
    
    case 'deposit_created':
      return `💰 *Neue Einzahlung erstellt*\n━━━━━━━━━━━━━━━━\n📧 ${data.email || 'Unbekannt'}\n💵 Betrag: €${Number(data.amount || 0).toFixed(2)}\n🔗 Währung: ${data.currency || 'BTC'}\n🏷️ Branding: ${branding}\n📅 ${now}`;
    
    case 'deposit_paid':
      return `✅ *Einzahlung bezahlt*\n━━━━━━━━━━━━━━━━\n📧 ${data.email || 'Unbekannt'}\n💵 Betrag: €${Number(data.amount || 0).toFixed(2)}\n🏷️ Branding: ${branding}\n📅 ${now}`;
    
    case 'withdrawal_created':
      const wallet = String(data.wallet || '');
      const shortWallet = wallet.length > 15 ? `${wallet.slice(0, 8)}...${wallet.slice(-6)}` : wallet;
      return `💸 *Auszahlungsantrag*\n━━━━━━━━━━━━━━━━\n📧 ${data.email || 'Unbekannt'}\n💵 Betrag: €${Number(data.amount || 0).toFixed(2)}\n📍 Wallet: ${shortWallet}\n🏷️ Branding: ${branding}\n📅 ${now}`;
    
    case 'support_ticket':
      const priorityEmoji = data.priority === 'high' ? '🔴' : data.priority === 'medium' ? '🟡' : '🟢';
      const action = data.is_reply ? 'Antwort auf' : 'Neues';
      return `🎫 *${action} Support-Ticket*\n━━━━━━━━━━━━━━━━\n📧 ${data.email || 'Unbekannt'}\n📝 Betreff: ${data.subject || 'Kein Betreff'}\n${priorityEmoji} Priorität: ${data.priority || 'Normal'}\n🏷️ Branding: ${branding}\n📅 ${now}`;
    
    case 'kyc_submitted':
      return `📋 *Neue KYC-Verifizierung*\n━━━━━━━━━━━━━━━━\n📧 ${data.email || 'Unbekannt'}\n👤 Name: ${data.name || 'Nicht angegeben'}\n🏷️ Branding: ${branding}\n📅 ${now}`;
    
    default:
      return `📢 *Benachrichtigung*\n━━━━━━━━━━━━━━━━\n${JSON.stringify(data)}\n📅 ${now}`;
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, message: string): Promise<boolean> {
  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const result = await response.json();
    
    if (!result.ok) {
      console.error('Telegram API error:', result);
      return false;
    }
    
    console.log('Telegram message sent successfully');
    return true;
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { event_type, data } = await req.json() as NotificationData;

    console.log('Received notification request:', { event_type, data });

    // Get telegram config
    const { data: configData, error: configError } = await supabaseAdmin
      .from('telegram_config')
      .select('*')
      .limit(1)
      .single();

    if (configError || !configData) {
      console.log('No telegram config found or error:', configError);
      return new Response(
        JSON.stringify({ success: false, reason: 'No config found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const config = configData as TelegramConfig;

    // Check if notifications are enabled
    if (!config.enabled && event_type !== 'test') {
      console.log('Telegram notifications are disabled');
      return new Response(
        JSON.stringify({ success: false, reason: 'Notifications disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if bot token and chat ID are configured
    if (!config.bot_token || !config.chat_id) {
      console.log('Bot token or chat ID not configured');
      return new Response(
        JSON.stringify({ success: false, reason: 'Bot not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if specific notification type is enabled (skip for test)
    if (event_type !== 'test') {
      const notificationTypeMap: Record<string, keyof TelegramConfig> = {
        'new_user': 'notify_new_user',
        'deposit_created': 'notify_deposit_created',
        'deposit_paid': 'notify_deposit_paid',
        'withdrawal_created': 'notify_withdrawal',
        'support_ticket': 'notify_support_ticket',
        'kyc_submitted': 'notify_kyc_submitted',
      };

      const configKey = notificationTypeMap[event_type];
      if (configKey && !config[configKey]) {
        console.log(`Notification type ${event_type} is disabled`);
        return new Response(
          JSON.stringify({ success: false, reason: `${event_type} notifications disabled` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If we have a user_id, fetch the user's email and branding
    let enrichedData = { ...data };
    if (data.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('email, first_name, last_name, phone, branding_id')
        .eq('id', data.user_id)
        .single();
      
      if (profile) {
        if (!enrichedData.email) {
          enrichedData.email = profile.email;
        }
        if (!enrichedData.name && (profile.first_name || profile.last_name)) {
          enrichedData.name = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
        }
        if (!enrichedData.phone && profile.phone) {
          enrichedData.phone = profile.phone;
        }
        
        // Fetch branding name if branding_id exists
        if (profile.branding_id && !enrichedData.branding) {
          const { data: branding } = await supabaseAdmin
            .from('brandings')
            .select('name')
            .eq('id', profile.branding_id)
            .single();
          
          enrichedData.branding = branding?.name || '?';
        } else if (!enrichedData.branding) {
          enrichedData.branding = '?';
        }
      }
    }
    
    // Fallback: If branding_id was passed directly but not resolved yet
    if (data.branding_id && !enrichedData.branding) {
      const { data: branding } = await supabaseAdmin
        .from('brandings')
        .select('name')
        .eq('id', data.branding_id)
        .single();
      
      enrichedData.branding = branding?.name || '?';
    }
    
    // Default branding if still not set
    if (!enrichedData.branding) {
      enrichedData.branding = '?';
    }

    // Format and send message
    const message = formatMessage(event_type, enrichedData);
    const success = await sendTelegramMessage(config.bot_token, config.chat_id, message);

    return new Response(
      JSON.stringify({ success }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-telegram-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
