import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!secret) {
    return NextResponse.json(
      { success: false, error: "Server configuration error." },
      { status: 500 }
    );
  }

  const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
  const formData = new FormData();
  formData.append("secret", secret);
  formData.append("response", token);
  
  try {
    const response = await fetch(url, { method: "POST", body: formData });
    const data = await response.json();

    if (data.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid CAPTCHA." },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Internal server error." },
      { status: 500 }
    );
  }
}