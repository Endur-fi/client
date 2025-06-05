import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 },
      );
    }

    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error("BREVO_API_KEY not found in environment variables");
      return NextResponse.json(
        { error: "Email service configuration error" },
        { status: 500 },
      );
    }

    const senderEmail = process.env.BREVO_SENDER_EMAIL || "noreply@endur.fi";

    const emailPayload = {
      sender: {
        name: "Endur Team",
        email: senderEmail,
      },
      to: [
        {
          email,
          name: "Endur User",
        },
      ],
      subject: "Welcome to Endur - Stay Updated!",
      // htmlContent: `
      //   <!DOCTYPE html>
      //   <html>
      //   <head>
      //     <style>
      //       body {
      //         font-family: Arial, sans-serif;
      //         line-height: 1.6;
      //         color: #333;
      //         margin: 0;
      //         padding: 0;
      //       }
      //       .container {
      //         max-width: 600px;
      //         margin: 0 auto;
      //         background-color: #ffffff;
      //       }
      //       .header {
      //         background-color: #0C4E3F;
      //         color: white;
      //         padding: 30px 20px;
      //         text-align: center;
      //       }
      //       .content {
      //         padding: 30px 20px;
      //         background-color: #f9f9f9;
      //       }
      //       .footer {
      //         padding: 20px;
      //         text-align: center;
      //         font-size: 12px;
      //         color: #666;
      //         background-color: #ffffff;
      //       }
      //       h1 { margin: 0; font-size: 24px; }
      //       h2 { color: #0C4E3F; margin-top: 0; }
      //       ul { padding-left: 20px; }
      //       li { margin-bottom: 8px; }
      //     </style>
      //   </head>
      //   <body>
      //     <div class="container">
      //       <div class="header">
      //         <h1>Welcome to Endur!</h1>
      //       </div>
      //       <div class="content">
      //         <h2>Thank you for staying updated with us!</h2>
      //         <p>You'll be the first to know about:</p>
      //         <ul>
      //           <li>When claims open</li>
      //           <li>New product updates</li>
      //           <li>Upcoming programs</li>
      //         </ul>
      //         <p>We respect your privacy and will never share your data with third parties.</p>
      //       </div>
      //       <div class="footer">
      //         <p>You can unsubscribe at any time by replying to this email.</p>
      //       </div>
      //     </div>
      //   </body>
      //   </html>
      // `,
      replyTo: {
        email: senderEmail,
        name: "Endur Team",
      },
      templateId: 2,
    };

    // send email using Brevo REST API
    const response = await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      emailPayload,
      {
        headers: {
          "X-Campaign": "eligibility-signup",
          "X-Source": "eligibility-modal",
          "Content-Type": "application/json",
          "api-key": apiKey,
        },
      },
    );

    console.log("Email sent successfully:", response.data);
    return NextResponse.json(
      {
        success: true,
        message: "Endur's email subscription activated",
        messageId: response.data.messageId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error sending email:", error);

    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message || error.message;
      const statusCode = error.response?.status || 500;

      console.error("Brevo API error:", error.response?.data);

      return NextResponse.json(
        {
          error: "Failed to send email",
          details: errorMessage,
        },
        { status: statusCode },
      );
    }

    return NextResponse.json(
      {
        error: "Failed to send email",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
