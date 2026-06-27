import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lodestar",
  description: "AI-powered networking OS for conferences",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
