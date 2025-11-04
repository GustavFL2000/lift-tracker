import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lift-tarcker",
  description: "Simpel fitness tracker til progressiv overload",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="border-b bg-white">
          <div className="mx-auto max-w-xl p-4 flex items-center justify-between">
            <a href="/" className="font-semibold">Lift-tarcker</a>
            <nav className="flex gap-4 text-sm">
              <a href="/my" className="hover:underline">Min liste</a>
              <a href="/admin" className="hover:underline">Admin</a>
            </nav>
          </div>
        </header>
        <main>
          {children}
        </main>
      </body>
    </html>
  );
}
