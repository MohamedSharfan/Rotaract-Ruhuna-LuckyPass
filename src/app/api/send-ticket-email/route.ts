import { NextResponse } from "next/server";
import { sendLuckyPassVerificationEmail } from "@/lib/gmail-email";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { email, name, ticketId } = (await request.json()) as {
    email?: string;
    name?: string;
    ticketId?: string;
  };

  if (!email || !ticketId) {
    return NextResponse.json({ ok: false, error: "Missing email or ticket ID." }, { status: 400 });
  }

  const result = await sendLuckyPassVerificationEmail({
    to: email,
    name,
    ticketId,
  });

  return NextResponse.json({ ok: true, ...result });
}
