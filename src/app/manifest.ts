import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Orçafy — Orçamentos em 60s",
    short_name: "Orçafy",
    description: "Orçamentos interativos com Radar de abertura e sinal via Pix.",
    start_url: "/app",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0a0e1a",
    theme_color: "#059669",
    lang: "pt-BR",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Novo orçamento", short_name: "Novo", url: "/app/orcamentos/novo" },
      { name: "Radar", short_name: "Radar", url: "/app" },
    ],
  };
}
