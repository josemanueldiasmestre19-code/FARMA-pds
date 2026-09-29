import { useEffect } from 'react'

const BASE = 'Vonamed'

// Título por página: "Pesquisar · Vonamed"
export default function usePageTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · ${BASE}` : `${BASE} — Encontre o seu medicamento em Maputo`
    return () => { document.title = `${BASE} — Encontre o seu medicamento em Maputo` }
  }, [title])
}
