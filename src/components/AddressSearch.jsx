import { useState, useRef, useEffect } from 'react'
import { Search, MapPin, Loader2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function AddressSearch({ onSelectLocation, placeholder = 'Pesquisar rua, bairro, zona...' }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const timeoutRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) {
      setResults([])
      setOpen(false)
      return
    }

    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query + ', Maputo, Mozambique')}&limit=5&addressdetails=1&viewbox=32.40,−25.90,32.65,−26.00&bounded=0`
        )
        const data = await res.json()
        setResults(data)
        setOpen(data.length > 0)
      } catch {
        setResults([])
      }
      setLoading(false)
    }, 400)

    return () => clearTimeout(timeoutRef.current)
  }, [query])

  const handleSelect = (item) => {
    const lat = parseFloat(item.lat)
    const lng = parseFloat(item.lon)
    onSelectLocation([lat, lng])
    setQuery(item.display_name.split(',').slice(0, 3).join(', '))
    setOpen(false)
  }

  const clear = () => {
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 shadow-sm focus-within:ring-2 focus-within:ring-brand-300 transition">
        {loading ? (
          <Loader2 className="w-4 h-4 text-slate-400 animate-spin shrink-0" />
        ) : (
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="flex-1 px-2.5 bg-transparent outline-none text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 min-w-0"
        />
        {query && (
          <button onClick={clear} className="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {results.map((item, i) => {
              const parts = item.display_name.split(', ')
              const title = parts.slice(0, 2).join(', ')
              const subtitle = parts.slice(2, 4).join(', ')

              return (
                <button
                  key={item.place_id || i}
                  onClick={() => handleSelect(item)}
                  className="w-full flex items-start gap-2.5 px-3.5 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition text-left border-b border-slate-100 dark:border-slate-800 last:border-0"
                >
                  <MapPin className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">{title}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{subtitle}</div>
                  </div>
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
