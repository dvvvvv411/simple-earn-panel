import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface TradeNotificationPayload {
  user_id: string;
  bot_id: string;
  cryptocurrency: string;
  symbol: string;
  trade_type: string;
  buy_price: number;
  sell_price: number;
  leverage: number;
  start_amount: number;
  profit_amount: number;
  profit_percent: number;
  started_at: string;
  completed_at: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Send Trade Notification started');

    const payload: TradeNotificationPayload = await req.json();
    console.log('📦 Payload received:', payload);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Load user profile with email_notifications setting
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, email_notifications, branding_id, first_name')
      .eq('id', payload.user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    // Step 2: Check if notifications are enabled
    if (!userProfile.email_notifications) {
      console.log('📭 Email notifications disabled for user, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'notifications_disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!userProfile.email) {
      console.log('📭 No email address found for user, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'no_email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 3: Load Resend config from branding_resend_configs table
    const { data: resendConfig, error: resendError } = await supabase
      .from('branding_resend_configs')
      .select('api_key, from_name, from_email, reply_to')
      .eq('branding_id', userProfile.branding_id)
      .single();

    if (resendError || !resendConfig || !resendConfig.api_key) {
      console.error('❌ No Resend config found for branding:', resendError);
      return new Response(
        JSON.stringify({ success: false, error: 'No Resend configuration found for branding' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 4: Load branding for accent color
    const { data: branding, error: brandingError } = await supabase
      .from('brandings')
      .select('name, accent_color, logo_path, domain')
      .eq('id', userProfile.branding_id)
      .single();

    if (brandingError) {
      console.error('❌ Error fetching branding:', brandingError);
    }

    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Trading Platform';
    const domain = branding?.domain || 'app.example.com';

    // Step 5: Generate HTML email
    const isProfit = payload.profit_percent >= 0;
    const profitColor = isProfit ? '#10B981' : '#DC2626';
    const profitSign = isProfit ? '+' : '';
    
    // Calculate trade duration
    const startDate = new Date(payload.started_at);
    const endDate = new Date(payload.completed_at);
    const durationMs = endDate.getTime() - startDate.getTime();
    const durationMinutes = Math.floor(durationMs / (1000 * 60));
    const durationSeconds = Math.floor((durationMs % (1000 * 60)) / 1000);
    const durationString = `${durationMinutes}m ${durationSeconds}s`;

    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    };

    const formatPrice = (price: number) => {
      return new Intl.NumberFormat('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 4,
      }).format(price);
    };

    const firstName = userProfile.first_name || 'Trader';
    const cryptoIconUrl = `https://nowpayments.io/images/coins/${payload.symbol.toLowerCase()}.svg`;

    const htmlEmail = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Trade abgeschlossen</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%); padding: 32px 40px; text-align: center;">
              <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;">
                ${brandingName}
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                Trading Benachrichtigung
              </p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 40px;">
              
              <!-- Greeting -->
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 18px; font-weight: 600;">
                Hallo ${firstName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                wir freuen uns, Ihnen mitteilen zu können, dass Ihr automatisierter Trade auf <strong>${brandingName}</strong> soeben erfolgreich abgeschlossen wurde.
              </p>
              
              <!-- Success/Result Banner -->
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; background-color: ${isProfit ? '#ecfdf5' : '#fef2f2'}; border: 1px solid ${isProfit ? '#a7f3d0' : '#fecaca'}; border-radius: 12px; padding: 16px 24px;">
                  <p style="margin: 0; color: ${profitColor}; font-size: 18px; font-weight: 600;">
                    ${isProfit ? '🎉 Ihr Trade wurde erfolgreich abgeschlossen!' : '📊 Ihr Trade wurde abgeschlossen'}
                  </p>
                </div>
              </div>

              <p style="margin: 0 0 20px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Hier sind die Details Ihres Trades:
              </p>

              <!-- Trade Details Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 24px;">
                
                <!-- Crypto Header -->
                <tr>
                  <td style="padding: 20px 24px; border-bottom: 1px solid #e2e8f0;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="width: 48px;">
                          <img src="${cryptoIconUrl}" alt="${payload.symbol}" width="40" height="40" style="border-radius: 50%; background-color: #e2e8f0;">
                        </td>
                        <td style="padding-left: 12px;">
                          <p style="margin: 0; color: #1f2937; font-size: 18px; font-weight: 600;">${payload.cryptocurrency}</p>
                          <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${payload.symbol}</p>
                        </td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: ${payload.trade_type === 'long' ? '#dcfce7' : '#fee2e2'}; color: ${payload.trade_type === 'long' ? '#16a34a' : '#dc2626'}; padding: 6px 12px; border-radius: 6px; font-size: 13px; font-weight: 600;">
                            ${payload.trade_type.toUpperCase()} ${payload.leverage}x
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Trade Details -->
                <tr>
                  <td style="padding: 20px 24px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="padding-bottom: 12px;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Einstiegspreis</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">${formatPrice(payload.buy_price)}</p>
                        </td>
                        <td style="padding-bottom: 12px; text-align: right;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Ausstiegspreis</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">${formatPrice(payload.sell_price)}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top: 12px; border-top: 1px solid #e2e8f0;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Investiert</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">${formatCurrency(payload.start_amount)}</p>
                        </td>
                        <td style="padding-top: 12px; border-top: 1px solid #e2e8f0; text-align: right;">
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Trade-Dauer</p>
                          <p style="margin: 4px 0 0 0; color: #1f2937; font-size: 16px; font-weight: 500;">${durationString}</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Result -->
                <tr>
                  <td style="background-color: ${isProfit ? '#ecfdf5' : '#fef2f2'}; padding: 20px 24px; border-top: 1px solid ${isProfit ? '#a7f3d0' : '#fecaca'};">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td>
                          <p style="margin: 0; color: #6b7280; font-size: 13px;">Ergebnis</p>
                          <p style="margin: 4px 0 0 0; color: ${profitColor}; font-size: 24px; font-weight: 700;">
                            ${profitSign}${formatCurrency(payload.profit_amount)}
                          </p>
                        </td>
                        <td style="text-align: right;">
                          <span style="display: inline-block; background-color: ${isProfit ? '#dcfce7' : '#fee2e2'}; color: ${profitColor}; padding: 8px 16px; border-radius: 8px; font-size: 18px; font-weight: 700;">
                            ${profitSign}${payload.profit_percent.toFixed(2)}%
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

              </table>

              <!-- Additional Text -->
              <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Ihr Guthaben wurde automatisch aktualisiert und steht Ihnen sofort für weitere Trades zur Verfügung.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-top: 32px;">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading/historie" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-size: 16px; font-weight: 600;">
                      Trading-Historie ansehen
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                  Vielen Dank, dass Sie <strong>${brandingName}</strong> für Ihr automatisiertes Trading nutzen. Bei Fragen zu Ihrem Trade oder zur Plattform steht Ihnen unser Support-Team jederzeit zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 15px; line-height: 1.6;">
                  Mit freundlichen Grüßen,<br>
                  <strong>Ihr ${brandingName} Trading-Team</strong>
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${brandingName} · Automatisiertes Trading
              </p>
              <p style="margin: 0 0 8px 0; color: #9ca3af; font-size: 12px; text-align: center;">
                Sie erhalten diese E-Mail, weil Sie Trade-Benachrichtigungen aktiviert haben.
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 12px; text-align: center;">
                <a href="https://${domain}/kryptotrading/einstellungen" style="color: ${accentColor}; text-decoration: none;">Benachrichtigungen verwalten</a>
                <span style="margin: 0 8px;">·</span>
                <a href="https://${domain}/kryptotrading/support" style="color: ${accentColor}; text-decoration: none;">Hilfe & Support</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    // Step 6: Send email via Resend (API Key from database!)
    const resend = new Resend(resendConfig.api_key);

    const subject = `Trade abgeschlossen: ${profitSign}${payload.profit_percent.toFixed(2)}% ${isProfit ? 'Gewinn' : 'Verlust'} - ${payload.cryptocurrency}`;

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
      reply_to: resendConfig.reply_to || undefined,
      to: [userProfile.email],
      subject: subject,
      html: htmlEmail,
    });

    if (emailError) {
      console.error('❌ Error sending email:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email', details: emailError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in send-trade-notification:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
