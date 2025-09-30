import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Just Dogs Training App",
  description: "Comprehensive dog training management for trainers, parents, and administrators",
  keywords: "dog training, pet care, Cape Town, South Africa, Just Dogs",
  authors: [{ name: "Just Dogs" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <div className="flex min-h-screen flex-col">
          {children}
        </div>
      </body>
    </html>
  );
}
