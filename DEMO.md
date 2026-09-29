# Vonamed — Guia de demonstração

Contas de demonstração (base de dados de demo, sem dados reais). Password de todas: **`Demo2026!`**

| Papel | Email | O que mostrar |
|---|---|---|
| Cliente | `cliente.demo@vonamed.mz` | Pesquisar → reservar → pagar (simulado) → recibo → QR. Tem reservas em todos os estados. |
| Farmácia aprovada | `farmacia.demo@vonamed.mz` | Staff da **Farmácia Polana**. Dashboard, reservas recebidas (2 pendentes), carteira com saldo e levantamento. |
| Farmácia pendente | `pendente.demo@vonamed.mz` | Pedido "Farmácia Bairro Central" à espera de aprovação. Ecrã muda sozinho quando o admin aprova. |
| Admin | `admin.demo@vonamed.mz` | `/admin` (2 pedidos pendentes, 1 rejeitado) e `/admin/financas`. |

Conta extra: `cliente2.demo@vonamed.mz` (segundo cliente, com um pedido de farmácia rejeitado).

## Guião sugerido (≈8 min)

1. **Landing** — números vêm da BD (farmácias, medicamentos, bairros).
2. **Cliente** — pesquisar "coartem" ou "paracetamol" (funciona sem acentos), ver no mapa, reservar na Farmácia Polana.
   - Pagamento simulado: escolher M-Pesa/e-Mola, número `84 123 4567`, processa 2–3 s, recibo.
   - **Falha simulada**: usar um número terminado em `0000` (ex.: `84 000 0000`) → "Saldo insuficiente", nada é criado.
3. **Farmácia** (outro browser/aba anónima) — a reserva aparece em *Pendentes* sem refresh. Aprovar.
   - Validar QR: abrir o QR do cliente e ler com o telemóvel, ou abrir `/reserva/<id>` já autenticado como farmácia. Respostas: válido / já levantado / expirado / cancelado.
4. **Carteira** — saldo actualiza com o pagamento; levantar para M-Pesa.
5. **Admin** — aprovar "Farmácia Bairro Central"; na aba do `pendente.demo` o ecrã passa a "Aprovado" e dá acesso ao dashboard.
6. **Finanças** — comissões acumuladas, reservas por dia.

## Repor os dados de demo

```powershell
# 1. contas (idempotente; repõe passwords)
$env:SUPABASE_SERVICE_ROLE_KEY = "<service_role de: supabase projects api-keys --project-ref yzqkicjpzngiwomltsjb>"
node supabase/scripts/seed-demo-users.mjs

# 2. dados (idempotente; APAGA e recria medicamentos, farmácias, reservas, carteiras)
supabase db query --linked -f supabase/seed.sql
```

## Antes de apresentar

- **Fazer deploy da versão actual** (`git push`). O `vercel.json` novo corrige o 404 em links directos (`/reservas`, `/reserva/<id>` do QR) — sem ele, recarregar qualquer página em produção falha.
- Confirmar em produção: abrir `https://farma-pds.vercel.app/reservas` directamente deve mostrar a app, não 404.
- Confirmar que o projeto Supabase está activo: `supabase projects list` → `ACTIVE_HEALTHY`. Projectos gratuitos **pausam após ~7 dias sem uso**; abrir o dashboard e clicar *Restore* (2–5 min).
- Abrir a app uma vez e fazer login para "aquecer".
- Emails: enviados via Resend a partir de `onboarding@resend.dev` — só chegam ao email do dono da conta Resend. A app não depende deles (webhook assíncrono).
- Pagamentos M-Pesa/e-Mola são **simulados** (selo "Ambiente de simulação" no modal). Não há integração real.
