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
        { error: "Service configuration error" },
        { status: 500 },
      );
    }

    const response = await axios.get(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        params: { identifierType: "email_id" },
        headers: {
          accept: "application/json",
          "api-key": apiKey,
        },
      },
    );

    return NextResponse.json(
      {
        isSubscribed: true,
        contactDetails: response.data,
      },
      { status: 200 },
    );
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      // contact not found
      return NextResponse.json(
        {
          isSubscribed: false,
        },
        { status: 200 },
      );
    }

    console.error("Error checking subscription:", error);
    return NextResponse.json(
      {
        error: "Failed to check subscription status",
        details: axios.isAxiosError(error)
          ? error.response?.data?.message || error.message
          : "Unknown error",
      },
      { status: 500 },
    );
  }
}
