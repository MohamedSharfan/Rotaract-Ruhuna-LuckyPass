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
  const displayName = escapeHtml(name?.trim() || "Participant");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">

<title>Lucky Pass Verified</title>
</head>

<body style="
  margin:0;
  padding:0;
  background:#f5f5f5;
  font-family:Inter,Arial,sans-serif;
  -webkit-font-smoothing:antialiased;
">

<table width="100%" cellpadding="0" cellspacing="0" border="0">
<tr>
<td align="center" style="padding:40px 16px;">

  <!-- CONTAINER -->
  <table width="100%" cellpadding="0" cellspacing="0" border="0"
    style="
      max-width:560px;
      background:#ffffff;
      border:1px solid #e5e5e5;
      border-radius:20px;
      overflow:hidden;
    ">

    <!-- TOP BAR -->
    <tr>
      <td style="
        height:6px;
        background:#111111;
      "></td>
    </tr>

    <!-- HEADER -->
    <tr>
      <td style="
        padding:48px 40px 24px;
      ">

        <p style="
          margin:0 0 14px;
          font-size:13px;
          font-weight:600;
          letter-spacing:0.08em;
          text-transform:uppercase;
          color:#666666;
        ">
          Lucky Pass
        </p>

        <h1 style="
          margin:0;
          font-size:34px;
          line-height:1.15;
          letter-spacing:-0.03em;
          color:#111111;
          font-weight:700;
        ">
          Payment verified.
        </h1>

      </td>
    </tr>

    <!-- BODY -->
    <tr>
      <td style="
        padding:0 40px 40px;
      ">

        <p style="
          margin:0 0 20px;
          color:#444444;
          font-size:16px;
          line-height:1.75;
        ">
          Hi ${displayName},
        </p>

        <p style="
          margin:0 0 28px;
          color:#444444;
          font-size:16px;
          line-height:1.75;
        ">
          Your payment has been successfully verified and your Lucky Pass entry
          is now officially confirmed for the draw.
        </p>

        <!-- TICKET CARD -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
          style="
            border:1px solid #e8e8e8;
            border-radius:16px;
            background:#fafafa;
            margin:0 0 32px;
          ">

          <tr>
            <td style="
              padding:28px;
            ">

              <p style="
                margin:0 0 10px;
                font-size:12px;
                font-weight:600;
                letter-spacing:0.08em;
                text-transform:uppercase;
                color:#777777;
              ">
                Verified Ticket ID
              </p>

              <p style="
                margin:0;
                font-size:28px;
                line-height:1.2;
                font-weight:700;
                letter-spacing:-0.03em;
                color:#111111;
              ">
                ${escapeHtml(ticketId)}
              </p>

            </td>
          </tr>

        </table>

        <p style="
          margin:0;
          color:#666666;
          font-size:15px;
          line-height:1.7;
        ">
          Please keep this email for your records.
        </p>

      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="
        padding:24px 40px 40px;
        border-top:1px solid #eeeeee;
      ">

        <p style="
          margin:0 0 8px;
          font-size:14px;
          font-weight:600;
          color:#111111;
        ">
          Rotaract Club of University of Ruhuna
        </p>

        <p style="
          margin:0;
          font-size:13px;
          line-height:1.7;
          color:#777777;
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