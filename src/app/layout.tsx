import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import { ServiceWorker } from "@/components/service-worker";
import { TrackingScripts } from "@/components/tracking-scripts";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Orçafy — Orçamentos que fecham em 60 segundos", template: "%s · Orçafy" },
  description:
    "Crie orçamentos interativos em 60 segundos, saiba em tempo real quando o cliente abriu e receba o sinal via Pix na hora.",
  applicationName: "Orçafy",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Orçafy", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  icons: {
    icon: [{ url: "/icons/192", type: "image/png", sizes: "192x192" }],
    apple: [{ url: "/icons/180", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#059669",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="min-h-dvh font-sans">
        <ToastProvider>{children}</ToastProvider>
        <ServiceWorker />
        <TrackingScripts />
      </body>
    </html>
  );
}
