import { ImageResponse } from "next/og";

const ALLOWED = new Set([180, 192, 512]);

export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
  const { size: raw } = await params;
  const size = ALLOWED.has(Number(raw)) ? Number(raw) : 192;
  const maskable = new URL(req.url).searchParams.has("maskable");
  const inner = maskable ? size * 0.62 : size;
  const radius = maskable ? 0 : size * 0.22;

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #10b981 0%, #047857 100%)",
          borderRadius: radius,
        }}
      >
        <div
          style={{
            width: inner * 0.56,
            height: inner * 0.56,
            borderRadius: "50%",
            border: `${inner * 0.11}px solid white`,
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "flex-end",
          }}
        >
          <div
            style={{
              width: inner * 0.16,
              height: inner * 0.16,
              borderRadius: "50%",
              background: "#fbbf24",
              marginTop: -inner * 0.1,
              marginRight: -inner * 0.1,
            }}
          />
        </div>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=604800, immutable" },
    },
  );
}
