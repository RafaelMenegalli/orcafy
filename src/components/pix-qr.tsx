"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { cn } from "@/lib/format";

export function PixQr({ payload, size = 240, className }: { payload: string; size?: number; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    QRCode.toDataURL(payload, { errorCorrectionLevel: "M", margin: 1, width: size * 2, color: { dark: "#0f172a", light: "#ffffff" } })
      .then((url) => active && setSrc(url))
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
    };
  }, [payload, size]);

  return (
    <div className={cn("flex shrink-0 items-center justify-center rounded-2xl bg-white p-3 ring-1 ring-ink-100", className)} style={{ width: size + 24, height: size + 24 }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} width={size} height={size} alt="QR Code Pix" className="h-full w-full" />
      ) : (
        <div className="h-full w-full animate-pulse rounded-xl bg-ink-100" />
      )}
    </div>
  );
}
