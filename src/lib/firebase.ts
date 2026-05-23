import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";
import {
  collection,
  doc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from "firebase/firestore";
import { createTickets, pickAvailableTicket, type Ticket } from "@/lib/tickets";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.authDomain &&
  firebaseConfig.projectId &&
  firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export function getFirebase() {
  if (!isFirebaseConfigured) return null;
  app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  db = getFirestore(app);
  return { app, db, auth: getAuth(app) };
}

export function watchTickets(onTickets: (tickets: Ticket[]) => void) {
  const firebase = getFirebase();
  if (!firebase) {
    onTickets(createTickets());
    return () => undefined;
  }

  return onSnapshot(collection(firebase.db, "tickets"), (snapshot) => {
    if (snapshot.empty) {
      onTickets(createTickets());
      return;
    }

    onTickets(
      snapshot.docs
        .map((ticketDoc) => ticketDoc.data() as Ticket)
        .sort((a, b) => a.number - b.number),
    );
  });
}

export async function seedTickets() {
  const firebase = getFirebase();
  if (!firebase) return;

  await Promise.all(
    createTickets(0).map((ticket) =>
      setDoc(doc(firebase.db, "tickets", ticket.id), withoutUndefined(ticket), {
        merge: true,
      }),
    ),
  );
}

export type ReservationInput = {
  name: string;
  phone: string;
  email: string;
  paymentSlipName: string;
  paymentSlipDataUrl: string;
};

export async function reserveRandomTicket(
  customer: ReservationInput,
  localTickets: Ticket[],
) {
  const picked = pickAvailableTicket(localTickets);
  if (!picked) return null;

  return reserveSpecificTicket(customer, picked.id, localTickets);
}

export async function reserveSpecificTicket(
  customer: ReservationInput,
  ticketId: string,
  localTickets: Ticket[],
) {
  const firebase = getFirebase();
  const normalizedTicketId = ticketId.trim().toUpperCase();
  const candidate = localTickets.find(
    (ticket) => ticket.id === normalizedTicketId,
  );

  if (!candidate || candidate.status !== "available") {
    return null;
  }

  if (!firebase) {
    return {
      ...candidate,
      status: "reserved" as const,
      paymentStatus: "pending" as const,
      ownerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      paymentSlipName: customer.paymentSlipName,
      paymentSlipDataUrl: customer.paymentSlipDataUrl,
      reservedAt: new Date().toISOString(),
    };
  }

  const reserved = await runTransaction(firebase.db, async (transaction) => {
    const ref = doc(firebase.db, "tickets", normalizedTicketId);
    const current = await transaction.get(ref);
    const currentTicket = current.data() as Ticket | undefined;
    if (currentTicket && currentTicket.status !== "available") return null;

    const next: Ticket = {
      ...candidate,
      status: "reserved",
      paymentStatus: "pending",
      ownerName: customer.name,
      phone: customer.phone,
      email: customer.email,
      paymentSlipName: customer.paymentSlipName,
      paymentSlipDataUrl: customer.paymentSlipDataUrl,
      reservedAt: new Date().toISOString(),
    };

    transaction.set(
      ref,
      withoutUndefined({ ...next, serverReservedAt: serverTimestamp() }),
      { merge: true },
    );
    return next;
  });

  return reserved;
}

export async function verifyReservedTicket(ticket: Ticket) {
  const firebase = getFirebase();
  if (!firebase) return;

  await updateDoc(doc(firebase.db, "tickets", ticket.id), {
    status: "sold",
    paymentStatus: "verified",
    verifiedAt: new Date().toISOString(),
    purchasedAt: new Date().toISOString(),
    serverVerifiedAt: serverTimestamp(),
  });

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
  const firebase = getFirebase();
  if (!firebase) return;

  await updateDoc(doc(firebase.db, "tickets", ticketId), {
    status: "available",
    paymentStatus: "none",
    ownerName: "",
    phone: "",
    email: "",
    paymentSlipName: "",
    paymentSlipDataUrl: "",
    reservedAt: "",
    verifiedAt: "",
    purchasedAt: "",
  });
}

export async function rejectReservedTicket(ticketId: string) {
  const firebase = getFirebase();
  if (!firebase) return;

  await updateDoc(doc(firebase.db, "tickets", ticketId), {
    status: "available",
    paymentStatus: "rejected",
    ownerName: "",
    phone: "",
    email: "",
    paymentSlipName: "",
    paymentSlipDataUrl: "",
    reservedAt: "",
  });
}

export async function releaseIncompleteReservations(tickets: Ticket[]) {
  const firebase = getFirebase();
  if (!firebase) return;

  const incomplete = tickets.filter(
    (ticket) =>
      ticket.status === "reserved" &&
      (!ticket.paymentSlipDataUrl || !ticket.ownerName),
  );
  await Promise.all(
    incomplete.map((ticket) =>
      updateDoc(doc(firebase.db, "tickets", ticket.id), {
        status: "available",
        paymentStatus: "none",
        ownerName: "",
        phone: "",
        email: "",
        paymentSlipName: "",
        paymentSlipDataUrl: "",
        reservedAt: "",
      }),
    ),
  );
}

function withoutUndefined<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined),
  );
}

export function adminSignIn(email: string, password: string) {
  const firebase = getFirebase();
  if (!firebase) throw new Error("Firebase is not configured.");
  return signInWithEmailAndPassword(firebase.auth, email.trim(), password);
}

export function adminSignOut() {
  const firebase = getFirebase();
  if (!firebase) return Promise.resolve();
  return signOut(firebase.auth);
}

export function watchAdmin(onUser: (user: User | null) => void) {
  const firebase = getFirebase();
  if (!firebase) {
    onUser(null);
    return () => undefined;
  }

  return onAuthStateChanged(firebase.auth, onUser);
}
