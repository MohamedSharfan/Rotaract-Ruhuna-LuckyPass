import { NextResponse } from "next/server";
import {
  ensureTicketsExist,
  getSupabaseAdmin,
  requireAdminUser,
  toTicket,
} from "@/lib/supabase-admin";

export async function GET(request: Request) {
  try {
    await requireAdminUser(request);
    await ensureTicketsExist();

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("number", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json((data ?? []).map(toTicket));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not load admin records.";
    const status =
      message.includes("admin") || message.includes("session") ? 403 : 500;

    return NextResponse.json({ error: message }, { status });
  }
}
