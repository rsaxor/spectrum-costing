import { NextResponse } from 'next/server';

// CORRECT LINK: Points specifically to "A5 & A4 & A3" (gid=2036168550), published from Mr Manek's google spreadsheet
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXGCnHiV7abgPw8OpTNGVev5i3ix6eOUCS37fIB6W4xQXIkUcZpNk2-gGAY3uhPx6KGdcmM1RbvwD/pub?gid=2036168550&single=true&output=csv";

export async function GET() {
  try {
    const timestamp = Date.now();
    const response = await fetch(`${SHEET_URL}&t=${timestamp}`, { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    }

    const csvText = await response.text();
    
    // Debug: This should now show ",,,,,,,A4 size" in termial
    console.log("Fetched CSV Start:", csvText.substring(0, 50));

    return new NextResponse(csvText, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}