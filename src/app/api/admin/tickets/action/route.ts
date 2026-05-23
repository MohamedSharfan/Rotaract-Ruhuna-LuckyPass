import { NextResponse } from "next/server";
import {
  getSupabaseAdmin,
  requireAdminUser,
} from "@/lib/supabase-admin";

export async function POST(request: Request) {
  try {
    await requireAdminUser(request);
    const { action, ticketId, ticketIds } = (await request.json()) as {
      action?: string;
      ticketId?: string;
      ticketIds?: string[];
    };

    const supabase = getSupabaseAdmin();

    if (action === "verify") {
      if (!ticketId) {
        return NextResponse.json({ error: "Missing ticket ID." }, { status: 400 });
      }

      const now = new Date().toISOString();
      const { error } = await supabase
        .from("tickets")
        .update({
          status: "sold",
          payment_status: "verified",
          verified_at: now,
          purchased_at: now,
        })
        .eq("id", ticketId);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "reject") {
      if (!ticketId) {
        return NextResponse.json({ error: "Missing ticket ID." }, { status: 400 });
      }

      const { error } = await supabase
        .from("tickets")
        .update(emptyReservation("none"))
        .eq("id", ticketId);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "release") {
      if (!ticketId) {
        return NextResponse.json({ error: "Missing ticket ID." }, { status: 400 });
      }

      const { error } = await supabase
        .from("tickets")
        .update(emptyReservation("none"))
        .eq("id", ticketId);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    if (action === "release-incomplete") {
      if (!ticketIds?.length) {
        return NextResponse.json({ ok: true });
      }

      const { error } = await supabase
        .from("tickets")
        .update(emptyReservation("none"))
        .in("id", ticketIds);

      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Unknown admin action." }, { status: 400 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Admin action failed.";
    const status =
      message.includes("admin") || message.includes("session") ? 403 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

function emptyReservation(paymentStatus: "none" | "rejected") {
  return {
    status: "available",
    payment_status: paymentStatus,
    owner_name: null,
    phone: null,
    email: null,
    payment_slip_name: null,
    payment_slip_url: null,
    payment_slip_path: null,
    reserved_at: null,
    verified_at: null,
    purchased_at: null,
  };
}
