# Setup — Notificações por Email (Resend + Edge Function)

Este sistema envia emails automáticos para clientes e farmácias quando há eventos numa reserva.

## 1. Criar conta no Resend

1. Vai a https://resend.com e cria conta gratuita (3000 emails/mês grátis)
2. Verifica o teu email
3. Vai a **API Keys** → **Create API Key** → guarda a chave (começa com `re_`)

### Opcional: domínio próprio
Para enviar de `notificacoes@vonamed.mz` em vez de `onboarding@resend.dev`:
- Resend → **Domains** → **Add Domain** → adiciona DNS records → aguarda verificação

## 2. Correr o SQL

No SQL Editor do Supabase corre o ficheiro `supabase/add_email_notifications.sql`.
Adiciona a coluna `contact_email` e actualiza a função `approve_pharmacy_application`.

Para farmácias **já existentes** define o email manualmente:
```sql
UPDATE pharmacies SET contact_email = 'farmacia@exemplo.mz' WHERE id = 1;
```

## 3. Instalar a CLI do Supabase

```powershell
npm install -g supabase
supabase login
supabase link --project-ref yzqkicjpzngiwomltsjb
```

## 4. Configurar secrets

```powershell
supabase secrets set RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
supabase secrets set FROM_EMAIL="Vonamed <onboarding@resend.dev>"
supabase secrets set APP_URL=https://farma-pds.vercel.app
```

> Substitui `re_xxx...` pela tua chave Resend.
> `FROM_EMAIL` pode usar `onboarding@resend.dev` até teres domínio próprio.

## 5. Deploy da Edge Function

Na raiz do projeto:

```powershell
supabase functions deploy send-reservation-email --no-verify-jwt
```

A flag `--no-verify-jwt` permite que o webhook chame a função sem JWT (chamada vinda do próprio Supabase).

## 6. Criar o Database Webhook

No painel do Supabase:

1. **Database** → **Webhooks** → **Create a new hook**
2. Preenche:
   - **Name**: `reservation-emails`
   - **Table**: `reservations`
   - **Events**: ✅ Insert, ✅ Update
   - **Type**: HTTP Request
   - **HTTP Method**: POST
   - **URL**:
     ```
     https://yzqkicjpzngiwomltsjb.supabase.co/functions/v1/send-reservation-email
     ```
   - **Headers**: deixa o default (Content-Type: application/json)
3. **Create webhook**

## 7. Testar

1. Faz login como cliente
2. Cria uma reserva
3. Vê a tua caixa de entrada — deve chegar **"Reserva confirmada"** em segundos
4. A farmácia (se tiver contact_email definido) recebe **"Nova reserva recebida"**
5. Vai ao dashboard da farmácia, clica **Aprovar** → cliente recebe **"Pronta para levantamento"**

## Logs e debug

Para ver logs da Edge Function:
- Supabase Dashboard → **Edge Functions** → `send-reservation-email` → **Logs**

Erros comuns:
- `RESEND_API_KEY` não configurada → verifica `supabase secrets list`
- Email não chega → verifica a pasta de **Spam** (raro mas acontece com `onboarding@resend.dev`)
- Webhook não dispara → confirma que está activo em **Database → Webhooks**

## SMS (futuro)

Para SMS o caminho seria semelhante mas com **Twilio** ou **Africa's Talking**:
1. Conta no provider, comprar saldo
2. Adicionar coluna `phone` aos users e `contact_phone` à farmácia
3. Edge function chama API do provider em vez de Resend
4. Custo: ~5 MT por SMS

Não recomendo SMS para já — caro e a Resend basta para a maioria dos casos.
