import { createClient } from "@supabase/supabase-js";
import { createTickets, type PaymentStatus, type Ticket, type TicketStatus } from "@/lib/tickets";

type TicketRow = {
  id: string;
  number: number;
  status: TicketStatus;
  payment_status: PaymentStatus;
  owner_name: string | null;
  phone: string | null;
  email: string | null;
  payment_slip_name: string | null;
  payment_slip_url: string | null;
  payment_slip_path: string | null;
  reserved_at: string | null;
  verified_at: string | null;
  purchased_at: string | null;
  created_at?: string;
  updated_at?: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "payment-slips";
const ADMIN_CACHE_TTL_MS = 5 * 60 * 1000;
const adminEmails = new Set(
  (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
);
const adminSessionCache = new Map<
  string,
  { email: string; expiresAt: number }
>();

export const isSupabaseServerConfigured = Boolean(
  supabaseUrl && supabaseServiceRoleKey,
);

export function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error(
      "Supabase server environment variables are not configured.",
    );
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function getStorageBucketName() {
  return storageBucket;
}

export async function ensureTicketsExist() {
  const supabase = getSupabaseAdmin();
  const { count, error } = await supabase
    .from("tickets")
    .select("id", { count: "exact", head: true });

  if (error) {
    throw new Error(error.message);
  }

  if ((count ?? 0) >= createTickets(0).length) return;

  const { data: existingRows, error: existingError } = await supabase
    .from("tickets")
    .select("id");

  if (existingError) {
    throw new Error(existingError.message);
  }

  const existingIds = new Set((existingRows ?? []).map((row) => row.id));
  const missingRows = createTickets(0)
    .filter((ticket) => !existingIds.has(ticket.id))
    .map((ticket) => toTicketInsert(ticket));

  if (!missingRows.length) return;

  const { error: insertError } = await supabase
    .from("tickets")
    .insert(missingRows);

  if (insertError) {
    throw new Error(insertError.message);
  }
}

export async function ensureStorageBucket() {
  const supabase = getSupabaseAdmin();
  const bucketName = getStorageBucketName();
  const { data: bucket, error } = await supabase.storage.getBucket(bucketName);

  if (!error && bucket) return;

  const { error: createError } = await supabase.storage.createBucket(
    bucketName,
    {
      public: true,
      fileSizeLimit: 2 * 1024 * 1024,
      allowedMimeTypes: ["image/*"],
    },
  );

  if (createError && !createError.message.toLowerCase().includes("already")) {
    throw new Error(createError.message);
  }
}

export async function requireAdminUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length)
    : "";

  if (!token) {
    throw new Error("Missing admin session.");
  }

  const cached = adminSessionCache.get(token);
  if (cached && cached.expiresAt > Date.now()) {
    if (!adminEmails.has(cached.email)) {
      throw new Error("This account is not allowed to access the admin panel.");
    }

    return { email: cached.email };
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error?.status === 429) {
    throw new Error(
      "Supabase Auth rate limit reached. Wait a few seconds and try again.",
    );
  }

  if (error || !data.user?.email) {
    throw new Error("Invalid admin session.");
  }

  if (!adminEmails.has(data.user.email.toLowerCase())) {
    throw new Error("This account is not allowed to access the admin panel.");
  }

  adminSessionCache.set(token, {
    email: data.user.email.toLowerCase(),
    expiresAt: Date.now() + ADMIN_CACHE_TTL_MS,
  });

  return data.user;
}

export function toPublicTicket(ticket: Pick<TicketRow, "id" | "number" | "status" | "payment_status">): Ticket {
  return {
    id: ticket.id,
    number: ticket.number,
    status: ticket.status,
    paymentStatus: ticket.payment_status,
  };
}

export function toTicket(row: TicketRow): Ticket {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    paymentStatus: row.payment_status,
    ownerName: row.owner_name ?? undefined,
    phone: row.phone ?? undefined,
    email: row.email ?? undefined,
    paymentSlipName: row.payment_slip_name ?? undefined,
    paymentSlipUrl: row.payment_slip_url ?? undefined,
    paymentSlipPath: row.payment_slip_path ?? undefined,
    reservedAt: row.reserved_at ?? undefined,
    verifiedAt: row.verified_at ?? undefined,
    purchasedAt: row.purchased_at ?? undefined,
  };
}

export function toTicketInsert(ticket: Ticket) {
  return {
    id: ticket.id,
    number: ticket.number,
    status: ticket.status,
    payment_status: ticket.paymentStatus ?? "none",
    owner_name: ticket.ownerName ?? null,
    phone: ticket.phone ?? null,
    email: ticket.email ?? null,
    payment_slip_name: ticket.paymentSlipName ?? null,
    payment_slip_url: ticket.paymentSlipUrl ?? null,
    payment_slip_path: ticket.paymentSlipPath ?? null,
    reserved_at: ticket.reservedAt ?? null,
    verified_at: ticket.verifiedAt ?? null,
    purchased_at: ticket.purchasedAt ?? null,
  };
}
