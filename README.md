<div align="center">

# ✨ Lucky Pass ✨
### Premium 3D Raffle Draw Experience

Built for the  
## Rotaract Club of University of Ruhuna

A luxury black & gold themed interactive raffle platform powered by Next.js, Firebase, and immersive 3D experiences.

<br>

<img src="./home.jpeg" width="100%" alt="Lucky Pass Preview"/>

<br>

![Next JS](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Firebase](https://img.shields.io/badge/Firebase-ffca28?style=for-the-badge&logo=firebase&logoColor=black)
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
- 🔥 Real-time Firebase ticket reservations
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

```js
Firestore runTransaction()
```

to prevent duplicate reservations and race conditions.

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
- Conflict-safe Firestore transactions

---

## 👨‍💼 Admin Dashboard

- Firebase Authentication
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
| Firebase Firestore | Database |
| Firebase Authentication | Admin authentication |
| Vercel | Deployment |

---

# 📂 Project Structure

```bash
/app
/components
/public
/styles
/lib
/firebase
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
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

GMAIL_USER=
GMAIL_APP_PASSWORD=
```

---

# 🔥 Firebase Setup

## Create Firebase Project

1. Open Firebase Console
2. Create a new project
3. Enable:
   - Firestore Database
   - Authentication
4. Enable:

```txt
Authentication → Sign-in Method → Email/Password
```

5. Add an admin account manually

---

## Suggested Firestore Rules

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /tickets/{ticketId} {
      allow read: if true;
      allow create, update, delete: if request.auth != null;
    }

  }
}
```

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

## Firebase Login Error

### Problem

```txt
auth/invalid-credential
```

### Check

- Email/Password auth enabled
- Admin account exists
- Correct Firebase project
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

inside seed logic or Firestore initialization.

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