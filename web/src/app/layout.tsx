import type { Metadata } from "next";
import { Inter } from "next/font/google";
import MotionProvider from "@/components/providers/MotionProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "VibraCheck - Industrial Bearing Diagnostic Hub",
  description:
    "Sistem Telemetri & Diagnosis Kerusakan Bearing Mesin Industri Berbasis AI Pipeline dan Analisis Vibrasi ISO 20816",
  icons: {
    icon: "/logo.jpg",
    apple: "/logo.jpg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={`${inter.variable} font-sans`}>
      <body className="min-h-screen bg-[#F6F5F0] text-[#233026] antialiased">
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
