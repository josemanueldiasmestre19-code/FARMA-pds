# Vonamed — Guião de demonstração

Produção: **https://farma-pds.vercel.app**
Contas de demonstração (dados fictícios). Password de todas: **`Demo2026!`**

| Papel | Email | Para quê |
|---|---|---|
| Cliente | `cliente.demo@vonamed.mz` | Pesquisar, reservar, pagar, ver QR e recibo. Já tem reservas em todos os estados. |
| Farmácia | `farmacia.demo@vonamed.mz` | Staff da **Farmácia Polana**. Reservas recebidas, validar QR, carteira. |
| Admin | `admin.demo@vonamed.mz` | `/admin` (2 pedidos pendentes, 1 rejeitado) e `/admin/financas`. |
| Farmácia pendente | `pendente.demo@vonamed.mz` | Tem o pedido "Farmácia Bairro Central" à espera. Ecrã muda sozinho quando o admin aprova. |

Extras (não são precisas no guião): `cliente2.demo@vonamed.mz`, `pendente2.demo@vonamed.mz`.

---

## Antes de começar (10 min antes)

1. **Supabase activo.** Projectos gratuitos pausam após ~7 dias sem uso. Verificar:
   `supabase projects list` → `vonamed` tem de estar `ACTIVE_HEALTHY`.
   Se estiver `INACTIVE`: https://supabase.com/dashboard/project/yzqkicjpzngiwomltsjb → *Restore project* (2–5 min).
2. **Dados limpos.** Se testaste fluxos depois do último reset:
   `supabase db query --linked -f supabase/seed.sql`
3. **Três janelas com sessão já iniciada** (as sessões partilham cookies dentro do mesmo perfil, por isso):
   - **Janela A — Cliente:** Chrome normal, `cliente.demo`. Idealmente o telemóvel, ou o Chrome com DevTools em modo telemóvel (375px) — a app é mobile-first e fica melhor assim.
   - **Janela B — Farmácia:** Chrome *anónimo*, `farmacia.demo`, aberta em `/dashboard/reservas`.
   - **Janela C — Admin:** outro browser (Edge) ou outro perfil do Chrome, `admin.demo`, aberta em `/admin`.
   - **Janela D — Pendente (opcional):** só se quiseres mostrar a aprovação ao vivo; Edge anónimo, `pendente.demo`, em `/registar-farmacia`.
4. Abrir cada janela uma vez e navegar entre 2–3 páginas para aquecer o cache. O primeiro pedido ao Supabase (Frankfurt) pode demorar 1–2 s.
5. Tema claro (ícone da lua na barra). Idioma PT. Zoom 100–110%.

---

## Guião (≈6 min)

### 0:00 — Landing (30 s) · Janela A
- Uma frase: *"O Vonamed diz-te, em tempo real, que farmácia de Maputo tem o medicamento que precisas — reservas, pagas com M-Pesa ou e-Mola e levantas com um QR, sem filas nem deslocações em vão."*
- Apontar os **números** (14 farmácias, 52 medicamentos, 13 bairros, 1 aberta 24h): vêm da base de dados, não são decorativos.
- Scroll até "Como funciona" (pesquisa → paga → QR). Não parar mais aqui.

### 0:30 — Cliente: pesquisar e reservar (2 min) · Janela A
1. Na barra de pesquisa escrever **`coartem`** (sem acento, minúsculas — mostrar que encontra "Coartem"). Ou `paracetamol`.
2. Resultados: ordenados por distância, **disponíveis primeiro**, preço em MT. Mencionar o toggle "Só disponíveis" e o aviso quando não há stock.
3. Clicar no nome **Farmácia Polana** → página da farmácia (horário 24h, avaliações, lista com "45 de 52 em stock").
4. **Reservar** o Coartem → modal:
   - Detalhe do preço: 520 MT + comissão Vonamed 25 MT = **545 MT**. (Mencionar: a comissão é por escalão, calculada no servidor, 0 MT em compras até 100 MT.)
   - Selo **"Ambiente de simulação"** — dizer logo que o pagamento é simulado, evita a pergunta.
   - Escolher **M-Pesa** → Continuar → número **`84 123 4567`** → Pagar.
   - "A processar" ~2,5 s → **Pagamento concluído**.
5. **Ver recibo** (com código, data, método, breakdown; botão imprimir/PDF). Fechar.
6. **Ver QR da reserva** — dizer: *"é isto que o cliente mostra no balcão"*. Fechar.

> Opcional (20 s), se quiseres mostrar tratamento de erro: repetir com o número **`84 000 0000`** → "Pagamento recusado — saldo insuficiente", nenhuma reserva criada, botão *Tentar novamente*.

### 2:30 — Farmácia: a reserva chega e é aprovada (1 min) · Janela B
1. A reserva Coartem **já está na lista de Pendentes** (sem refresh — realtime). O sino de notificações também tem +1.
2. Clicar **Aprovar**. Passa para o separador *Aprovadas*.
3. Voltar à Janela A por 5 s: em *Minhas reservas* o estado já diz **Aprovada** — também sem refresh.

### 3:30 — Balcão: validar o QR (45 s) · Janela B
1. No card da reserva aprovada, **Validar QR** (é o mesmo que a farmácia abriria ao ler o QR com o telemóvel).
2. Ecrã verde **"Reserva válida"** com medicamento, cliente, código, válido até (24 h). Clicar **Confirmar levantamento** → "Levantamento confirmado".
3. Recarregar a página (F5): agora diz **"Já levantada"** — o QR não serve duas vezes.
   Se houver tempo: em *Aprovadas* há uma reserva de Omeprazol de anteontem → *Validar QR* → **"Reserva expirada"**.

### 4:15 — Carteira da farmácia (45 s) · Janela B
1. Menu *Dashboard* → **Minha carteira**. O saldo já inclui os 520 MT do Coartem (histórico com o movimento no topo).
2. **Levantar saldo** → 500 MT → número `84 555 1234` → Levantar. Saldo desce, aparece "Levantamento para M-Pesa".
3. Mencionar: o dashboard de stock é editável em linha e reflecte-se na pesquisa dos clientes em tempo real (se sobrar tempo, mudar a quantidade de um medicamento e mostrar na Janela A).

### 5:00 — Admin: aprovar uma farmácia nova (1 min) · Janela C (+ D)
1. `/admin` → separador **Pedidos** → expandir **Farmácia Bairro Central** (NUIT, responsável, coordenadas, notas).
2. **Aprovar** → confirmar no modal. Passa para *Aprovadas*.
3. Se tiveres a Janela D: o ecrã "Pedido em análise" muda sozinho para **"Farmácia aprovada"** e entra no dashboard da farmácia nova, sem logout. (Mesmo sem a janela D, a farmácia aparece imediatamente no mapa da Janela A.)
4. Mostrar também *Rejeitadas* (1, com motivo) — o fluxo de rejeição existe.

### 6:00 — Finanças (30 s) · Janela C
- `/admin/financas`: reservas, levantadas, volume pago, **comissões acumuladas**, gráficos dos últimos 14 dias (passar o rato: tooltip por dia) e a carteira da plataforma.
- Frase de fecho: *"Cada reserva paga divide-se automaticamente: preço para a farmácia, comissão para a plataforma. É este o modelo de receita."*

---

## Se algo correr mal

| Sintoma | O que fazer |
|---|---|
| Ecrã "Não foi possível carregar" ao abrir | Supabase pausado ou sem rede. *Tentar novamente*; se persistir, restaurar o projecto no dashboard. |
| Reserva não aparece na farmácia sem refresh | A rede está a bloquear WebSockets (realtime). **F5** na Janela B resolve; a reserva está lá. |
| "Pagamento recusado" inesperado | Verifica que o número não termina em `0000`. Se disser "já não está disponível", o stock esgotou: escolhe outro medicamento. |
| Login não entra | Password `Demo2026!` (D maiúsculo, ponto de exclamação). Se "email não confirmado", correr o `seed-demo-users.mjs`. |
| Mapa cinzento | Tiles do OpenStreetMap não carregaram (rede). A lista lateral e o resto funcionam na mesma. |
| Rota não desenha no mapa | O serviço público OSRM falhou; a app cai para linha recta com distância estimada. |
| Página em branco | Recarregar. Há um ErrorBoundary; se aparecer "Algo correu mal", *Recarregar* leva à página inicial. |

Plano B: se o Vercel falhar, `npm run dev` local serve a mesma app (precisa na mesma de internet para o Supabase). Se o Supabase estiver em baixo, não há demo possível com dados ao vivo — leva capturas de ecrã dos ecrãs principais no telemóvel como último recurso.

---

## Limitações conhecidas (para não seres apanhado de surpresa)

**Pagamentos**
- M-Pesa e e-Mola são **simulados**: não há ligação às APIs da Vodacom/Movitel. O número só é validado por formato (9 dígitos, prefixo 82–87). Selo "Ambiente de simulação" visível no modal e na carteira.
- Não há reembolso real: ao cancelar, o valor é devolvido nas carteiras internas (a farmácia pode ficar com saldo negativo se já tiver levantado).
- Os levantamentos também são simulados; o dinheiro "sai" da carteira interna e mais nada.

**Emails**
- O email de confirmação/aprovação existe e está publicado (Resend), mas em modo de teste o Resend **só entrega ao email do dono da conta** — as contas `@vonamed.mz` não recebem nada. Não prometer "vai receber um email" na demo; dizer "está preparado, falta domínio verificado".

**Contas e acesso**
- Papéis (admin, staff de farmácia) são atribuídos por metadata no servidor; não há UI para o admin promover outro admin.
- Registar uma conta nova ao vivo pode pedir confirmação de email (a app mostra o ecrã "Confirme o seu email"). Usar as contas de demo.
- Uma conta = uma farmácia. Não há multi-loja nem vários funcionários por farmácia com permissões distintas.

**Reservas e stock**
- Uma reserva = **uma unidade**. Não há quantidade, nem lotes/validades.
- Validade da reserva: 24 h a partir do pagamento. Não há lembretes automáticos.
- O stock é gerido manualmente pela farmácia no dashboard; não há integração com sistemas de facturação/inventário.
- Notificações in-app existem só enquanto a app está aberta (guardadas no browser); **não há push** nem SMS.

**Plataforma**
- Supabase no plano gratuito: pausa após ~7 dias sem uso; latência de Frankfurt (~0,3 s por pedido). Um plano pago resolve as duas coisas.
- Realtime depende de WebSocket; em redes corporativas restritivas os dashboards precisam de F5.
- Idioma: o toggle EN só traduz os textos antigos; os ecrãs novos (pagamento, QR, finanças) estão só em português.
- Mapa e rotas usam serviços públicos gratuitos (OpenStreetMap, OSRM); sem SLA.
- PWA instalável, mas offline só serve a "casca" — sem dados.
- Dados de demonstração: farmácias e moradas são realistas mas **fictícias**; as coordenadas são aproximadas aos bairros.

**Qualidade**
- Testes: fluxos verificados com testes de browser automatizados nesta preparação, mas não há suite de testes no repositório.
- Modo escuro existe e funciona; apresentar em modo claro (foi o mais revisto).

---

## Repor os dados de demonstração

```powershell
# 1. Contas (idempotente; repõe passwords e limpa papéis)
$env:SUPABASE_SERVICE_ROLE_KEY = "<service_role de: supabase projects api-keys --project-ref yzqkicjpzngiwomltsjb>"
node supabase/scripts/seed-demo-users.mjs

# 2. Dados (idempotente; APAGA e recria medicamentos, farmácias, stock, reservas, carteiras, pedidos)
supabase db query --linked -f supabase/seed.sql
```

Depois do reset: Polana com saldo 570 MT, plataforma 155 MT, 2 pedidos pendentes, cliente.demo com 6 reservas (pendente, aprovada, 2 levantadas, cancelada, expirada).
