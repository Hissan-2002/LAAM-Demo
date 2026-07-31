import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "LAAM | Purchase Confidence",
  description:
    "Browse South Asian fashion with explainable purchase confidence signals for availability, final price, and delivery. Know before you buy.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#faf9f7] text-stone-900 antialiased">
        {/* Header */}
        <header className="sticky top-0 z-40 border-b border-stone-200 bg-white/90 backdrop-blur-sm">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-xl font-bold tracking-[0.08em] text-stone-900 group-hover:text-orange-700 transition-colors">
                LAAM
              </span>
              <span className="hidden sm:inline-block text-xs font-medium text-stone-400 tracking-wide border-l border-stone-200 pl-2 ml-1">
                South Asian Fashion
              </span>
            </Link>
            <div className="flex items-center gap-4">
              <span className="text-xs text-stone-500 bg-orange-50 border border-orange-100 rounded-full px-3 py-1 font-medium">
                Purchase Confidence Demo
              </span>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>

        {/* Footer */}
        <footer className="border-t border-stone-200 mt-16">
          <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-sm font-semibold tracking-widest text-stone-400">LAAM</p>
              <p className="text-xs text-stone-400">
                Technical assessment: Purchase confidence feature slice
              </p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
