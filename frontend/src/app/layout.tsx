import type { Metadata } from "next";
import { Geist } from "next/font/google";

import Header from "@/components/Header";
import Providers from "@/components/Providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ORDO — Group dining, simplified",
  description:
    "Create a party, share a menu, and let everyone order together. One clear order for the restaurant.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <Header />
          <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
