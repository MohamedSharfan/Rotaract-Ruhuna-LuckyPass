import { NextResponse } from "next/server";
import net from "node:net";
import tls from "node:tls";

export async function POST(request: Request) {
  const { email, name, ticketId } = (await request.json()) as {
    email?: string;
    name?: string;
    ticketId?: string;
  };

  if (!email || !ticketId) {
    return NextResponse.json({ ok: false, error: "Missing email or ticket ID." }, { status: 400 });
  }

  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    return NextResponse.json({ ok: true, skipped: true, reason: "Gmail environment variables are not configured." });
  }

  await sendGmail({
    user,
    pass,
    to: email,
    subject: `Your Lucky Pass ${ticketId} is verified`,
    html: `<div style="font-family:Arial,sans-serif;background:#070606;color:#fff4cd;padding:24px">
      <h1 style="color:#ffd978">Lucky Pass Verified</h1>
      <p>Hi ${escapeHtml(name || "Lucky Pass holder")},</p>
      <p>Your payment has been verified. You have bought Lucky Pass coin <strong>${escapeHtml(ticketId)}</strong>.</p>
      <p>Rotaract Club of University of Ruhuna</p>
    </div>`,
    text: `Hi ${name || "Lucky Pass holder"},\n\nYour payment has been verified. You have bought Lucky Pass coin ${ticketId}.\n\nRotaract Club of University of Ruhuna`,
  });

  return NextResponse.json({ ok: true });
}

async function sendGmail({
  user,
  pass,
  to,
  subject,
  text,
  html,
}: {
  user: string;
  pass: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const socket = await connectSmtp();
  let secureSocket: tls.TLSSocket | null = null;

  const read = (stream: net.Socket | tls.TLSSocket) =>
    new Promise<string>((resolve, reject) => {
      const chunks: Buffer[] = [];
      const onData = (chunk: Buffer) => {
        chunks.push(chunk);
        const text = Buffer.concat(chunks).toString("utf8");
        const lines = text.trimEnd().split(/\r?\n/);
        const last = lines.at(-1) ?? "";
        if (/^\\d{3} /.test(last)) {
          stream.off("data", onData);
          resolve(text);
        }
      };
      stream.on("data", onData);
      stream.once("error", reject);
    });

  const write = async (stream: net.Socket | tls.TLSSocket, command: string) => {
    stream.write(`${command}\r\n`);
    return read(stream);
  };

  await read(socket);
  await write(socket, "EHLO lucky-pass.local");
  await write(socket, "STARTTLS");

  secureSocket = tls.connect({ socket, servername: "smtp.gmail.com" });
  await new Promise<void>((resolve, reject) => {
    secureSocket?.once("secureConnect", resolve);
    secureSocket?.once("error", reject);
  });

  await write(secureSocket, "EHLO lucky-pass.local");
  await write(secureSocket, "AUTH LOGIN");
  await write(secureSocket, Buffer.from(user).toString("base64"));
  await write(secureSocket, Buffer.from(pass).toString("base64"));
  await write(secureSocket, `MAIL FROM:<${user}>`);
  await write(secureSocket, `RCPT TO:<${to}>`);
  await write(secureSocket, "DATA");
  secureSocket.write(buildMessage({ user, to, subject, text, html }));
  await read(secureSocket);
  await write(secureSocket, "QUIT");
  secureSocket.end();
}

function connectSmtp() {
  return new Promise<net.Socket>((resolve, reject) => {
    const socket = net.connect(587, "smtp.gmail.com", () => resolve(socket));
    socket.once("error", reject);
    socket.setTimeout(15000, () => {
      socket.destroy();
      reject(new Error("SMTP connection timed out."));
    });
  });
}

function buildMessage({
  user,
  to,
  subject,
  text,
  html,
}: {
  user: string;
  to: string;
  subject: string;
  text: string;
  html: string;
}) {
  const boundary = `lucky-pass-${Date.now()}`;
  return [
    `From: Lucky Pass <${user}>`,
    `To: ${to}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    "",
    `--${boundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "",
    text,
    "",
    `--${boundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "",
    html,
    "",
    `--${boundary}--`,
    ".",
    "",
  ].join("\r\n");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
