"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import {
  Banknote,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  TicketCheck,
  XCircle,
} from "lucide-react";
import {
  adminSignIn,
  adminSignOut,
  releaseSoldTicket,
  rejectReservedTicket,
  releaseIncompleteReservations,
  verifyReservedTicket,
  watchAdmin,
} from "@/lib/supabase";
import { useAdminTickets } from "@/hooks/useAdminTickets";
import { TICKET_PRICE, type Ticket } from "@/lib/tickets";

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [authError, setAuthError] = useState("");
  const [authBusy, setAuthBusy] = useState(false);
  const { tickets, stats, loading, error } = useAdminTickets(Boolean(user));

  useEffect(() => watchAdmin(setUser), []);

  const reserved = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status === "reserved" &&
          ticket.paymentStatus === "pending" &&
          Boolean(ticket.paymentSlipUrl || ticket.paymentSlipDataUrl),
      ),
    [tickets],
  );
  const incompleteReserved = useMemo(
    () =>
      tickets.filter(
        (ticket) =>
          ticket.status === "reserved" &&
          (!(ticket.paymentSlipUrl || ticket.paymentSlipDataUrl) ||
            !ticket.ownerName),
      ),
    [tickets],
  );
  const sold = useMemo(
    () => tickets.filter((ticket) => ticket.status === "sold"),
    [tickets],
  );

  async function login(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    try {
      await adminSignIn(credentials.email, credentials.password);
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("auth/invalid-credential") ||
          error.message.toLowerCase().includes("invalid login credentials"))
      ) {
        setAuthError(
          "Invalid admin email or password. Check that Email sign-in is enabled in Supabase Auth and that this admin account exists there.",
        );
        setAuthBusy(false);
        return;
      }

      setAuthError(
        error instanceof Error ? error.message : "Admin sign in failed.",
      );
      setAuthBusy(false);
      return;
    }
    setAuthBusy(false);
  }

  return (
    <main className="arcade-page admin-page">
      <section className="admin-hero">
        <a className="admin-back" href="/">
          Lucky Pass public site
        </a>
        <div className="section-title">
          <span>
            <ShieldCheck size={20} />
            operator
          </span>
          <h1>Admin Control Room</h1>
        </div>
        <div className="operator-panel">
          <Stat label="Pending Slips" value={reserved.length} />
          <Stat label="Sold" value={stats.sold} />
          <Stat label="Available" value={stats.available} />
          <Stat
            label="Verified Value"
            value={`Rs. ${stats.sold * TICKET_PRICE}`}
          />
        </div>
      </section>

      {!user ? (
        <section className="admin-login">
          <form onSubmit={login} className="coin-slot">
            <div className="slot-mouth">
              <ShieldCheck size={28} />
              <span>Admin authentication</span>
            </div>
            <input
              required
              type="email"
              placeholder="Admin email"
              value={credentials.email}
              onChange={(event) =>
                setCredentials({ ...credentials, email: event.target.value })
              }
            />
            <input
              required
              type="password"
              placeholder="Password"
              value={credentials.password}
              onChange={(event) =>
                setCredentials({ ...credentials, password: event.target.value })
              }
            />
            <button className="metal-switch" type="submit" disabled={authBusy}>
              {authBusy ? "Signing In..." : "Enter Control Room"}
            </button>
            {authError && <p className="form-error">{authError}</p>}
          </form>
        </section>
      ) : (
        <section className="admin-workbench">
          <div className="admin-actions">
            {incompleteReserved.length > 0 && (
              <button
                className="metal-switch"
                onClick={() => releaseIncompleteReservations(tickets)}
              >
                <XCircle size={18} />
                Clear Incomplete Reservations
              </button>
            )}
            <button className="metal-switch" onClick={() => adminSignOut()}>
              <LogOut size={18} />
              Sign Out
            </button>
          </div>
          {(authError || error) && <p className="form-error">{authError || error}</p>}

          <div className="admin-columns">
            <div>
              <h2>Pending Payment Slips</h2>
              {loading && <p className="admin-muted">Loading records...</p>}
              {!loading && reserved.length === 0 && (
                <p className="admin-muted">
                  No reserved tickets waiting for verification.
                </p>
              )}
              <div className="reservation-list">
                {reserved.map((ticket) => (
                  <ReservationCard key={ticket.id} ticket={ticket} />
                ))}
              </div>
              {incompleteReserved.length > 0 && (
                <div className="cleanup-note">
                  {incompleteReserved.length} incomplete reserved ticket records
                  have no buyer slip and are hidden from verification.
                </div>
              )}
            </div>

            <div>
              <h2>Verified Buyers</h2>
              <div className="verified-list">
                {sold
                  .slice()
                  .reverse()
                  .map((ticket) => (
                    <BuyerRow key={ticket.id} ticket={ticket} />
                  ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-puck">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function ReservationCard({ ticket }: { ticket: Ticket }) {
  const [busy, setBusy] = useState(false);

  async function verify() {
    setBusy(true);
    await verifyReservedTicket(ticket);
    setBusy(false);
  }

  async function reject() {
    setBusy(true);
    await rejectReservedTicket(ticket.id);
    setBusy(false);
  }

  return (
    <article className="reservation-card">
      <div className="reservation-top">
        <strong>{ticket.id}</strong>
        <span>{ticket.paymentStatus ?? "pending"}</span>
      </div>
      <dl className="buyer-details">
        <div>
          <dt>Name</dt>
          <dd>{ticket.ownerName || "Not provided"}</dd>
        </div>
        <div>
          <dt>Phone</dt>
          <dd>{ticket.phone || "Not provided"}</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd>{ticket.email || "Not provided"}</dd>
        </div>
        <div>
          <dt>Amount</dt>
          <dd>Rs. {TICKET_PRICE}</dd>
        </div>
      </dl>
      {ticket.paymentSlipUrl || ticket.paymentSlipDataUrl ? (
        <a
          className="slip-preview"
          href={ticket.paymentSlipUrl || ticket.paymentSlipDataUrl}
          target="_blank"
          rel="noreferrer"
        >
          <img
            src={ticket.paymentSlipUrl || ticket.paymentSlipDataUrl}
            alt={`Payment slip for ${ticket.id}`}
          />
          <span>
            <Banknote size={16} />
            {ticket.paymentSlipName || "Payment slip"}
          </span>
        </a>
      ) : (
        <div className="missing-slip">No slip attached</div>
      )}
      <div className="reservation-actions">
        <button className="verify-button" disabled={busy} onClick={verify}>
          <CheckCircle2 size={18} />
          Verify as Sold
        </button>
        <button className="reject-button" disabled={busy} onClick={reject}>
          <XCircle size={18} />
          Reject
        </button>
      </div>
    </article>
  );
}

function BuyerRow({ ticket }: { ticket: Ticket }) {
  const [busy, setBusy] = useState(false);

  async function makeAvailable() {
    setBusy(true);
    await releaseSoldTicket(ticket.id);
    setBusy(false);
  }

  return (
    <div className="buyer-row">
      <TicketCheck size={18} />
      <strong>{ticket.id}</strong>
      <span>{ticket.ownerName || "Buyer"}</span>
      <a href={`tel:${ticket.phone}`}>{ticket.phone || "No phone"}</a>
      <a href={`mailto:${ticket.email}`}>{ticket.email || "No email"}</a>
      {ticket.paymentSlipUrl ? (
        <a
          className="buyer-slip-link"
          href={ticket.paymentSlipUrl}
          target="_blank"
          rel="noreferrer"
        >
          Receipt
        </a>
      ) : (
        <span className="buyer-slip-link missing">No receipt</span>
      )}
      <button
        className="release-button"
        disabled={busy}
        onClick={makeAvailable}
      >
        {busy ? "Releasing..." : "Make Available"}
      </button>
    </div>
  );
}
