import { CHECK_EMAIL_EXISTS } from "@/constants/queries";
import apolloClient from "@/lib/apollo-client";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { address } = await request.json();

    if (!address) {
      return NextResponse.json(
        { error: "address is required" },
        { status: 400 },
      );
    }

    // check if email is stored in the database
    const res = await apolloClient.query({
      query: CHECK_EMAIL_EXISTS,
      variables: { userAddress: address },
    });

    console.log("Email check response:", res.data);
    if (res.data.hasEmailSaved) {
      return NextResponse.json(
        { isSubscribed: true, message: "Email already exists" },
        { status: 200 },
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
      `https://api.brevo.com/v3/contacts/${address}`,
      {
        params: { identifierType: "ext_id" },
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
