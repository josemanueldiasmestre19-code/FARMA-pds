// Formatação consistente para Moçambique: moeda (MT), datas (pt-MZ), telefones (+258)

const LOCALE = 'pt-MZ'

export function formatMT(value) {
  const v = Math.round((Number(value) || 0) * 100) / 100
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v) + ' MT'
}

export function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function formatDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(LOCALE, {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

export function formatShortDateTime(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(LOCALE, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatMonthYear(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(LOCALE, { month: 'long', year: 'numeric' })
}

// "841234567" | "+258841234567" | "84 123 4567" → "+258 84 123 4567"
export function formatPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').replace(/^258/, '')
  if (digits.length !== 9) return raw || ''
  return `+258 ${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5)}`
}

// Devolve os 9 dígitos nacionais ou null se inválido (8X XXX XXXX)
export function parseMzPhone(raw) {
  const digits = String(raw || '').replace(/\D/g, '').replace(/^258/, '')
  return /^8[2-7]\d{7}$/.test(digits) ? digits : null
}

// Prefixos por operadora (para validar o método de pagamento)
export const PHONE_NETWORK = {
  84: 'mpesa', 85: 'mpesa',   // Vodacom
  86: 'emola', 87: 'emola',   // Movitel
  82: 'mkesh', 83: 'mkesh',   // Tmcel
}

// Pesquisa tolerante a acentos e maiúsculas
export function normalize(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

export function shortId(uuid) {
  return String(uuid || '').slice(0, 8).toUpperCase()
}
