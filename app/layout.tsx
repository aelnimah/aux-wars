import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aux Wars — Your friends. Your music. One winner.",
  description: "The music party tournament. Build a fresh lineup, vote with friends, and crown your champion.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
