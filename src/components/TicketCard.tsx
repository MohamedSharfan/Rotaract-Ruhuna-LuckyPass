"use client";

import { QRCodeSVG } from "qrcode.react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { TiltPanel } from "@/components/MotionPrimitives";
import { TICKET_PRICE, type Ticket } from "@/lib/tickets";

export function TicketCard({ ticket, reveal = false }: { ticket: Ticket; reveal?: boolean }) {
  return (
    <TiltPanel className="ticket-shell">
      <motion.div
        className="ticket-card"
        initial={reveal ? { rotateY: 90, scale: 0.78, opacity: 0 } : false}
        animate={{ rotateY: 0, scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 120, damping: 16 }}
      >
        <div className="ticket-shine" />
        <div className="ticket-topline">
          <span>Lucky Pass</span>
          <Sparkles size={18} />
        </div>
        <strong>{ticket.id}</strong>
        <p>Rotaract Club of University of Ruhuna</p>
        <div className="ticket-bottom">
          <span>Rs. {TICKET_PRICE}</span>
          <div className="qr-wrap">
            <QRCodeSVG value={`Lucky Pass ${ticket.id}`} size={76} bgColor="transparent" fgColor="#120720" />
          </div>
        </div>
      </motion.div>
    </TiltPanel>
  );
}

