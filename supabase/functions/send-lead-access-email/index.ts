import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  lead_id: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { lead_id }: EmailRequest = await req.json();

    if (!lead_id) {
      throw new Error("lead_id is required");
    }

    // Get lead data
    const { data: lead, error: leadError } = await supabase
      .from("leads")
      .select("*")
      .eq("id", lead_id)
      .single();

    if (leadError || !lead) {
      throw new Error(`Lead not found: ${leadError?.message}`);
    }

    if (!lead.branding_id) {
      throw new Error("Lead has no branding assigned");
    }

    // Get branding data
    const { data: branding, error: brandingError } = await supabase
      .from("brandings")
      .select("*")
      .eq("id", lead.branding_id)
      .single();

    if (brandingError || !branding) {
      throw new Error(`Branding not found: ${brandingError?.message}`);
    }

    // Get Resend config for this branding
    const { data: resendConfig, error: resendError } = await supabase
      .from("branding_resend_configs")
      .select("*")
      .eq("branding_id", lead.branding_id)
      .single();

    if (resendError || !resendConfig) {
      throw new Error(`Resend configuration not found for branding: ${resendError?.message}`);
    }

    if (!resendConfig.api_key) {
      throw new Error("No Resend API key configured for this branding");
    }

    // Get branding logo if available
    let logoBase64 = "";
    if (branding.logo_path) {
      try {
        const { data: logoData } = await supabase.storage
          .from("branding-logos")
          .download(branding.logo_path);
        
        if (logoData) {
          const arrayBuffer = await logoData.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);
          let binaryString = "";
          for (let i = 0; i < uint8Array.length; i++) {
            binaryString += String.fromCharCode(uint8Array[i]);
          }
          logoBase64 = btoa(binaryString);
        }
      } catch (e) {
        console.error("Failed to load logo:", e);
      }
    }

    // Extract first name from full_name
    const firstName = lead.full_name.split(" ")[0];
    const accentColor = branding.accent_color || "#3b82f6";
    const domain = branding.domain || "example.com";
    const authUrl = `https://${domain}/auth`;

    // Generate email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ihr Zugang wurde freigeschaltet</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f0f0f; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0f0f0f;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a;">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 40px 30px 40px; background: linear-gradient(135deg, ${accentColor}15 0%, transparent 50%);">
              ${logoBase64 ? `
              <img src="cid:logo" alt="${branding.name}" style="max-width: 180px; max-height: 60px; margin-bottom: 20px;" />
              ` : `
              <h1 style="color: #ffffff; font-size: 24px; margin: 0 0 20px 0;">${branding.name}</h1>
              `}
            </td>
          </tr>

          <!-- Success Icon -->
          <tr>
            <td align="center" style="padding: 0 40px;">
              <div style="width: 80px; height: 80px; background: linear-gradient(135deg, ${accentColor}, ${accentColor}cc); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                <span style="font-size: 40px;">🔓</span>
              </div>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 30px 40px;">
              <h2 style="color: #ffffff; font-size: 24px; margin: 0 0 10px 0; text-align: center;">
                Ihr Zugang wurde freigeschaltet!
              </h2>
              <p style="color: #888888; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0; text-align: center;">
                Herzlichen Glückwunsch, ${firstName}!
              </p>
              
              <div style="background-color: #0f0f0f; border-radius: 12px; padding: 25px; margin-bottom: 25px; border: 1px solid #2a2a2a;">
                <p style="color: #cccccc; font-size: 15px; line-height: 1.7; margin: 0;">
                  Wir freuen uns, Ihnen mitteilen zu können, dass Ihr Zugang zur <strong style="color: ${accentColor};">${branding.name}</strong> Plattform erfolgreich freigeschaltet wurde.
                </p>
                <p style="color: #cccccc; font-size: 15px; line-height: 1.7; margin: 20px 0 0 0;">
                  Sie können sich nun <strong style="color: #ffffff;">eigenständig registrieren</strong> und sofort mit dem Trading beginnen.
                </p>
              </div>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding: 10px 0 25px 0;">
                    <a href="${authUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, ${accentColor}, ${accentColor}dd); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 15px ${accentColor}40;">
                      Jetzt registrieren
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Info Box -->
              <div style="background-color: ${accentColor}10; border-radius: 12px; padding: 20px; border-left: 4px solid ${accentColor};">
                <p style="color: #cccccc; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong style="color: #ffffff;">💡 Tipp:</strong> Halten Sie Ihre Zugangsdaten sicher und teilen Sie diese nicht mit anderen Personen.
                </p>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #0f0f0f; border-top: 1px solid #2a2a2a;">
              <p style="color: #666666; font-size: 13px; line-height: 1.6; margin: 0; text-align: center;">
                Bei Fragen stehen wir Ihnen gerne zur Verfügung.<br>
                <span style="color: ${accentColor};">${branding.name}</span>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // Build attachments array for logo
    const attachments = logoBase64 ? [{
      filename: "logo.png",
      content: logoBase64,
      content_id: "logo",
    }] : [];

    // Send email via Resend
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendConfig.api_key}`,
      },
      body: JSON.stringify({
        from: `${resendConfig.from_name} <${resendConfig.from_email}>`,
        to: [lead.email],
        reply_to: resendConfig.reply_to || undefined,
        subject: `Ihr Zugang wurde freigeschaltet - ${branding.name}`,
        html: emailHtml,
        attachments: attachments.length > 0 ? attachments : undefined,
      }),
    });

    if (!resendResponse.ok) {
      const errorData = await resendResponse.text();
      throw new Error(`Failed to send email: ${errorData}`);
    }

    const resendData = await resendResponse.json();

    // Update lead status to email_sent
    const { error: updateError } = await supabase
      .from("leads")
      .update({
        status: "email_sent",
        status_updated_at: new Date().toISOString(),
      })
      .eq("id", lead_id);

    if (updateError) {
      console.error("Failed to update lead status:", updateError);
    }

    console.log(`Lead access email sent successfully to ${lead.email}`);

    return new Response(
      JSON.stringify({ success: true, email_id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error sending lead access email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

serve(handler);
