import type { Metadata } from "next";
import { Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";
import rotaractLogo from "@/resources/raclogo.png";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lucky Pass | Rotaract Club of University of Ruhuna",
  description:
    "A cinematic raffle draw experience with 600 Lucky Pass tickets.",
  icons: {
    icon: rotaractLogo.src,
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css"
        />
      </head>
      <body className={`${sora.variable} ${spaceGrotesk.variable}`}>
        {children}
        <footer className="site-footer">
          <a
            href="https://github.com/MohamedSharfan"
            target="_blank"
            rel="noreferrer"
          >
            Developed by Sharfan Saleem{" "}
            <i className="bi bi-heart-fill gold-heart" aria-hidden="true" />
          </a>
        </footer>
      </body>
    </html>
  );
}
