import { NextRequest, NextResponse } from 'next/server';
import { getNativeTokenBalances, getAllLstTokenBalances } from "@/lib/portfolio";

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const searchParams = request.nextUrl.searchParams;
    const lstToken = searchParams.get('lstToken') || 'XSTRK';

    // Validate address
    if (!address) {
      return NextResponse.json(
        { error: 'Address is required' },
        { status: 400 }
      );
    }

    // Fetch both LST portfolio data and native token balances in parallel
    const [portfolioData, nativeBalances] = await Promise.all([
      getAllLstTokenBalances(address),
      getNativeTokenBalances(address),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        ...portfolioData,
        nativeBalances,
      },
    });
  } catch (error) {
    console.error('Error fetching portfolio balance:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch portfolio balance',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

