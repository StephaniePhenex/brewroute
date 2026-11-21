import type { Metadata } from "next";
import {
  Cormorant_Garamond,
  Fredoka,
  Jost,
  Plus_Jakarta_Sans,
  Space_Mono,
} from "next/font/google";
import "./globals.css";

// Wordmark: BREWROUTE
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

// Nav pills, labels, stamp counter
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

// Editorial italic accents
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["600"],
  style: ["italic"],
  display: "swap",
});

// Concierge tool-call log, ticket stubs
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

// Body copy
const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "BrewRoute",
  description:
    "A seasonal café crawl, interactive map, tasting archive, and transparent raffle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${jost.variable} ${cormorant.variable} ${spaceMono.variable} ${jakarta.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}
