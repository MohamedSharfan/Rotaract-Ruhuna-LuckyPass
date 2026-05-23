"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  Banknote,
  Coins,
  Crown,
  Gamepad2,
  KeyRound,
  ReceiptText,
  Search,
  ShieldCheck,
  Sparkles,
  Ticket as TicketIcon,
  Trophy,
  Upload,
} from "lucide-react";
import { GameWorld3D } from "@/components/GameWorld3D";
import { ConfettiBurst } from "@/components/Confetti";
import type { ReservationInput } from "@/lib/supabase";
import { emitSoundEvent } from "@/lib/sound-events";
import { TICKET_PRICE, type Ticket, type TicketStatus } from "@/lib/tickets";
import { useTickets } from "@/hooks/useTickets";
import rotaractLogo from "@/resources/RACRUH Logo Cranberry-1.png";

type MachineMode = "lobby" | "reveal";

function normalizeTicketId(value: string) {
  return value.toUpperCase().replace(/\s+/g, "").slice(0, 5);
}

export default function Home() {
  const { tickets, stats, loading, reserve } = useTickets();
  const [mode, setMode] = useState<MachineMode>("lobby");
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState("LP322");
  const [confetti, setConfetti] = useState(false);

  useEffect(() => {
    if (!ticket) return;
    const latest = tickets.find((item) => item.id === ticket.id);
    if (
      latest &&
      (latest.status !== ticket.status ||
        latest.paymentStatus !== ticket.paymentStatus)
    ) {
      setTicket(latest);
    }
  }, [tickets, ticket]);

  const selectedTicket = useMemo(
    () =>
      tickets.find((item) => item.id === normalizeTicketId(selectedTicketId)),
    [tickets, selectedTicketId],
  );

  async function handleTicketPurchase(
    customer: ReservationInput,
    desiredTicketId?: string,
  ) {
    setMode("reveal");
    emitSoundEvent("coin-drop");
    await wait(700);
    emitSoundEvent("ticket-spin");
    await wait(900);
    const requestedTicketId = normalizeTicketId(
      desiredTicketId || selectedTicketId,
    );
    const purchased = await reserve(customer, requestedTicketId);
    if (!purchased) return null;
    setTicket(purchased);
    emitSoundEvent("ticket-reveal", {
      ticket: purchased.id,
      status: "reserved",
    });
    setConfetti(true);
    window.setTimeout(() => setConfetti(false), 2600);
    return purchased;
  }

  const displayTicket =
    ticket?.id ?? normalizeTicketId(selectedTicketId) ?? "LP284";

  return (
    <main className="arcade-page">
      <ConfettiBurst active={confetti} />
      <GameNav />
      <section className="game-lobby" id="lobby">
        <div className="lobby-copy">
          <Image
            src={rotaractLogo}
            alt="Rotaract Club logo"
            width={290}
            height={290}
            sizes="(max-width: 700px) 38vw, (max-width: 1040px) 30vw, 290px"
            className="lobby-logo"
            style={{ width: "clamp(160px, 28vw, 290px)", height: "auto" }}
            priority
          />
          <p className="chapter-label">presents</p>
          <h1>Lucky Pass</h1>
          <p className="lobby-line">
            Your Golden Chance Starts Here, Claim Your Lucky Pass Today.
          </p>
          <div className="lobby-actions">
            <ArcadeButton
              label="TRY YOUR LUCK"
              icon={<Coins size={21} />}
              onClick={() =>
                document
                  .querySelector("#reveal")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />
          </div>
          <div className="jackpot-counter">
            <StatPuck label="Tickets Left" value={stats.available} />
            <StatPuck label="Sold" value={stats.sold} />
            <StatPuck label="Price" value={`Rs. ${TICKET_PRICE}`} />
          </div>
        </div>
        <div className="lobby-stage">
          <GameWorld3D mode={mode} ticket={displayTicket} />
          <LuckyMascot mood={mode === "reveal" ? "excited" : "idle"} />
        </div>
      </section>

      <section className="game-section prize-map">
        <SectionTitle
          icon={<Crown size={20} />}
          kicker="gold room"
          title="A raffle world made of gold tickets and winning chances."
        />
        <div className="treasure-grid">
          {[
            [
              "600",
              "Limited LP Tickets",
              "Every collectible pass is minted from LP001 to LP600.",
            ],
            [
              "Gold",
              "Legendary Reveal",
              "Insert a coin, wake the gears, and watch your number flip.",
            ],
            [
              "Live",
              "Ticket Board",
              "Available, reserved, and sold states stay readable without becoming a dashboard.",
            ],
          ].map(([value, title, copy], index) => (
            <motion.article
              key={title}
              className="treasure-tile"
              whileHover={{
                y: -10,
                rotateX: 4,
                rotateY: index === 1 ? 0 : index ? -5 : 5,
              }}
              transition={{ type: "spring", stiffness: 220, damping: 15 }}
            >
              <span>{value}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </motion.article>
          ))}
        </div>
      </section>

      <TicketBoard
        tickets={tickets}
        loading={loading}
        selectedTicketId={
          selectedTicket?.id ?? normalizeTicketId(selectedTicketId)
        }
        onSelectTicket={(nextTicketId) => {
          setSelectedTicketId(nextTicketId);
          document
            .querySelector("#reveal")
            ?.scrollIntoView({ behavior: "smooth" });
        }}
      />
      <TicketReveal
        id="reveal"
        ticket={ticket}
        loading={loading}
        selectedTicketId={selectedTicketId}
        selectedTicket={selectedTicket}
        onSelectedTicketIdChange={setSelectedTicketId}
        onPurchase={handleTicketPurchase}
      />
    </main>
  );
}

function GameNav() {
  return (
    <header className="game-nav">
      <nav>
        <a href="#reveal">Reveal</a>
        <a href="#board">Board</a>
      </nav>
    </header>
  );
}

function ArcadeButton({
  label,
  icon,
  onClick,
  type = "button",
}: {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <motion.button
      type={type}
      className="arcade-button"
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ y: 6, scale: 0.96 }}
      onClick={onClick}
    >
      <span className="button-face">
        {icon}
        {label}
      </span>
      <span className="button-shadow" />
    </motion.button>
  );
}

function StatPuck({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-puck">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SectionTitle({
  icon,
  kicker,
  title,
}: {
  icon: React.ReactNode;
  kicker: string;
  title: string;
}) {
  return (
    <div className="section-title">
      <span>
        {icon}
        {kicker}
      </span>
      <h2>{title}</h2>
    </div>
  );
}

function LuckyMascot({ mood }: { mood: "idle" | "excited" | "celebrate" }) {
  return (
    <motion.div
      className={`mascot mascot-${mood}`}
      whileHover={{ rotate: [0, -8, 8, 0], scale: 1.08 }}
      animate={
        mood === "celebrate"
          ? { y: [-8, -26, -8], rotate: [-5, 7, -5] }
          : { y: [-3, 8, -3] }
      }
      transition={{
        repeat: Infinity,
        duration: mood === "celebrate" ? 0.72 : 2.6,
        ease: "easeInOut",
      }}
      aria-label="Lucky coin mascot"
    >
      <div className="mascot-crown" />
      <div className="mascot-face">
        <i />
        <i />
        <b />
      </div>
      <div className="mascot-hand left" />
      <div className="mascot-hand right" />
      <small>
        {mood === "celebrate"
          ? "JACKPOT!"
          : mood === "excited"
            ? "Spin!"
            : "Hi!"}
      </small>
    </motion.div>
  );
}

function TicketReveal({
  id,
  ticket,
  loading,
  selectedTicketId,
  selectedTicket,
  onSelectedTicketIdChange,
  onPurchase,
}: {
  id: string;
  ticket: Ticket | null;
  loading: boolean;
  selectedTicketId: string;
  selectedTicket: Ticket | undefined;
  onSelectedTicketIdChange: (value: string) => void;
  onPurchase: (
    customer: ReservationInput,
    desiredTicketId?: string,
  ) => Promise<Ticket | null>;
}) {
  const [customer, setCustomer] = useState({ name: "", phone: "", email: "" });
  const [busy, setBusy] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [slip, setSlip] = useState<{ name: string; dataUrl: string } | null>(
    null,
  );
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPaymentOpen(true);
    emitSoundEvent("machine-click");
  }

  async function reserveFromModal() {
    if (!slip) {
      setError("Upload your payment slip before reserving a Lucky Pass.");
      return;
    }

    const desiredTicketId = normalizeTicketId(selectedTicketId);
    if (!/^LP\d{3}$/.test(desiredTicketId)) {
      setError("Choose a valid LP number like LP322.");
      return;
    }

    setError("");
    setBusy(true);
    let purchased: Ticket | null = null;
    try {
      purchased = await onPurchase(
        {
          ...customer,
          paymentSlipName: slip.name,
          paymentSlipDataUrl: slip.dataUrl,
        },
        desiredTicketId,
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Could not upload the payment slip. Please try again.",
      );
      setBusy(false);
      return;
    }
    setBusy(false);
    if (!purchased) {
      const message = `${desiredTicketId} is already reserved or sold. Choose another available ticket.`;
      setError(message);
      setPopupMessage(message);
      setPopupOpen(true);
      return;
    }

    setPaymentOpen(false);
  }

  async function handleSlipUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image slip.");
      return;
    }
    if (file.size > 750_000) {
      setError("Please upload a compressed slip image below 750 KB.");
      return;
    }

    setSlip({ name: file.name, dataUrl: await fileToDataUrl(file) });
    setError("");
  }

  return (
    <section className="game-section reveal-zone" id={id}>
      <SectionTitle
        icon={<Sparkles size={20} />}
        kicker="loot box"
        title="Insert a coin. Test your luck. Claim your Lucky Pass."
      />
      <div className="loot-layout">
        <form className="coin-slot" onSubmit={submit}>
          <div className="slot-mouth">
            <Coins size={30} />
            <span>Insert Rs. {TICKET_PRICE}</span>
          </div>
          <div className="ticket-choice-panel">
            <label htmlFor="ticket-choice-input">Choose your LP number</label>
            <input
              id="ticket-choice-input"
              className="ticket-choice-input"
              value={selectedTicketId}
              onChange={(event) =>
                onSelectedTicketIdChange(normalizeTicketId(event.target.value))
              }
              placeholder="LP322"
              maxLength={5}
            />
            <p>
              {selectedTicket
                ? selectedTicket.status === "available"
                  ? `${selectedTicket.id} is available. Reserve it now.`
                  : `${selectedTicket.id} is already ${selectedTicket.status}. Pick another number.`
                : "Type a ticket number or tap one on the board below."}
            </p>
          </div>
          <input
            required
            placeholder="Player name"
            value={customer.name}
            onChange={(event) =>
              setCustomer({ ...customer, name: event.target.value })
            }
          />
          <input
            required
            placeholder="Mobile number"
            value={customer.phone}
            onChange={(event) =>
              setCustomer({ ...customer, phone: event.target.value })
            }
          />
          <input
            required
            type="email"
            placeholder="Email address"
            value={customer.email}
            onChange={(event) =>
              setCustomer({ ...customer, email: event.target.value })
            }
          />
          <ArcadeButton
            type="submit"
            label={busy || loading ? "RESERVING..." : "RESERVE SELECTED PASS"}
            icon={<Gamepad2 size={20} />}
          />
        </form>
        <AnimatePresence>
          {popupOpen && (
            <motion.div
              className="popup-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="popup-card"
                initial={{ y: 18, scale: 0.94 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 10, scale: 0.96, opacity: 0 }}
                transition={{ type: "spring", stiffness: 210, damping: 18 }}
                role="alertdialog"
                aria-modal="true"
                aria-label="Reservation error"
              >
                <strong>Reservation blocked</strong>
                <p>{popupMessage}</p>
                <button
                  type="button"
                  className="metal-switch"
                  onClick={() => setPopupOpen(false)}
                >
                  OK
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <AnimatePresence>
          {paymentOpen && (
            <motion.div
              className="payment-modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="payment-modal"
                initial={{ y: 80, scale: 0.84, rotateX: 14 }}
                animate={{ y: 0, scale: 1, rotateX: 0 }}
                exit={{ y: 60, scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 160, damping: 17 }}
                role="dialog"
                aria-modal="true"
                aria-label="Lucky Pass payment"
              >
                <button
                  className="modal-close"
                  type="button"
                  onClick={() => setPaymentOpen(false)}
                >
                  Close
                </button>
                <div className="slot-mouth modal-slot">
                  <Coins size={30} />
                  <span>Pay Rs. {TICKET_PRICE} and upload your slip</span>
                </div>
                <div className="payment-box">
                  <div className="payment-title">
                    <Banknote size={20} />
                    <strong>Bank transfer details</strong>
                  </div>
                  <dl>
                    <div>
                      <dt>Account Name</dt>
                      <dd>Rotaract Club of University of Ruhuna</dd>
                    </div>
                    <div>
                      <dt>Bank</dt>
                      <dd>Bank of Ceylon</dd>
                    </div>
                    <div>
                      <dt>Account No.</dt>
                      <dd>000000000000</dd>
                    </div>
                    <div>
                      <dt>Amount</dt>
                      <dd>Rs. {TICKET_PRICE}</dd>
                    </div>
                  </dl>
                  <div className="payment-reference">
                    <ReceiptText size={28} />
                    <div>
                      <strong>Payment reference</strong>
                      <span>
                        {customer.name || "Your Name"} -{" "}
                        {customer.phone || "Phone Number"} - Lucky Pass
                      </span>
                    </div>
                  </div>
                  <div className="payment-warning">
                    <ShieldCheck size={22} />
                    <span>
                      Your LP number is reserved only after the slip is
                      uploaded. It becomes valid for the draw after admin
                      verification.
                    </span>
                  </div>
                  <label className="slip-upload">
                    <Upload size={18} />
                    <span>{slip ? slip.name : "Upload payment slip"}</span>
                    <input
                      required
                      type="file"
                      accept="image/*"
                      onChange={handleSlipUpload}
                    />
                  </label>
                  {error && <p className="form-error">{error}</p>}
                  <button
                    className="metal-switch reserve-switch"
                    type="button"
                    disabled={busy || loading}
                    onClick={reserveFromModal}
                  >
                    <ReceiptText size={18} />
                    {busy || loading ? "Reserving..." : "Reserve My Lucky Pass"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="capsule-chamber">
          <div className="gear gear-one" />
          <div className="gear gear-two" />
          <AnimatePresence mode="wait">
            {ticket ? (
              <motion.div
                key={ticket.id}
                className="legendary-ticket"
                initial={{ rotateY: 100, scale: 0.4, y: -120 }}
                animate={{ rotateY: 0, scale: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 110, damping: 13 }}
              >
                <TicketFoil ticket={ticket} />
              </motion.div>
            ) : (
              <motion.div
                className="capsule"
                animate={{ y: [-8, 16, -8], rotate: [-3, 5, -3] }}
                transition={{ repeat: Infinity, duration: 2.2 }}
              >
                <span>?</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function TicketFoil({ ticket }: { ticket: Ticket }) {
  const ticketMessage =
    ticket.status === "reserved"
        ? "Reserved until admin verifies your payment slip."
        : "Rotaract Club of University of Ruhuna";

  return (
    <div className="ticket-foil">
      <div className="ticket-rivet left" />
      <div className="ticket-rivet right" />
      <span>Lucky Pass</span>
      <strong>{ticket.id}</strong>
      <p>{ticketMessage}</p>
      <div className="ticket-metal-row">
        <em>
          {ticket.status === "reserved" ? "Pending" : `Rs. ${TICKET_PRICE}`}
        </em>
        <div className="ticket-proof">
          <span>
            {ticket.paymentStatus === "verified"
              ? "Verified Entry"
              : "Awaiting Admin"}
          </span>
          <small>{ticket.ownerName || "Lucky Pass holder"}</small>
          <small>{ticket.phone || "Phone pending"}</small>
        </div>
      </div>
    </div>
  );
}

function TicketBoard({
  tickets,
  loading,
  selectedTicketId,
  onSelectTicket,
}: {
  tickets: Ticket[];
  loading: boolean;
  selectedTicketId: string;
  onSelectTicket: (ticketId: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<TicketStatus | "all">("all");
  const visible = useMemo(
    () =>
      tickets.filter((ticket) => {
        const statusMatch = filter === "all" || ticket.status === filter;
        return (
          statusMatch && ticket.id.toLowerCase().includes(query.toLowerCase())
        );
      }),
    [tickets, filter, query],
  );

  const skeletons = Array.from({ length: 160 }, (_, index) => index);

  return (
    <section className="game-section board-zone" id="board">
      <SectionTitle
        icon={<TicketIcon size={20} />}
        kicker="ticket vault"
        title="A chunky arcade board for all 600 collectible passes."
      />
      <div className="board-machine">
        <div className="board-toolbar">
          <label>
            <Search size={18} />
            <input
              placeholder="Find LP284"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </label>
          <div>
            {(["all", "available", "reserved", "sold"] as const).map((status) => (
              <button
                key={status}
                className={filter === status ? "selected" : ""}
                onClick={() => setFilter(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
        <div className="board-selection-banner">
          <strong>Selected ticket</strong>
          <span>{selectedTicketId}</span>
          <small>Tap an available LP number below to lock it in.</small>
        </div>
        <div className="ticket-vault-grid">
          {loading
            ? skeletons.map((index) => (
                <span key={index} className="vault-ticket loading" />
              ))
            : visible.map((item) => (
                <motion.button
                  key={item.id}
                  type="button"
                  disabled={item.status !== "available"}
                  aria-pressed={selectedTicketId === item.id}
                  aria-label={`${item.id} is ${item.status}. ${item.status === "available" ? "Select this ticket" : "Not selectable"}`}
                  className={`vault-ticket ${item.status} ${selectedTicketId === item.id ? "is-selected" : ""}`}
                  whileHover={
                    item.status === "available"
                      ? { y: -6, rotate: -2 }
                      : undefined
                  }
                  whileTap={
                    item.status === "available" ? { scale: 0.94 } : undefined
                  }
                  onClick={() =>
                    item.status === "available" && onSelectTicket(item.id)
                  }
                  title={
                    item.status === "available"
                      ? `Select ${item.id}`
                      : `${item.id} is ${item.status}`
                  }
                >
                  {item.id}
                </motion.button>
              ))}
        </div>
      </div>
    </section>
  );
}

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
