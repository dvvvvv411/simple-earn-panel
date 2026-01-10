import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BankKycRejectionPayload {
  user_id: string;
  rejection_reason: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('📧 Send Bank KYC Rejection started');

    const payload: BankKycRejectionPayload = await req.json();
    console.log('📦 Payload received:', payload);

    if (!payload.user_id || !payload.rejection_reason) {
      return new Response(
        JSON.stringify({ success: false, error: 'user_id and rejection_reason are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email, email_notifications, branding_id, first_name, last_name')
      .eq('id', payload.user_id)
      .single();

    if (profileError || !userProfile) {
      console.error('❌ Error fetching user profile:', profileError);
      return new Response(
        JSON.stringify({ success: false, error: 'User profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    if (!userProfile.email) {
      console.log('📭 No email address found for user, skipping');
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'no_email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Load Resend config
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

    // Load branding
    const { data: branding } = await supabase
      .from('brandings')
      .select('name, accent_color, logo_path, domain')
      .eq('id', userProfile.branding_id)
      .single();

    const accentColor = branding?.accent_color || '#3B82F6';
    const brandingName = branding?.name || 'Trading Platform';
    const domain = branding?.domain || 'app.example.com';

    // Load logo as Base64
    let logoBase64 = '';
    if (branding?.logo_path) {
      try {
        const { data: logoData, error: logoError } = await supabase.storage
          .from('branding-logos')
          .download(branding.logo_path);
        
        if (logoData && !logoError) {
          const arrayBuffer = await logoData.arrayBuffer();
          const bytes = new Uint8Array(arrayBuffer);
          let binary = '';
          for (let i = 0; i < bytes.length; i++) {
            binary += String.fromCharCode(bytes[i]);
          }
          const base64 = btoa(binary);
          const extension = branding.logo_path.split('.').pop()?.toLowerCase();
          const mimeType = extension === 'png' ? 'image/png' : extension === 'svg' ? 'image/svg+xml' : 'image/jpeg';
          logoBase64 = `data:${mimeType};base64,${base64}`;
          console.log('✅ Logo loaded as Base64');
        }
      } catch (e) {
        console.error('❌ Error loading logo:', e);
      }
    }

    const firstName = userProfile.first_name || 'Kunde';
    const lastName = userProfile.last_name || '';
    const fullName = lastName ? `${firstName} ${lastName}` : firstName;

    const htmlEmail = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bank-Verifizierung nicht erfolgreich</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f5f5f7;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #ffffff; padding: 32px 40px; text-align: center; border-bottom: 1px solid #e5e7eb;">
              ${logoBase64 
                ? `<img src="${logoBase64}" alt="${brandingName}" style="max-height: 48px; max-width: 200px; margin: 0 auto 12px auto; display: block;">`
                : `<h1 style="margin: 0 0 12px 0; color: #1f2937; font-size: 24px; font-weight: 700;">${brandingName}</h1>`
              }
              <p style="margin: 0; color: #6b7280; font-size: 14px; font-weight: 500;">
                Bank-Verifizierung
              </p>
            </td>
          </tr>

          <!-- Error Icon -->
          <tr>
            <td style="padding: 40px 40px 20px 40px; text-align: center;">
              <div style="width: 80px; height: 80px; background-color: #fef2f2; border-radius: 50%; display: inline-block; line-height: 80px;">
                <span style="font-size: 40px; color: #dc2626;">✗</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              
              <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 24px; font-weight: 700; text-align: center;">
                Bank-Verifizierung nicht erfolgreich
              </h2>
              
              <p style="margin: 0 0 16px 0; color: #1f2937; font-size: 16px;">
                Sehr geehrte/r ${fullName},
              </p>
              
              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                leider konnte Ihre Bank-Verifizierung nicht genehmigt werden.
              </p>

              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px 0; color: #b91c1c; font-size: 14px; font-weight: 600;">
                  Grund der Ablehnung:
                </p>
                <p style="margin: 0; color: #991b1b; font-size: 15px; line-height: 1.6;">
                  ${payload.rejection_reason}
                </p>
              </div>

              <p style="margin: 0 0 24px 0; color: #4b5563; font-size: 15px; line-height: 1.6;">
                Sie können die Verifizierung erneut einreichen, sobald Sie die genannten Punkte korrigiert haben.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                <tr>
                  <td style="text-align: center;">
                    <a href="https://${domain}/kryptotrading/wallet" style="display: inline-block; background-color: ${accentColor}; color: white; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 14px; font-weight: 500;">
                      Erneut einreichen
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Closing Text -->
              <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                  Bei Fragen stehen wir Ihnen gerne zur Verfügung.
                </p>
                <p style="margin: 0; color: #1f2937; font-size: 14px; line-height: 1.6;">
                  Mit freundlichen Grüßen<br>
                  ${brandingName}
                </p>
              </div>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f3f4f6; padding: 24px 40px; border-top: 1px solid #e5e7eb;">
              <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} ${brandingName}
              </p>
              <p style="margin: 0; color: #9ca3af; font-size: 11px; text-align: center;">
                Diese E-Mail wurde automatisch erstellt.
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

    // Send email via Resend
    const resend = new Resend(resendConfig.api_key);

    const { data: emailResult, error: emailError } = await resend.emails.send({
      from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
      reply_to: resendConfig.reply_to || undefined,
      to: [userProfile.email],
      subject: `Bank-Verifizierung nicht erfolgreich - ${brandingName}`,
      html: htmlEmail,
    });

    if (emailError) {
      console.error('❌ Error sending email:', emailError);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send email', details: emailError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    console.log('✅ Bank KYC rejection email sent successfully:', emailResult);

    return new Response(
      JSON.stringify({ success: true, email_id: emailResult?.id }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('💥 Error in send-bank-kyc-rejection:', error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
