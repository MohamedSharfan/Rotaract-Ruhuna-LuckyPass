import net from "node:net";
import tls from "node:tls";

export type VerificationEmailInput = {
  to: string;
  name?: string | null;
  ticketId: string;
};

export type VerificationEmailResult =
  | { sent: true }
  | { sent: false; skipped: true; reason: string };

const GMAIL_SMTP_HOST = "smtp.gmail.com";
const GMAIL_SMTP_PORT = 587;

export function isGmailAddress(email: string) {
  return email.trim().toLowerCase().endsWith("@gmail.com");
}

export async function sendLuckyPassVerificationEmail({
  to,
  name,
  ticketId,
}: VerificationEmailInput): Promise<VerificationEmailResult> {
  const recipient = to.trim().toLowerCase();

  if (!isGmailAddress(recipient)) {
    throw new Error("Please use a Gmail address.");
  }

  const user = process.env.GMAIL_USER?.trim();
  const pass = process.env.GMAIL_APP_PASSWORD?.trim();

  if (!user || !pass) {
    return {
      sent: false,
      skipped: true,
      reason: "Gmail environment variables are not configured.",
    };
  }

  await sendGmail({
    user,
    pass,
    to: recipient,
    subject: `Your Lucky Pass ${ticketId} is verified`,
    text: buildTextMessage({ name, ticketId }),
    html: buildHtmlMessage({ name, ticketId }),
  });

  return { sent: true };
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
        const responseText = Buffer.concat(chunks).toString("utf8");
        const lines = responseText.trimEnd().split(/\r?\n/);
        const lastLine = lines.at(-1) ?? "";

        if (/^\d{3} /.test(lastLine)) {
          stream.off("data", onData);
          resolve(responseText);
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

  secureSocket = tls.connect({ socket, servername: GMAIL_SMTP_HOST });
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
    const socket = net.connect(GMAIL_SMTP_PORT, GMAIL_SMTP_HOST, () =>
      resolve(socket),
    );
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

function buildTextMessage({
  name,
  ticketId,
}: {
  name?: string | null;
  ticketId: string;
}) {
  const displayName = name?.trim() || "Lucky Pass holder";

  return [
    `Hi ${displayName},`,
    "",
    `Your payment has been verified for Lucky Pass ${ticketId}.`,
    "Your ticket is now confirmed for the draw.",
    "",
    "Rotaract Club of University of Ruhuna",
  ].join("\n");
}

function buildHtmlMessage({
  name,
  ticketId,
}: {
  name?: string | null;
  ticketId: string;
}) {
  const displayName = escapeHtml(name?.trim() || "Lucky Pass Holder");

  return `
  <!DOCTYPE html>
  <html>
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    </head>

    <body style="
      margin:0;
      padding:0;
      background:#f4f6f9;
      font-family:Arial, Helvetica, sans-serif;
    ">

      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 12px;">
        <tr>
          <td align="center">

            <table width="100%" cellpadding="0" cellspacing="0"
              style="
                max-width:620px;
                background:#ffffff;
                border-radius:18px;
                overflow:hidden;
                box-shadow:0 10px 35px rgba(0,0,0,0.08);
              ">

              <!-- HEADER -->
              <tr>
                <td style="
                  background:linear-gradient(135deg,#111827,#1f2937);
                  padding:42px 32px;
                  text-align:center;
                ">
                  <h1 style="
                    margin:0;
                    color:#facc15;
                    font-size:32px;
                    font-weight:700;
                    letter-spacing:0.5px;
                  ">
                    Lucky Pass Verified
                  </h1>

                  <p style="
                    margin-top:12px;
                    color:#d1d5db;
                    font-size:15px;
                    line-height:1.6;
                  ">
                    Your payment has been successfully confirmed
                  </p>
                </td>
              </tr>

              <!-- CONTENT -->
              <tr>
                <td style="padding:40px 34px; color:#374151;">

                  <p style="
                    margin:0 0 18px;
                    font-size:17px;
                    line-height:1.7;
                  ">
                    Hi <strong>${displayName}</strong>,
                  </p>

                  <p style="
                    margin:0 0 26px;
                    font-size:16px;
                    line-height:1.8;
                    color:#4b5563;
                  ">
                    We are pleased to inform you that your payment has been successfully verified.
                    Your Lucky Pass entry is now officially confirmed for the upcoming draw.
                  </p>

                  <!-- TICKET BOX -->
                  <table width="100%" cellpadding="0" cellspacing="0"
                    style="
                      background:#fff8db;
                      border:1px solid #fde68a;
                      border-radius:14px;
                      margin:28px 0;
                    ">

                    <tr>
                      <td style="padding:24px; text-align:center;">

                        <p style="
                          margin:0;
                          font-size:13px;
                          letter-spacing:1.5px;
                          color:#92400e;
                          text-transform:uppercase;
                          font-weight:700;
                        ">
                          Verified Ticket ID
                        </p>

                        <p style="
                          margin:12px 0 0;
                          font-size:30px;
                          font-weight:800;
                          color:#111827;
                          letter-spacing:1px;
                        ">
                          ${escapeHtml(ticketId)}
                        </p>

                      </td>
                    </tr>
                  </table>

                  <p style="
                    margin:0 0 20px;
                    font-size:15px;
                    line-height:1.8;
                    color:#6b7280;
                  ">
                    Please keep this email for your records. If you have any questions
                    regarding your entry or payment verification, feel free to contact us.
                  </p>

                  <!-- BUTTON -->
                  <table cellpadding="0" cellspacing="0" style="margin-top:34px;">
                    <tr>
                      <td align="center">
                        <a href="#"
                          style="
                            background:#111827;
                            color:#ffffff;
                            text-decoration:none;
                            padding:14px 28px;
                            border-radius:10px;
                            font-size:15px;
                            font-weight:600;
                            display:inline-block;
                          ">
                          Lucky Pass Confirmed
                        </a>
                      </td>
                    </tr>
                  </table>

                </td>
              </tr>

              <!-- FOOTER -->
              <tr>
                <td style="
                  background:#f9fafb;
                  padding:28px 34px;
                  text-align:center;
                  border-top:1px solid #e5e7eb;
                ">

                  <p style="
                    margin:0;
                    font-size:15px;
                    color:#111827;
                    font-weight:700;
                  ">
                    Rotaract Club of University of Ruhuna
                  </p>

                  <p style="
                    margin:10px 0 0;
                    font-size:13px;
                    color:#6b7280;
                    line-height:1.6;
                  ">
                    Thank you for supporting our initiative.
                  </p>

                </td>
              </tr>

            </table>

          </td>
        </tr>
      </table>

    </body>
  </html>
  `;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}