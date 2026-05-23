"use client";

import { useEffect, useMemo, useState } from "react";
import { watchAdminTickets } from "@/lib/supabase";
import { TICKET_COUNT, type Ticket } from "@/lib/tickets";

export function useAdminTickets(enabled: boolean) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!enabled) {
      setTickets([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    const unsubscribe = watchAdminTickets(
      (nextTickets) => {
        setTickets(nextTickets);
        setLoading(false);
        setError("");
      },
      (message) => {
        setError(message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [enabled]);

  const stats = useMemo(() => {
    const sold = tickets.filter((ticket) => ticket.status === "sold").length;
    const reserved = tickets.filter(
      (ticket) => ticket.status === "reserved",
    ).length;
    const available = TICKET_COUNT - sold - reserved;
    return { sold, reserved, available, total: TICKET_COUNT };
  }, [tickets]);

  return { tickets, stats, loading, error };
}
