// Cálculo de comissão Vonamed por reserva
// Regras:
//   Até 100 MT        → 0 MT
//   101–500 MT        → 10 MT
//   501–1000 MT       → 25 MT
//   1001–2000 MT      → 75 MT
//   Acima de 2000 MT  → 5% do valor (máx. 300 MT)

export function calculateCommission(price) {
  const p = Number(price) || 0
  if (p <= 100) return 0
  if (p <= 500) return 10
  if (p <= 1000) return 25
  if (p <= 2000) return 75
  return Math.min(300, Math.round(p * 0.05))
}

export function calculateTotal(price) {
  const p = Number(price) || 0
  return p + calculateCommission(p)
}

export function formatMT(value) {
  const v = Math.round(Number(value) * 100) / 100
  return new Intl.NumberFormat('pt-PT', {
    minimumFractionDigits: v % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(v) + ' MT'
}
