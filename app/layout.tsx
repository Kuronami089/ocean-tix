import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";
import { LocationProvider } from "@/context/LocationContext";
import { TicketProvider } from "@/context/TicketContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OceanTix V2",
  description: "Movie Booking with Ocean Vibes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-950 text-white">
        <TicketProvider>
          <LocationProvider>
            <main className="flex-1 pb-24">{children}</main>
            <Footer />
            <BottomNav />
          </LocationProvider>
        </TicketProvider>
      </body>
    </html>
  );
}
