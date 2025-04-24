import "@/styles/globals.css";

import { type Metadata } from "next";

import localFont from "next/font/local";

const satoshi = localFont({
  src: "../fonts/Satoshi-Variable.woff2",
  display: "swap",
  variable: "--font-satoshi",
});

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "AlertFi",
  description:
    "Get real-time crypto price alerts straight to Telegram or email. Set personalized buy or sell targets for Bitcoin, Ethereum, and more. Stay ahead of the market — no code, no clutter.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${satoshi.variable}`}>
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
        <Toaster richColors closeButton expand={false} />
      </body>
    </html>
  );
}
