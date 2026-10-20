# Orçafy

Orçamentos interativos em 60 segundos, com **Radar de abertura em tempo real** e **fechamento com sinal via Pix**. Mobile-first, instalável como PWA.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS 3 + lucide-react
- PostgreSQL serverless (Neon) + Prisma 6
- Autenticação própria: JWT (`jose`) em cookie HTTP-only + `bcryptjs`
- Pix: gerador BR Code/EMVCo em TypeScript puro (CRC16-CCITT validado contra o exemplo do manual do BCB) + QR Code com `qrcode`

## Rodando localmente

```bash
npm install
npm run db:push    # cria/sincroniza as tabelas no banco do DATABASE_URL
npm run db:seed    # conta demo com catálogo, orçamentos e eventos do Radar
npm run dev
```

Acesse http://localhost:3000. A conta demo (e-mail e senha) está documentada no topo de `prisma/seed.ts`.
Rodar o seed de novo **recria** a conta demo do zero.

## Variáveis de ambiente

| Variável | Obrigatória | Uso |
| --- | --- | --- |
| `DATABASE_URL` | sim | Connection string do Postgres (Neon, com `sslmode=require`) |
| `JWT_SECRET` | sim | Assinatura dos tokens de sessão (mín. 16 caracteres) |
| `CAKTO_WEBHOOK_SECRET` | sim (para o PRO) | Chave secreta do webhook configurada na Cakto |
| `CAKTO_CHECKOUT_URL` | não | Link do checkout do PRO (padrão: o link atual do produto) |
| `CAKTO_PRODUCT_IDS` | não | IDs aceitos no webhook (produto/oferta), separados por vírgula |
| `ADMIN_SECRET` | não | Habilita `POST /api/admin/plan` para ativar/desativar o PRO |
| `NEXT_PUBLIC_APP_URL` | não | URL pública usada nos links enviados (sem ela, usa o host da requisição) |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | não | Número (DDI+DDD) para o botão "Assinar PRO pelo WhatsApp" |

Veja `.env.example`.

## Como funciona

**Prestador (`/app`)**
- **Radar**: feed ao vivo (polling a cada 4s) de aberturas, tempo de leitura, opcionais marcados, Pix aberto/copiado e aprovações; banner "está vendo agora"; alertas com som, vibração e notificação do navegador; lista "Chame agora" com follow-up pronto no WhatsApp.
- **Novo orçamento**: itens do catálogo com um toque, itens avulsos, opcionais (order bumps), prazo, validade, % de sinal, desconto e garantia. Gera link curto `/p/<slug>` e mensagem pronta para WhatsApp. Duplicar orçamento via `?from=<id>`.
- **Catálogo**: calculadora de preço por margem real — `preço = custo / (1 − margem)` — com custo de material + horas × valor da hora.
- **Perfil**: marca, bio, portfólio (upload redimensionado no navegador ou URL https), chave Pix com validação (CPF/CNPJ com dígito verificador, e-mail, celular, aleatória) e QR de teste de R$ 1,00.
- **Plano Grátis**: 5 orçamentos (contador `quotesCreatedCount`, bloqueio com HTTP 402).

**Cliente (`/p/[slug]`)**
- Contagem regressiva da validade, itens, opcionais com total ao vivo, condições, portfólio.
- "Aprovar orçamento" abre o Pix do sinal (QR + Copia e Cola) e confirma a aprovação.
- Estados de aprovado, expirado (com "Pedir para renovar") e recusado.
- O dono logado vê a página em **modo pré-visualização**: não conta no Radar e não aprova.

**Regras do Radar** (`src/lib/quote.ts`)
- `SENT → VIEWED` na primeira abertura.
- `→ HOT` com 3+ aberturas, 120s+ de leitura, opcional marcado ou Pix aberto/copiado.
- `EXPIRED` é aplicado automaticamente quando a validade passa (sem cron).

## Assinatura PRO (Cakto)

- O botão **Assinar o PRO** (Perfil → Seu plano) abre o checkout da Cakto com e-mail e nome já preenchidos.
- A Cakto chama `POST /api/webhooks/cakto`; o corpo traz o campo `secret`, validado contra `CAKTO_WEBHOOK_SECRET`.
- `purchase_approved`, `subscription_created` e `subscription_renewed` liberam o PRO por 33 dias (30 + 3 de carência) a partir do pagamento.
- `subscription_renewal_refused` marca pagamento pendente; `subscription_canceled` mantém o acesso até o fim do período pago; `refund` e `chargeback` removem o PRO na hora.
- Eventos de outros produtos são ignorados. Reenvios são idempotentes. Todos os webhooks ficam registrados na tabela `PaymentEvent`.
- Compra feita antes do cadastro é vinculada automaticamente ao criar a conta com o mesmo e-mail. Compra com outro e-mail é vinculada pelo usuário em **Já paguei com outro e-mail** (e-mail da compra + código do pedido).

## Ativar o PRO manualmente

```bash
curl -X POST https://SEU_DOMINIO/api/admin/plan \
  -H "x-admin-secret: $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"email":"cliente@exemplo.com","plan":"PRO"}'
```

## Deploy (Vercel)

1. Importe o repositório e configure as variáveis acima.
2. Build command padrão (`npm run build` já roda `prisma generate`).
3. Rode `npm run db:push` uma vez apontando para o banco de produção.
