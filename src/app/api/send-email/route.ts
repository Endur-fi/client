import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { standariseAddress } from "@/lib/utils";
import apolloClient from "@/lib/apollo-client";
import { SAVE_USER_EMAIL } from "@/constants/mutations";

export async function POST(request: NextRequest) {
  try {
    const { email, address, listIDs } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    if (!address) {
      return NextResponse.json(
        { error: "Address is required" },
        { status: 400 },
      );
    }

    if (!listIDs) {
      return NextResponse.json(
        { error: "List Ids is required" },
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
    // Use a composite identifier to allow same email with different addresses
    const standardizedAddress = standariseAddress(address);
    const compositeEmail = `${email.split("@")[0]}+${standardizedAddress.slice(-8)}@${email.split("@")[1]}`;

    const contactPayload = {
      attributes: {
        FIRSTNAME: email, // store original email in FIRSTNAME
        LASTNAME: standardizedAddress, // store address in LASTNAME since custom attributes don't work
      },
      updateEnabled: true, // Allow updating existing contacts
      email: compositeEmail, // use composite email to allow duplicates
      ext_id: `${email}_${standardizedAddress}`, // unique identifier combining email and address
      // TODO: change the list id later
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
    } catch (contactError) {
      console.error("Error creating contact:", contactError);
    }

    // save in our db
    const resp = await apolloClient.mutate({
      mutation: SAVE_USER_EMAIL,
      variables: {
        input: {
          userAddress: standariseAddress(address),
          email,
        },
      },
    });
    console.log("Email saved in database:", resp.data);
    if (!resp.data.saveEmail.success) {
      return NextResponse.json(
        { error: "Failed to save email in database" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Endur's email subscription activated and contact created",
        messageId: emailResponse.data.messageId,
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
