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
    background_color: "#f8fafc",
    theme_color: "#059669",
    lang: "pt-BR",
    categories: ["business", "productivity", "finance"],
    icons: [
      { src: "/icons/192", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/512?maskable=1", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Novo orçamento", short_name: "Novo", url: "/app/orcamentos/novo" },
      { name: "Radar", short_name: "Radar", url: "/app" },
    ],
  };
}
