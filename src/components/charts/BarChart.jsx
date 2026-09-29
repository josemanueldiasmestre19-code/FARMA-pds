import { useState } from 'react'

// Gráfico de barras de série única, em SVG inline.
// - marcas finas com topo arredondado ancoradas na base
// - grelha recessiva, uma só escala
// - tooltip por barra (hover/focus) e tabela acessível equivalente
export default function BarChart({
  data,              // [{ label, value, hint? }]
  format = (v) => v, // formatação do valor
  color = '#059669',
  height = 180,
  title,
}) {
  const [active, setActive] = useState(null)
  const W = 600
  const H = height
  const padL = 36, padR = 8, padT = 12, padB = 26
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const max = Math.max(1, ...data.map((d) => d.value))
  const nice = niceMax(max)
  const slot = innerW / Math.max(1, data.length)
  const barW = Math.min(28, slot * 0.6)
  const ticks = [0, 0.5, 1].map((f) => nice * f)
  const every = data.length > 10 ? Math.ceil(data.length / 7) : 1

  return (
    <figure className="m-0">
      {title && <figcaption className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">{title}</figcaption>}
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={title}>
          {ticks.map((tv) => {
            const y = padT + innerH - (tv / nice) * innerH
            return (
              <g key={tv}>
                <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" />
                <text x={padL - 6} y={y + 3} textAnchor="end" fontSize="9" fill="currentColor" fillOpacity="0.5">{shortNum(tv)}</text>
              </g>
            )
          })}
          {data.map((d, i) => {
            const h = (d.value / nice) * innerH
            const x = padL + i * slot + (slot - barW) / 2
            const y = padT + innerH - h
            const isActive = active === i
            return (
              <g key={d.label}
                 onMouseEnter={() => setActive(i)} onMouseLeave={() => setActive(null)}
                 onFocus={() => setActive(i)} onBlur={() => setActive(null)} tabIndex={0}
                 className="outline-none">
                {/* alvo de hover maior que a barra */}
                <rect x={padL + i * slot} y={padT} width={slot} height={innerH} fill="transparent" />
                {h > 0 ? (
                  <path
                    d={`M${x},${padT + innerH} v${-(h - Math.min(4, h))} q0,-${Math.min(4, h)} 4,-${Math.min(4, h)} h${barW - 8} q4,0 4,${Math.min(4, h)} v${h - Math.min(4, h)} z`}
                    fill={color} fillOpacity={isActive ? 1 : 0.85}
                  />
                ) : (
                  <rect x={x} y={padT + innerH - 1} width={barW} height={1} fill={color} fillOpacity="0.3" />
                )}
                {i % every === 0 && (
                  <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="9" fill="currentColor" fillOpacity="0.6">{d.label}</text>
                )}
              </g>
            )
          })}
        </svg>
        {active != null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute -top-1 bg-slate-900 text-white text-xs rounded-lg px-2.5 py-1.5 shadow-lg whitespace-nowrap"
            style={{ left: `${((padL + active * slot + slot / 2) / W) * 100}%`, transform: 'translate(-50%, -100%)' }}
          >
            <div className="opacity-70">{data[active].hint || data[active].label}</div>
            <div className="font-bold tabular-nums">{format(data[active].value)}</div>
          </div>
        )}
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead><tr><th>Dia</th><th>Valor</th></tr></thead>
        <tbody>{data.map((d) => <tr key={d.label}><td>{d.hint || d.label}</td><td>{format(d.value)}</td></tr>)}</tbody>
      </table>
    </figure>
  )
}

function niceMax(v) {
  if (v <= 5) return 5
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  const m = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return m * p
}

function shortNum(v) {
  if (v >= 1000) return `${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}k`
  return String(Math.round(v))
}
