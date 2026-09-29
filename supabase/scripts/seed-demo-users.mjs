// Cria (ou repõe a password de) as contas de demonstração via Auth Admin API.
// Correr ANTES de supabase/seed.sql. Nunca commitar a service key.
//
//   SUPABASE_SERVICE_ROLE_KEY=... node supabase/scripts/seed-demo-users.mjs
//
// A service key obtém-se com:  supabase projects api-keys --project-ref <ref>

const URL = process.env.SUPABASE_URL || 'https://yzqkicjpzngiwomltsjb.supabase.co'
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!KEY) {
  console.error('Falta SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

export const DEMO_PASSWORD = 'Demo2026!'
export const DEMO_USERS = [
  { email: 'cliente.demo@vonamed.mz', name: 'Ana Macuácua' },
  { email: 'cliente2.demo@vonamed.mz', name: 'Carlos Tembe' },
  { email: 'farmacia.demo@vonamed.mz', name: 'Farmácia Polana' },
  { email: 'pendente.demo@vonamed.mz', name: 'Sérgio Nhantumbo' },
  { email: 'pendente2.demo@vonamed.mz', name: 'Lurdes Cossa' },
  { email: 'admin.demo@vonamed.mz', name: 'Admin Vonamed' },
]

const headers = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }

async function findByEmail(email) {
  const res = await fetch(`${URL}/auth/v1/admin/users?page=1&per_page=1000`, { headers })
  const { users } = await res.json()
  return users?.find((u) => u.email === email)
}

for (const u of DEMO_USERS) {
  const existing = await findByEmail(u.email)
  const body = JSON.stringify({
    email: u.email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name: u.name },
  })
  const res = existing
    ? await fetch(`${URL}/auth/v1/admin/users/${existing.id}`, { method: 'PUT', headers, body })
    : await fetch(`${URL}/auth/v1/admin/users`, { method: 'POST', headers, body })
  const json = await res.json()
  if (!res.ok) {
    console.error(`✗ ${u.email}:`, json.msg || json.message || json)
    process.exit(1)
  }
  console.log(`${existing ? '↻' : '+'} ${u.email} (${json.id})`)
}
console.log('Contas prontas. Agora: supabase db query --linked -f supabase/seed.sql')
