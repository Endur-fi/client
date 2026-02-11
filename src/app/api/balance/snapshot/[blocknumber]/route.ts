import { NextRequest, NextResponse } from 'next/server';
import { getAllLstPoints } from '@/lib/portfolio';

export async function GET(
  request: NextRequest,
  { params }: { params: { blocknumber: string } }
) {
  try {
    const blockNumberParam = params.blocknumber.toLowerCase();

    // Handle "latest" case
    if (blockNumberParam === 'latest') {
      const pointsData = await getAllLstPoints('latest');
      return NextResponse.json({
        success: true,
        data: pointsData,
      });
    }

    // Parse block number
    const blockNumber = parseInt(blockNumberParam, 10);

    // Validate block number
    if (isNaN(blockNumber) || blockNumber <= 0) {
      return NextResponse.json(
        { error: 'Invalid block number. Must be a positive integer or "latest"' },
        { status: 400 }
      );
    }

    // Fetch points for all LST tokens
    const pointsData = await getAllLstPoints(blockNumber);

    return NextResponse.json({
      success: true,
      data: pointsData,
    });
  } catch (error) {
    console.error('Error fetching portfolio points:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch portfolio points',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

