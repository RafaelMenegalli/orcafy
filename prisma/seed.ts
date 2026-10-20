/**
 * Seed de demonstração do Orçafy.
 * Conta demo: demo@orcafy.app / orcafy123  (apenas para desenvolvimento)
 * Executar: npm run db:seed
 */
import { PrismaClient, type EventType, type QuoteStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const DEMO_EMAIL = "demo@orcafy.app";
const DEMO_PASSWORD = "orcafy123";

const minutes = (n: number) => new Date(Date.now() - n * 60_000);
const hoursFromNow = (n: number) => new Date(Date.now() + n * 3600_000);

async function main() {
  await prisma.user.deleteMany({ where: { email: DEMO_EMAIL } });

  const user = await prisma.user.create({
    data: {
      name: "Rafael Souza",
      businessName: "RS Estética Automotiva",
      email: DEMO_EMAIL,
      passwordHash: await bcrypt.hash(DEMO_PASSWORD, 10),
      whatsapp: "5511987654321",
      bio: "Especialista em polimento técnico, vitrificação e higienização interna há 8 anos. Atendimento a domicílio em toda a zona sul de SP.",
      portfolioUrls: [
        "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?w=800&q=70",
        "https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?w=800&q=70",
        "https://images.unsplash.com/photo-1601362840469-51e4d8d58785?w=800&q=70",
      ],
      pixKeyType: "EMAIL",
      pixKey: "pix@rsestetica.com.br",
      pixHolderName: "RAFAEL SOUZA",
      pixCity: "SAO PAULO",
      defaultDownPayment: 50,
      defaultWarrantyText: "Garantia de 90 dias sobre o serviço executado.",
      quotesCreatedCount: 4,
    },
  });

  await prisma.catalogItem.createMany({
    data: [
      { userId: user.id, name: "Polimento técnico", description: "Correção de pintura em 3 etapas com remoção de riscos superficiais.", costMaterial: 80, costLaborHours: 5, hourlyRate: 45, profitMargin: 35, finalPrice: 470 },
      { userId: user.id, name: "Higienização interna", description: "Bancos, carpetes, teto e painel com extratora e produtos neutros.", costMaterial: 40, costLaborHours: 3, hourlyRate: 45, profitMargin: 35, finalPrice: 270 },
      { userId: user.id, name: "Lavagem detalhada", description: "Lavagem técnica com descontaminação e cera de carnaúba.", costMaterial: 20, costLaborHours: 1.5, hourlyRate: 40, profitMargin: 40, finalPrice: 140 },
      { userId: user.id, name: "Vitrificação de pintura", description: "Proteção cerâmica com duração de até 2 anos.", costMaterial: 220, costLaborHours: 4, hourlyRate: 50, profitMargin: 40, finalPrice: 700 },
      { userId: user.id, name: "Vitrificação de faróis", description: "Restaura a transparência e protege contra amarelamento.", costMaterial: 25, costLaborHours: 1, hourlyRate: 45, profitMargin: 40, finalPrice: 120, isBumpDefault: true },
      { userId: user.id, name: "Atendimento expresso 24h", description: "Prioridade na agenda: serviço concluído em até 24 horas.", costMaterial: 0, costLaborHours: 1, hourlyRate: 45, profitMargin: 50, finalPrice: 90, isBumpDefault: true },
      { userId: user.id, name: "Oxi-sanitização (ozônio)", description: "Elimina odores, fungos e bactérias do ar-condicionado.", costMaterial: 10, costLaborHours: 0.5, hourlyRate: 45, profitMargin: 50, finalPrice: 65, isBumpDefault: true },
    ],
  });

  type SeedQuote = {
    slug: string;
    clientName: string;
    clientWhatsapp: string;
    title: string;
    description?: string;
    status: QuoteStatus;
    createdMinAgo: number;
    expiresInHours: number;
    items: { name: string; description?: string; quantity: number; unitPrice: number }[];
    bumps: { name: string; description?: string; price: number; selected?: boolean }[];
    events: { type: EventType; minAgo: number; meta?: Record<string, unknown> }[];
    totalTimeSeconds: number;
  };

  const quotes: SeedQuote[] = [
    {
      slug: "demo7hot",
      clientName: "Mariana Costa",
      clientWhatsapp: "5511912345678",
      title: "Polimento Técnico + Higienização",
      description: "Serviço completo no seu Corolla 2020, realizado na sua garagem. Inclui todos os produtos e equipamentos.",
      status: "HOT",
      createdMinAgo: 180,
      expiresInHours: 20,
      items: [
        { name: "Polimento técnico", description: "Correção de pintura em 3 etapas.", quantity: 1, unitPrice: 470 },
        { name: "Higienização interna", description: "Bancos, carpetes, teto e painel.", quantity: 1, unitPrice: 270 },
      ],
      bumps: [
        { name: "Vitrificação de faróis", description: "Restaura a transparência e protege contra amarelamento.", price: 120, selected: true },
        { name: "Oxi-sanitização (ozônio)", description: "Elimina odores do ar-condicionado.", price: 65 },
      ],
      events: [
        { type: "VIEWED", minAgo: 170, meta: { viewNumber: 1, device: "celular" } },
        { type: "TIME_SPENT", minAgo: 166, meta: { seconds: 94 } },
        { type: "VIEWED", minAgo: 60, meta: { viewNumber: 2, device: "celular" } },
        { type: "BUMP_TOGGLED", minAgo: 58, meta: { bumpName: "Vitrificação de faróis", price: 120, selected: true } },
        { type: "VIEWED", minAgo: 6, meta: { viewNumber: 3, device: "celular" } },
        { type: "PIX_OPENED", minAgo: 4, meta: { amount: 430 } },
      ],
      totalTimeSeconds: 312,
    },
    {
      slug: "demo7ok",
      clientName: "Carlos Henrique",
      clientWhatsapp: "5511998887766",
      title: "Vitrificação de Pintura",
      status: "APPROVED",
      createdMinAgo: 60 * 26,
      expiresInHours: 46,
      items: [{ name: "Vitrificação de pintura", description: "Proteção cerâmica com duração de até 2 anos.", quantity: 1, unitPrice: 700 }],
      bumps: [{ name: "Atendimento expresso 24h", price: 90, selected: true }],
      events: [
        { type: "VIEWED", minAgo: 60 * 25, meta: { viewNumber: 1, device: "celular" } },
        { type: "BUMP_TOGGLED", minAgo: 60 * 25 - 2, meta: { bumpName: "Atendimento expresso 24h", price: 90, selected: true } },
        { type: "PIX_OPENED", minAgo: 60 * 25 - 4, meta: { amount: 395 } },
        { type: "PIX_COPIED", minAgo: 60 * 25 - 5, meta: { amount: 395 } },
        { type: "APPROVED", minAgo: 60 * 25 - 7, meta: { total: 790, downPayment: 395 } },
      ],
      totalTimeSeconds: 245,
    },
    {
      slug: "demo7view",
      clientName: "Juliana Prado",
      clientWhatsapp: "5511976543210",
      title: "Lavagem Detalhada (2 carros)",
      status: "VIEWED",
      createdMinAgo: 90,
      expiresInHours: 70,
      items: [{ name: "Lavagem detalhada", quantity: 2, unitPrice: 140 }],
      bumps: [{ name: "Oxi-sanitização (ozônio)", price: 65 }],
      events: [{ type: "VIEWED", minAgo: 75, meta: { viewNumber: 1, device: "computador" } }],
      totalTimeSeconds: 48,
    },
    {
      slug: "demo7sent",
      clientName: "Pedro Almeida",
      clientWhatsapp: "5511965432109",
      title: "Higienização Interna Completa",
      status: "SENT",
      createdMinAgo: 15,
      expiresInHours: 72,
      items: [{ name: "Higienização interna", quantity: 1, unitPrice: 270 }],
      bumps: [
        { name: "Oxi-sanitização (ozônio)", price: 65 },
        { name: "Atendimento expresso 24h", price: 90 },
      ],
      events: [],
      totalTimeSeconds: 0,
    },
  ];

  for (const q of quotes) {
    const views = q.events.filter((e) => e.type === "VIEWED");
    const lastEvent = q.events.length ? Math.min(...q.events.map((e) => e.minAgo)) : null;
    const approvedEvent = q.events.find((e) => e.type === "APPROVED");
    await prisma.quote.create({
      data: {
        slug: q.slug,
        userId: user.id,
        clientName: q.clientName,
        clientWhatsapp: q.clientWhatsapp,
        title: q.title,
        description: q.description,
        deliveryTime: "3 dias úteis",
        warrantyText: "Garantia de 90 dias sobre o serviço executado.",
        downPaymentPercent: 50,
        status: q.status,
        createdAt: minutes(q.createdMinAgo),
        expiresAt: hoursFromNow(q.expiresInHours),
        viewsCount: views.length,
        totalTimeSeconds: q.totalTimeSeconds,
        lastViewedAt: lastEvent !== null ? minutes(lastEvent) : null,
        approvedAt: approvedEvent ? minutes(approvedEvent.minAgo) : null,
        items: { create: q.items },
        bumps: { create: q.bumps.map((b) => ({ ...b, selected: b.selected ?? false })) },
        events: {
          create: q.events.map((e) => ({
            type: e.type,
            createdAt: minutes(e.minAgo),
            metadata: e.meta ? JSON.stringify(e.meta) : null,
          })),
        },
      },
    });
  }

  console.log(`✔ Seed concluído. Login demo: ${DEMO_EMAIL} (senha no topo de prisma/seed.ts)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
