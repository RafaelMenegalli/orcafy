import { prisma } from "@/lib/prisma";
import { json, requireApiUserId, route } from "@/lib/api";
import { ONLINE_WINDOW_MS } from "@/lib/quote";

export const dynamic = "force-dynamic";

export const GET = route(async (req) => {
  const userId = await requireApiUserId();
  const url = new URL(req.url);
  const sinceParam = url.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;
  const validSince = since && !Number.isNaN(since.getTime()) ? since : null;
  const now = new Date();

  const [events, online, hotCount] = await Promise.all([
    prisma.quoteEvent.findMany({
      where: {
        quote: { userId },
        ...(validSince ? { createdAt: { gt: validSince } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: validSince ? 50 : 30,
      include: { quote: { select: { id: true, title: true, clientName: true, slug: true } } },
    }),
    prisma.quote.findMany({
      where: { userId, lastViewedAt: { gte: new Date(now.getTime() - ONLINE_WINDOW_MS) } },
      select: { id: true, title: true, clientName: true, lastViewedAt: true, viewsCount: true },
      orderBy: { lastViewedAt: "desc" },
    }),
    prisma.quote.count({ where: { userId, status: "HOT", expiresAt: { gt: now } } }),
  ]);

  return json({
    serverTime: now.toISOString(),
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
      quote: e.quote,
    })),
    online: online.map((q) => ({ ...q, lastViewedAt: q.lastViewedAt?.toISOString() ?? null })),
    hotCount,
  });
});
