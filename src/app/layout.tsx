import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Placement Kit — Intelligent Resume Screening Engine",
  description: "Deterministic 0% AI Token Resume Screening & ATS Rubric Evaluation System",
  icons: {
    icon: "/assats/placement-logo.png",
    shortcut: "/assats/placement-logo.png",
    apple: "/assats/placement-logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={`${jakarta.variable} ${inter.variable} h-full antialiased`}
    >
      <body suppressHydrationWarning={true} className="min-h-full flex flex-col font-sans bg-slate-50 text-slate-800 antialiased">
        {children}
      </body>
    </html>
  );
}