import { NextResponse } from "next/server";
import {
  ensureStorageBucket,
  ensureTicketsExist,
  getStorageBucketName,
  getSupabaseAdmin,
  toTicket,
} from "@/lib/supabase-admin";
import { isGmailAddress } from "@/lib/gmail-email";
import { formatTicketId, TICKET_COUNT, type Ticket } from "@/lib/tickets";

const MAX_SLIP_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const { ticketId, customer } = (await request.json()) as {
      ticketId?: string;
      customer?: {
        name?: string;
        phone?: string;
        email?: string;
        paymentSlipName?: string;
        paymentSlipDataUrl?: string;
      };
    };

    if (
      !customer?.name ||
      !customer.phone ||
      !customer.paymentSlipName ||
      !customer.paymentSlipDataUrl
    ) {
      return NextResponse.json(
        { error: "Missing buyer details or payment slip." },
        { status: 400 },
      );
    }

    const email = customer.email?.trim().toLowerCase();
    if (!email || !isGmailAddress(email)) {
      return NextResponse.json(
        { error: "Please use a Gmail address for ticket confirmation." },
        { status: 400 },
      );
    }

    const parsed = parseDataUrl(customer.paymentSlipDataUrl);
    if (!parsed || !parsed.contentType.startsWith("image/")) {
      return NextResponse.json(
        { error: "Payment slip must be a valid image." },
        { status: 400 },
      );
    }

    if (parsed.buffer.byteLength > MAX_SLIP_BYTES) {
      return NextResponse.json(
        { error: "Payment slip image must be below 2 MB." },
        { status: 400 },
      );
    }

    await ensureTicketsExist();
    await ensureStorageBucket();

    const supabase = getSupabaseAdmin();
    const normalizedTicketId = parseTicketId(ticketId);

    if (ticketId && !normalizedTicketId) {
      return NextResponse.json(
        { error: "Choose an LP number from LP1 to LP1000." },
        { status: 400 },
      );
    }

    const targetTicketId = normalizedTicketId || (await pickAvailableTicketId());

    if (!targetTicketId) {
      return NextResponse.json(null);
    }

    const safeFileName = customer.paymentSlipName
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .slice(0, 80);
    const path = `payment-slips/${targetTicketId}/${Date.now()}-${safeFileName}`;
    const bucket = getStorageBucketName();

    const uploadResult = await supabase.storage.from(bucket).upload(
      path,
      new Uint8Array(parsed.buffer),
      {
        contentType: parsed.contentType,
        upsert: false,
      },
    );

    if (uploadResult.error) {
      return NextResponse.json(
        {
          error: "Could not upload the payment slip.",
          details: uploadResult.error.message,
        },
        { status: 502 },
      );
    }

    const slipUrl = supabase.storage.from(bucket).getPublicUrl(path).data
      .publicUrl;
    const now = new Date().toISOString();
    const updatePayload = {
      status: "reserved",
      payment_status: "pending",
      owner_name: customer.name,
      phone: customer.phone,
      email,
      payment_slip_name: customer.paymentSlipName,
      payment_slip_url: slipUrl,
      payment_slip_path: path,
      reserved_at: now,
      verified_at: null,
      purchased_at: null,
    } satisfies Record<string, unknown>;

    const { data, error } = await supabase
      .from("tickets")
      .update(updatePayload)
      .eq("id", targetTicketId)
      .eq("status", "available")
      .select("*")
      .maybeSingle();

    if (error) {
      await supabase.storage.from(bucket).remove([path]).catch(() => undefined);
      throw new Error(error.message);
    }

    if (!data) {
      await supabase.storage.from(bucket).remove([path]).catch(() => undefined);
      return NextResponse.json(null);
    }

    return NextResponse.json(toTicket(data));
  } catch (error) {
    return NextResponse.json(
      {
        error: "Could not reserve the Lucky Pass.",
        details:
          error instanceof Error
            ? error.message
            : "Unknown reservation error.",
      },
      { status: 500 },
    );
  }
}

async function pickAvailableTicketId() {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("tickets")
    .select("id")
    .eq("status", "available")
    .order("number", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return data?.id ?? null;
}

function parseTicketId(ticketId?: string) {
  if (!ticketId) return null;

  const digits = ticketId.trim().toUpperCase().replace(/[^0-9]/g, "");
  if (!digits) return null;

  const number = Number(digits);
  if (!Number.isInteger(number) || number < 1 || number > TICKET_COUNT) {
    return null;
  }

  return formatTicketId(number);
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;,]+);base64,(.+)$/);
  if (!match) return null;

  return {
    contentType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}
