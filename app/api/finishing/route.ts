import { NextResponse } from 'next/server';

// LINK: "Lamination / Binding" Sheet (gid=629450674), published from Mr Manek's google spreadsheet
const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRGXGCnHiV7abgPw8OpTNGVev5i3ix6eOUCS37fIB6W4xQXIkUcZpNk2-gGAY3uhPx6KGdcmM1RbvwD/pub?gid=629450674&single=true&output=csv";

export async function GET() {
  try {
    const timestamp = Date.now();
    const response = await fetch(`${SHEET_URL}&t=${timestamp}`, { cache: 'no-store' });
    
    if (!response.ok) throw new Error(`Failed to fetch sheet: ${response.statusText}`);
    const csvText = await response.text();
    
    return new NextResponse(csvText, {
      status: 200,
      headers: { 'Content-Type': 'text/csv', 'Cache-Control': 'no-store, max-age=0' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch finishing data' }, { status: 500 });
  }
}