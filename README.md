<div align="center">

# ✨ Lucky Pass ✨
### Premium 3D Raffle Draw Experience

Built for the  
## Rotaract Club of University of Ruhuna

A luxury black & gold themed interactive raffle platform powered by Next.js, Supabase, and immersive 3D experiences.

<br>

<img src="./home.jpeg" width="100%" alt="Lucky Pass Preview"/>

<br>

![Next JS](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Supabase](https://img.shields.io/badge/Supabase-3ecf8e?style=for-the-badge&logo=supabase&logoColor=white)
![ThreeJS](https://img.shields.io/badge/Three.js-111111?style=for-the-badge&logo=three.js&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

<br>

> 🎟️ “TRY YOUR LUCK” — A cinematic raffle draw experience with interactive tickets, animated prize machines, and real-time verification.

</div>

---

# 🌟 Overview

**Lucky Pass** is a modern web-based raffle draw platform specially designed for the **Rotaract Club of University of Ruhuna**.

The project transforms a traditional raffle ticket system into an immersive digital experience using:

- 🎰 Interactive 3D raffle machine
- 🪙 Animated coin & ticket effects
- 🎟️ Live LP001 → LP600 ticket board
- 🔥 Live Supabase ticket reservations
- 💳 Manual payment verification system
- 👨‍💼 Secure admin operator dashboard
- 📱 Fully responsive premium UI

The entire experience follows a **luxury black, gold, and silver arcade aesthetic** inspired by modern casino and jackpot machines.

---

# 🎮 Main Experience

## 🏆 Luxury Arcade Lobby

Users enter a premium raffle lobby featuring:

- 3D raffle machine
- Floating gold coins
- Animated lucky capsules
- Interactive foil tickets
- Rotating collectibles
- Jackpot theater effects
- Dynamic motion animations

---

## 🎟️ Ticket Reservation System

Visitors can:

- Select any available ticket
- Reserve specific IDs like `LP001`
- Enter personal details
- Upload payment proof
- Complete manual bank transfer payments

All reservations are protected using:

The reservation flow uses guarded server-side updates in Supabase so one ticket cannot be sold to multiple buyers at the same time.

---

## 💳 Payment Verification Flow

### User Flow

1. User selects a ticket
2. Enters:
   - Name
   - Phone Number
   - Email
3. Clicks **PAY ONLINE**
4. Bank details
5. Uploads payment slip
6. Ticket becomes `reserved`

---

### Admin Flow

Admins can:

- Login securely
- Review uploaded slips
- Verify reservations
- Approve/reject payments
- Reopen tickets if necessary

After approval:

```txt
reserved → sold
```

---

# ✨ Features

## 🎰 Interactive Raffle Experience

- Real 3D raffle machine
- Animated ticket reveal sequence
- Lucky wheel mechanics
- Jackpot reveal theater
- Sound-ready interaction hooks
- Floating particle animations

---

## 🎟️ Ticket Management

- LP001 → LP600 live board
- Real-time ticket updates
- Available / Reserved / Sold states
- Atomic reservation logic
- Conflict-safe Supabase updates

---

## 👨‍💼 Admin Dashboard

- Supabase Auth
- Reservation management
- Payment verification
- Ticket recovery tools
- Admin-only operator access

---

## 📧 Email Support

ticket emails supported using:

- Gmail SMTP
- Gmail App Password authentication

---

## 📱 Responsive Design

Optimized for:

- Desktop
- Tablets
- Mobile devices

---

# 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| Next.js App Router | Framework |
| React | Frontend UI |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Three.js | 3D rendering |
| React Three Fiber | Three.js React integration |
| Supabase Postgres | Database |
| Supabase Auth | Admin authentication |
| Supabase Storage | Payment slip storage |
| Vercel | Deployment |

---

# 📂 Project Structure

```bash
/app
/components
/public
/styles
/lib
/api
/admin
```

---

# 🚀 Local Development Setup

## 1️⃣ Install Dependencies

```bash
npm install
```

---

## 2️⃣ Create Environment Variables

Create:

```bash
.env.local
```

Add:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_STORAGE_BUCKET=payment-slips
ADMIN_EMAILS=

GMAIL_USER=
GMAIL_APP_PASSWORD=
```

---

# 🟢 Supabase Setup

## Create Supabase Project

1. Open Supabase
2. Create a new project
3. Enable:
   - Database
   - Storage
   - Authentication
4. In Authentication:

```txt
Authentication -> Providers -> Email
```

5. Create the `tickets` table by running:

[supabase/schema.sql](E:\raffle draw rotaract\supabase\schema.sql)

6. Create one or more admin users in Supabase Auth.
7. Add those email addresses to:

```env
ADMIN_EMAILS=admin@example.com,second-admin@example.com
```

---

## Storage Bucket

Payment slip images are stored in Supabase Storage under:

```txt
payment-slips/{ticketId}/{fileName}
```

The app creates the bucket automatically with the name from `SUPABASE_STORAGE_BUCKET` if the service role key has permission. Ticket status and buyer metadata live in the `tickets` table, while the slip file itself lives in Supabase Storage.

---

# 📧 Gmail App Password Setup

To enable server email sending:

## Step 1

Enable:

```txt
Google Account → Security → 2-Step Verification
```

---

## Step 2

Generate App Password:

```txt
Security → App Passwords
```

Use:

```txt
App: Mail
Device: Custom Name
```

Paste generated password into:

```env
GMAIL_APP_PASSWORD=
```

---

# ▶️ Run Development Server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

# 🏗️ Production Build

```bash
npm run build
npm run start
```

---

# ☁️ Deploying to Vercel

## Steps

1. Push project to GitHub
2. Import repository into Vercel
3. Add environment variables
4. Deploy

Default Next.js settings work perfectly.

---

# 🔊 Sound Event Hooks

The app emits browser sound events for future sound design systems.

```js
window.addEventListener("lucky-pass:sound", (event) => {
  console.log(event.detail.name);
});
```

### Current Events

```txt
button
coin-drop
machine-click
ticket-spin
ticket-reveal
winner-countdown
confetti
jackpot
```

---

# ⚠️ Troubleshooting

## Supabase Login Error

### Problem

```txt
auth/invalid-credential
```

### Check

- Email/Password auth enabled
- Admin account exists
- Correct Supabase project
- Correct `.env.local`

---

## Email Sending Failure

Check:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- 2FA enabled
- App Password generated correctly

---

# 🎨 Customization

## Replace Branding

Update:

```bash
/public
/resources
```

with new logos, assets, and graphics.

---

## Ticket Count

Modify:

```txt
LP001 → LP600
```

inside `src/lib/tickets.ts`. The app keeps LP001 to LP600 in sync with the Supabase `tickets` table and creates any missing records automatically.

---

# 🤝 Contributing

Contributions are welcome.

Possible improvements:

- Accessibility enhancements
- UI polishing
- Sound design
- Performance optimization
- Deployment guides
- Animation upgrades

---

# ❤️ Credits

<div align="center">

## Made with ❤️ by Sharfan Saleem

Designed & Developed for the  
### Rotaract Club of University of Ruhuna

</div>

---

# 🌐 Links

## GitHub

👉 https://github.com/MohamedSharfan

---

# 📜 License

This project is created for the  
**Rotaract Club of University of Ruhuna**.


---

<div align="center">

# 🎟️ Lucky Pass
## “One Ticket Can Change Everything”

</div>
