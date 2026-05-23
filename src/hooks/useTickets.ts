"use client";

import { useEffect, useMemo, useState } from "react";
import {
  reserveRandomTicket,
  reserveSpecificTicket,
  watchTickets,
  type ReservationInput,
} from "@/lib/firebase";
import { TICKET_COUNT, type Ticket } from "@/lib/tickets";

export function useTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = watchTickets((nextTickets) => {
      setTickets(nextTickets);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const stats = useMemo(() => {
    const sold = tickets.filter((ticket) => ticket.status === "sold").length;
    const reserved = tickets.filter(
      (ticket) => ticket.status === "reserved",
    ).length;
    const available = TICKET_COUNT - sold - reserved;
    return { sold, reserved, available, total: TICKET_COUNT };
  }, [tickets]);

  async function reserve(customer: ReservationInput, desiredTicketId?: string) {
    const ticket = desiredTicketId?.trim()
      ? await reserveSpecificTicket(customer, desiredTicketId, tickets)
      : await reserveRandomTicket(customer, tickets);
    if (ticket) {
      setTickets((current) =>
        current.map((item) => (item.id === ticket.id ? ticket : item)),
      );
    }
    return ticket;
  }

  return { tickets, stats, loading, reserve };
}
