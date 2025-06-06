import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { standariseAddress } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { email, address } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
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
        name: "Endur.fi",
        email: senderEmail,
      },
      to: [
        {
          email,
          name: "Endur User",
        },
      ],
      subject: "Welcome to Endur - Stay Updated!",
      replyTo: {
        email: "akira@endur.fi",
        name: "Akira | Endur",
      },
      templateId: 2,
    };

    // send email using Brevo REST API
    const emailResponse = await axios.post(
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

    console.log("Email sent successfully:", emailResponse.data);

    // create contact in Brevo after successful email send
    const contactPayload = {
      attributes: {
        FIRSTNAME: standariseAddress(address), // using FIRSTNAME attribute for address cuz somehow custom attributes are not working
        ADDRESS: standariseAddress(address),
      },
      updateEnabled: false,
      email,
      ext_id: standariseAddress(address), // unique identifier for the contact
      listIds: [5], // Subscribers-Endur list
    };

    try {
      const contactResponse = await axios.post(
        "https://api.brevo.com/v3/contacts",
        contactPayload,
        {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
            "api-key": apiKey,
          },
        },
      );

      console.log("Contact created successfully:", contactResponse.data);

      return NextResponse.json(
        {
          success: true,
          message: "Endur's email subscription activated and contact created",
          messageId: emailResponse.data.messageId,
          contactId: contactResponse.data.id,
        },
        { status: 200 },
      );
    } catch (contactError) {
      console.error("Error creating contact:", contactError);

      // still return success for email, but note contact creation issue
      return NextResponse.json(
        {
          success: true,
          message: "Email sent successfully, but contact creation failed",
          messageId: emailResponse.data.messageId,
          contactError: axios.isAxiosError(contactError)
            ? contactError.response?.data?.message || contactError.message
            : "Unknown contact creation error",
        },
        { status: 200 },
      );
    }
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
