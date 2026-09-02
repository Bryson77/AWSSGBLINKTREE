import { createClient } from "@supabase/supabase-js";

interface Env {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  RESEND_API_KEY?: string;
  ADMIN_NOTIFICATION_EMAIL?: string;
  ENQUIRIES_EMAIL?: string;
}

export const onRequest = async (context: { request: Request; env: Env }) => {
  const { request, env } = context;

  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json() as {
      name?: string;
      email?: string;
      category?: string;
      message?: string;
    };

    const { name, email, category, message } = body;

    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields (name, email, message)." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || "https://yzmgkreucvbftolijtpl.supabase.co";
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl6bWdrcmV1Y3ZiZnRvbGlqdHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODgyODc3NzcsImV4cCI6MjEwMzg2Mzc3N30.qvIN3i_hTOEclyULEZhUZg_8PbNC4xM277EOjvjH9OU";

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Insert into inquiries table
    const { data: inquiryData, error: dbError } = await supabase
      .from("inquiries")
      .insert({
        name: name.trim(),
        email: email.trim(),
        category: category || "General Inquiry",
        message: message.trim(),
        status: "unread",
      })
      .select()
      .single();

    if (dbError) {
      console.warn("DB insert notice:", dbError.message);
    }

    // 2. Send email notifications if RESEND_API_KEY is configured
    if (env.RESEND_API_KEY) {
      const enquiriesRecipient = env.ENQUIRIES_EMAIL || "enquiries@awssbg.online";
      const adminRecipient = env.ADMIN_NOTIFICATION_EMAIL || "lethabomabilo33@gmail.com";
      const timestamp = new Date().toUTCString();

      try {
        // A. Send Admin & Enquiries Notification
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AWS SBG Inquiries <enquiries@awssbg.online>",
            to: [enquiriesRecipient, adminRecipient],
            reply_to: email.trim(),
            subject: `[AWS SBG Inquiry] ${category || "General"} from ${name}`,
            html: `
              <div style="font-family: monospace; background: #F4F4F5; padding: 24px; color: #000000;">
                <div style="max-width: 540px; margin: 0 auto; background: #FFFFFF; border: 3px solid #000000; padding: 24px; box-shadow: 4px 4px 0px #000000;">
                  <div style="background: #000000; color: #FFFFFF; padding: 6px 12px; font-weight: 900; font-size: 12px; margin-bottom: 16px;">
                    // NEW_AWS_SBG_INQUIRY
                  </div>
                  <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 16px 0; text-transform: uppercase;">New Contact Submission</h2>
                  <p><strong>Submitter:</strong> ${name}</p>
                  <p><strong>Email:</strong> <a href="mailto:${email}" style="color: #7C3AED; font-weight: bold;">${email}</a></p>
                  <p><strong>Category:</strong> ${category || "General Inquiry"}</p>
                  <p><strong>Timestamp:</strong> ${timestamp}</p>
                  <div style="border-top: 2px solid #000000; margin-top: 16px; padding-top: 16px;">
                    <strong>Message:</strong>
                    <p style="white-space: pre-wrap; background: #F4F4F5; padding: 12px; border: 2px solid #000000; margin-top: 8px;">${message}</p>
                  </div>
                  <div style="margin-top: 20px;">
                    <a href="mailto:${email}?subject=Re:%20AWS%20SBG%20Inquiry%20-%20${encodeURIComponent(category || "")}" style="display: inline-block; background: #7C3AED; color: #FFFFFF; padding: 10px 16px; text-decoration: none; font-weight: bold; border: 2px solid #000000; box-shadow: 2px 2px 0px #000000;">
                      Reply to Sender &rarr;
                    </a>
                  </div>
                </div>
              </div>
            `,
          }),
        });

        // B. Send Receipt Confirmation to Submitter
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "AWS Student Builder Group <enquiries@awssbg.online>",
            to: [email.trim()],
            subject: "We Received Your Message — AWS Student Builder Group",
            html: `
              <div style="font-family: monospace; background: #F4F4F5; padding: 24px; color: #000000;">
                <div style="max-width: 500px; margin: 0 auto; background: #FFFFFF; border: 3px solid #000000; padding: 24px; box-shadow: 4px 4px 0px #000000;">
                  <div style="background: #000000; color: #FFFFFF; padding: 6px 12px; font-weight: 900; font-size: 12px; margin-bottom: 16px;">
                    // AWS_SBG // RECEIPT_CONFIRMATION
                  </div>
                  <h2 style="font-size: 20px; font-weight: 900; margin: 0 0 12px 0; text-transform: uppercase;">We Got Your Message, ${name}</h2>
                  <p style="font-size: 14px; line-height: 1.6;">
                    Thank you for reaching out to the <strong>AWS Student Builder Group (AWS SBG)</strong>. We have successfully logged your inquiry regarding <strong>${category || "General"}</strong>.
                  </p>
                  <p style="font-size: 13px; color: #52525B; line-height: 1.5;">
                    Our student leadership team reviews all incoming inquiries and will respond to this email address shortly.
                  </p>
                  <div style="border-top: 2px dashed #000000; margin-top: 16px; padding-top: 14px; font-size: 11px; color: #71717A;">
                    Official student builder community powered by Amazon Web Services. Zero personal data sale guarantee.
                  </div>
                </div>
              </div>
            `,
          }),
        });
      } catch (emailErr) {
        console.warn("Email dispatch error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Inquiry submitted successfully",
        inquiryId: inquiryData?.id,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Server error processing inquiry", details: (err as Error).message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
