# Lucky Pass

Lucky Pass is a premium 3D raffle game experience for the Rotaract Club of University of Ruhuna.

The new creative direction is a luxury black, gold, and silver arcade raffle machine: chunky controls, collectible foil tickets, animated coins, a mascot, a 3D prize machine, a ticket vault, and a jackpot draw theater.

## Stack

- Next.js App Router
- React
- Tailwind CSS
- Framer Motion
- GSAP-ready interaction structure
- Three.js with React Three Fiber and Drei
- Firebase Firestore
- Firebase Authentication
- Vercel-ready deployment

## Experience

- Game lobby hero with a real 3D raffle machine
- Rotating 3D tickets, floating coins, prize capsules, lucky wheel, and ticket stacks
- Mascot that reacts to states and hover
- “TRY YOUR LUCK” arcade button
- Ticket reveal flow: coin drop, machine activation, capsule chamber, dramatic foil ticket reveal
- Manual online payment flow with bank details and payment-slip upload
- Live board for all `LP001` to `LP600` tickets
- Jackpot draw theater with rumble, lamp chase, fast reel, and winner reveal
- Separate `/admin` endpoint for operator verification
- Sound-ready event hooks for coin drops, machine clicks, ticket reveal, and jackpot moments

## Local Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

The app can run in demo mode without Firebase keys. Add Firebase variables to enable realtime ticket data and admin verification.

## Payment Verification Flow

1. A visitor enters name, phone, and email.
2. They click `PAY ONLINE`.
3. Bank transfer details and a payment QR are shown.
4. The visitor uploads their payment slip.
5. The ticket is saved as `reserved`.
6. Admin opens `/admin`, reviews the buyer details and slip, then verifies it.
7. After verification, the ticket becomes `sold`.

Buyer records include ticket ID, name, phone number, email, payment status, reservation time, and uploaded slip image.

## Firebase Setup

1. Create a Firebase project.
2. Enable Firestore Database.
3. Enable Email/Password Authentication for admin users.
4. Copy `.env.example` to `.env.local`.
5. Fill in the Firebase web app variables.
6. Run the app and use the operator booth seed button once to create the 600 tickets.

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

Suggested Firestore rules for a controlled event:

```txt
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

For public payment collection, use a server action or Cloud Function to verify payment before marking a ticket as sold.

## Sound Hooks

The app emits browser events for future sound design:

```ts
window.addEventListener("lucky-pass:sound", (event) => {
  console.log(event.detail.name);
});
```

Current events include:

- `button`
- `coin-drop`
- `machine-click`
- `ticket-spin`
- `ticket-reveal`
- `winner-countdown`
- `confetti`
- `jackpot`

## Vercel Deployment

1. Push this project to GitHub.
2. Import it in Vercel.
3. Add the Firebase environment variables.
4. Deploy with the default Next.js settings.

Build command:

```bash
npm run build
```
# Rotaract-Ruhuna-LuckyPass
