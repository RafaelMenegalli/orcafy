import { prisma } from "@/lib/prisma";
import { json, parseBody, route } from "@/lib/api";
import { trackSchema } from "@/lib/validation";
import { isOpenStatus, loadPublicQuote } from "@/lib/public-quote";
import { shouldBeHot } from "@/lib/quote";
import type { QuoteStatus } from "@prisma/client";

type Ctx = { params: Promise<{ slug: string }> };

export const POST = route<Ctx>(async (req, { params }) => {
  const { slug } = await params;
  const body = await parseBody(req, trackSchema);
  const { quote, isOwner } = await loadPublicQuote(slug);

  // O prestador pré-visualizando não polui o Radar.
  if (isOwner) return json({ ok: true, preview: true });

  const now = new Date();
  const open = isOpenStatus(quote.status);

  if (body.type === "VIEWED") {
    const viewsCount = quote.viewsCount + 1;
    let status: QuoteStatus = quote.status;
    if (open) {
      status = shouldBeHot({ viewsCount, totalTimeSeconds: quote.totalTimeSeconds }) || quote.status === "HOT" ? "HOT" : "VIEWED";
    }
    await prisma.$transaction([
      prisma.quote.update({
        where: { id: quote.id },
        data: { viewsCount: { increment: 1 }, lastViewedAt: now, status },
      }),
      prisma.quoteEvent.create({
        data: {
          quoteId: quote.id,
          type: "VIEWED",
          metadata: JSON.stringify({ viewNumber: viewsCount, device: body.device, referrer: body.referrer }),
        },
      }),
    ]);
    return json({ ok: true, status });
  }

  if (body.type === "TIME_SPENT") {
    const totalTimeSeconds = quote.totalTimeSeconds + body.seconds;
    const becomesHot = open && quote.status !== "HOT" && shouldBeHot({ viewsCount: quote.viewsCount, totalTimeSeconds });
    const ops = [
      prisma.quote.update({
        where: { id: quote.id },
        data: {
          totalTimeSeconds: { increment: body.seconds },
          lastViewedAt: now,
          ...(becomesHot ? { status: "HOT" as const } : {}),
        },
      }),
    ];
    if (body.final && (body.sessionSeconds ?? 0) >= 5) {
      await prisma.$transaction([
        ...ops,
        prisma.quoteEvent.create({
          data: { quoteId: quote.id, type: "TIME_SPENT", metadata: JSON.stringify({ seconds: body.sessionSeconds }) },
        }),
      ]);
    } else {
      await prisma.$transaction(ops);
    }
    return json({ ok: true });
  }

  // PIX_OPENED / PIX_COPIED: forte intenção de compra -> HOT
  await prisma.$transaction([
    prisma.quote.update({
      where: { id: quote.id },
      data: { lastViewedAt: now, ...(open ? { status: "HOT" as const } : {}) },
    }),
    prisma.quoteEvent.create({
      data: { quoteId: quote.id, type: body.type, metadata: JSON.stringify({ amount: body.amount }) },
    }),
  ]);
  return json({ ok: true });
});
