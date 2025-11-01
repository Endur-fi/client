import { CHECK_EMAIL_EXISTS } from "@/constants/queries";
import apolloClient from "@/lib/apollo-client";
import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

import { standariseAddress } from "@/lib/utils";

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

    // Search for contacts with the standardized address in LASTNAME field
    const standardizedAddress = standariseAddress(address);

    const response = await axios.get("https://api.brevo.com/v3/contacts", {
      params: {
        limit: 50,
        offset: 0,
        sort: "desc",
        modifiedSince: "2020-01-01T00:00:00.000Z",
      },
      headers: {
        accept: "application/json",
        "api-key": apiKey,
      },
    });

    // Filter contacts that have the standardized address in LASTNAME
    const matchingContacts = response.data.contacts?.filter(
      (contact: any) => contact.attributes?.LASTNAME === standardizedAddress,
    );

    if (matchingContacts && matchingContacts.length > 0) {
      return NextResponse.json(
        {
          isSubscribed: true,
          contactDetails: matchingContacts[0], // Return the first matching contact
          totalMatches: matchingContacts.length,
        },
        { status: 200 },
      );
    }

    return NextResponse.json(
      {
        isSubscribed: false,
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
