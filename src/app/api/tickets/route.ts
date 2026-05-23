import { NextResponse } from "next/server";
import {
  ensureTicketsExist,
  getSupabaseAdmin,
  toPublicTicket,
} from "@/lib/supabase-admin";

export async function GET() {
  try {
    await ensureTicketsExist();
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tickets")
      .select("id, number, status, payment_status")
      .order("number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json((data ?? []).map(toPublicTicket));
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not load ticket records.",
      },
      { status: 500 },
    );
  }
}
