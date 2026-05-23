"use client";

import { createClient, type User } from "@supabase/supabase-js";
import { createTickets, pickAvailableTicket, type Ticket } from "@/lib/tickets";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const TICKET_SYNC_CHANNEL = "lucky-pass-ticket-sync";
const FALLBACK_POLL_MS = 10000;

export type ReservationInput = {
  name: string;
  phone: string;
  email: string;
  paymentSlipName: string;
  paymentSlipDataUrl: string;
};

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

let browserClient:
  | ReturnType<typeof createClient>
  | null = null;
let ticketSyncChannel: BroadcastChannel | null = null;

export function getSupabaseBrowser() {
  if (!supabaseUrl || !supabaseAnonKey) return null;
  if (browserClient) return browserClient;

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return browserClient;
}

export function watchTickets(onTickets: (tickets: Ticket[]) => void) {
  if (!isSupabaseConfigured) {
    onTickets(createTickets(0));
    return () => undefined;
  }

  let cancelled = false;

  const load = async () => {
    try {
      const response = await fetch("/api/tickets", { cache: "no-store" });
      if (!response.ok) return;
      const nextTickets = (await response.json()) as Ticket[];
      if (!cancelled) {
        onTickets(nextTickets);
      }
    } catch {
      if (!cancelled) {
        onTickets(createTickets(0));
      }
    }
  };

  void load();
  const interval = window.setInterval(load, FALLBACK_POLL_MS);
  const channel = getTicketSyncChannel();
  const onSignal = () => void load();
  const onVisible = onVisibilityChange(onSignal);
  channel?.addEventListener("message", onSignal);
  window.addEventListener("focus", onSignal);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    cancelled = true;
    window.clearInterval(interval);
    channel?.removeEventListener("message", onSignal);
    window.removeEventListener("focus", onSignal);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export function watchAdminTickets(
  onTickets: (tickets: Ticket[]) => void,
  onError?: (message: string) => void,
) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    onTickets(createTickets(0));
    return () => undefined;
  }

  let cancelled = false;

  const load = async () => {
    try {
      const token = await getAccessToken();
      if (!token) {
        if (!cancelled) onTickets([]);
        return;
      }

      const response = await fetch("/api/admin/tickets", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;
        throw new Error(body?.error ?? "Could not load admin ticket records.");
      }

      const nextTickets = (await response.json()) as Ticket[];
      if (!cancelled) {
        onTickets(nextTickets);
      }
    } catch (error) {
      if (!cancelled) {
        onError?.(
          error instanceof Error
            ? error.message
            : "Could not load admin ticket records.",
        );
      }
    }
  };

  void load();
  const interval = window.setInterval(load, FALLBACK_POLL_MS);
  const channel = getTicketSyncChannel();
  const onSignal = () => void load();
  const onVisible = onVisibilityChange(onSignal);
  channel?.addEventListener("message", onSignal);
  window.addEventListener("focus", onSignal);
  document.addEventListener("visibilitychange", onVisible);

  return () => {
    cancelled = true;
    window.clearInterval(interval);
    channel?.removeEventListener("message", onSignal);
    window.removeEventListener("focus", onSignal);
    document.removeEventListener("visibilitychange", onVisible);
  };
}

export async function reserveRandomTicket(
  customer: ReservationInput,
  localTickets: Ticket[],
) {
  const picked = pickAvailableTicket(localTickets);
  return reserveSpecificTicket(customer, picked?.id, localTickets);
}

export async function reserveSpecificTicket(
  customer: ReservationInput,
  ticketId: string | undefined,
  localTickets: Ticket[],
) {
  if (ticketId) {
    const normalizedTicketId = ticketId.trim().toUpperCase();
    const candidate = localTickets.find(
      (ticket) => ticket.id === normalizedTicketId,
    );

    if (!candidate || candidate.status !== "available") {
      return null;
    }
  }

  const response = await fetch("/api/tickets/reserve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticketId,
      customer,
    }),
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string; details?: string }
      | null;
    throw new Error(
      body?.details
        ? `${body.error ?? "Could not reserve the Lucky Pass."} ${body.details}`
        : (body?.error ?? "Could not reserve the Lucky Pass."),
    );
  }

  const reservedTicket = (await response.json()) as Ticket | null;
  if (reservedTicket) {
    notifyTicketChange();
  }

  return reservedTicket;
}

export async function verifyReservedTicket(ticket: Ticket) {
  const token = await getRequiredAccessToken();
  await runAdminAction("verify", token, { ticketId: ticket.id });
  notifyTicketChange();

  if (ticket.email) {
    await fetch("/api/send-ticket-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: ticket.email,
        name: ticket.ownerName,
        ticketId: ticket.id,
      }),
    }).catch(() => undefined);
  }
}

export async function releaseSoldTicket(ticketId: string) {
  const token = await getRequiredAccessToken();
  await runAdminAction("release", token, { ticketId });
  notifyTicketChange();
}

export async function rejectReservedTicket(ticketId: string) {
  const token = await getRequiredAccessToken();
  await runAdminAction("reject", token, { ticketId });
  notifyTicketChange();
}

export async function releaseIncompleteReservations(tickets: Ticket[]) {
  const token = await getRequiredAccessToken();
  await runAdminAction("release-incomplete", token, {
    ticketIds: tickets
      .filter(
        (ticket) =>
          ticket.status === "reserved" &&
          (!(ticket.paymentSlipUrl || ticket.paymentSlipDataUrl) ||
            !ticket.ownerName),
      )
      .map((ticket) => ticket.id),
  });
  notifyTicketChange();
}

export async function adminSignIn(email: string, password: string) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    throw new Error("Supabase is not configured.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    if (error.status === 429) {
      throw new Error(
        "Too many sign-in attempts. Wait a few seconds and try again.",
      );
    }
    throw error;
  }

  await assertAdminSession();
}

export async function adminSignOut() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return;
  await supabase.auth.signOut();
}

export function watchAdmin(onUser: (user: User | null) => void) {
  const supabase = getSupabaseBrowser();
  if (!supabase) {
    onUser(null);
    return () => undefined;
  }

  void supabase.auth.getSession().then(({ data }) => {
    onUser(data.session?.user ?? null);
  });
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((_event, session) => {
    onUser(session?.user ?? null);
  });

  return () => subscription.unsubscribe();
}

async function assertAdminSession() {
  const token = await getRequiredAccessToken();
  const response = await fetch("/api/admin/tickets", {
    cache: "no-store",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (response.ok) return;

  const body = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  const message = body?.error ?? "This account cannot access the admin panel.";

  if (
    message.toLowerCase().includes("rate limit") ||
    response.status === 429
  ) {
    throw new Error(message);
  }

  await adminSignOut();
  throw new Error(message);
}

async function getAccessToken() {
  const supabase = getSupabaseBrowser();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

async function getRequiredAccessToken() {
  const token = await getAccessToken();
  if (!token) {
    throw new Error("Admin session expired. Sign in again.");
  }
  return token;
}

async function runAdminAction(
  action: string,
  token: string,
  body: Record<string, unknown>,
) {
  const response = await fetch("/api/admin/tickets/action", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ action, ...body }),
  });

  if (response.ok) return;

  const data = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;
  throw new Error(data?.error ?? "Admin action failed.");
}

function getTicketSyncChannel() {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return null;
  }

  if (!ticketSyncChannel) {
    ticketSyncChannel = new BroadcastChannel(TICKET_SYNC_CHANNEL);
  }

  return ticketSyncChannel;
}

function notifyTicketChange() {
  getTicketSyncChannel()?.postMessage({ type: "tickets-changed" });
}

function onVisibilityChange(callback: () => void) {
  return () => {
    if (document.visibilityState === "visible") {
      callback();
    }
  };
}
