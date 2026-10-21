import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/toast";
import { ServiceWorker } from "@/components/service-worker";
import { TrackingScripts } from "@/components/tracking-scripts";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

// Favicon, ícone da Apple e imagem de compartilhamento vêm das convenções de arquivo
// em src/app (icon.png, apple-icon.png, opengraph-image.jpg, twitter-image.jpg).
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://orcafy-mu.vercel.app"),
  title: { default: "Orçafy — Orçamentos que fecham em 60 segundos", template: "%s · Orçafy" },
  description:
    "Crie orçamentos interativos em 60 segundos, saiba em tempo real quando o cliente abriu e receba o sinal via Pix na hora.",
  applicationName: "Orçafy",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Orçafy", statusBarStyle: "default" },
  formatDetection: { telephone: false },
  openGraph: { siteName: "Orçafy", locale: "pt_BR", type: "website" },
  twitter: { card: "summary_large_image" },
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
