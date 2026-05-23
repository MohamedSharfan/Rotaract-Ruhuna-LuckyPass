export type TicketStatus = "available" | "reserved" | "sold";
export type PaymentStatus = "none" | "pending" | "verified" | "rejected";

export type Ticket = {
  id: string;
  number: number;
  status: TicketStatus;
  paymentStatus?: PaymentStatus;
  ownerName?: string;
  phone?: string;
  email?: string;
  paymentSlipName?: string;
  paymentSlipDataUrl?: string;
  reservedAt?: string;
  verifiedAt?: string;
  purchasedAt?: string;
};

export const TICKET_COUNT = 600;
export const TICKET_PRICE = 200;

export function formatTicketId(number: number) {
  return `LP${String(number).padStart(3, "0")}`;
}

export function createTickets(seedSold = 0): Ticket[] {
  return Array.from({ length: TICKET_COUNT }, (_, index) => {
    const number = index + 1;
    const everySold = number <= seedSold || number % 29 === 0;

    return {
      id: formatTicketId(number),
      number,
      status: everySold ? "sold" : "available",
      paymentStatus: everySold ? "verified" : "none",
      ownerName: everySold
        ? sampleNames[number % sampleNames.length]
        : undefined,
      purchasedAt: everySold
        ? new Date(Date.now() - number * 1800000).toISOString()
        : undefined,
    };
  });
}

export function pickAvailableTicket(tickets: Ticket[]) {
  const available = tickets
    .filter((ticket) => ticket.status === "available")
    .sort((a, b) => a.number - b.number);
  if (!available.length) return null;
  return available[0];
}

export function pickWinner(tickets: Ticket[]) {
  const sold = tickets.filter((ticket) => ticket.status === "sold");
  const pool = sold.length ? sold : tickets;
  return pool[Math.floor(Math.random() * pool.length)];
}

export const sampleNames = [
  "Nethmi Jayasuriya",
  "Tharindu Perera",
  "Amani Senarath",
  "Ravindu Silva",
  "Kavindi Fernando",
  "Dulanjana Wijesinghe",
  "Sithum Ranasinghe",
  "Hashini De Silva",
];
