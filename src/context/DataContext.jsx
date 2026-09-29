import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase.js'
import { translateError } from '../lib/errors.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [medicines, setMedicines] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [medsRes, pharmsRes, stockRes] = await Promise.all([
        supabase.from('medicines').select('*').order('name'),
        supabase.from('pharmacies').select('*').order('id'),
        supabase.from('pharmacy_stock').select('*'),
      ])
      const failed = medsRes.error || pharmsRes.error || stockRes.error
      if (failed) throw failed

      const stocksByPharmacy = new Map()
      for (const s of stockRes.data || []) {
        if (!stocksByPharmacy.has(s.pharmacy_id)) stocksByPharmacy.set(s.pharmacy_id, {})
        stocksByPharmacy.get(s.pharmacy_id)[s.medicine_id] = { available: s.available, qty: s.qty }
      }
      setMedicines(medsRes.data || [])
      setPharmacies((pharmsRes.data || []).map((p) => ({
        ...p,
        coords: [p.lat, p.lng],
        stock: stocksByPharmacy.get(p.id) || {},
      })))
    } catch (e) {
      setError(translateError(e?.message))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    // Stock em tempo real (dashboard da farmácia ↔ pesquisa do cliente)
    const channel = supabase
      .channel('stock-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pharmacy_stock' }, (payload) => {
        const { pharmacy_id, medicine_id, available, qty } = payload.new
        setPharmacies((prev) =>
          prev.map((p) =>
            p.id === pharmacy_id ? { ...p, stock: { ...p.stock, [medicine_id]: { available, qty } } } : p
          )
        )
      })
      // Farmácias novas (aprovação de pedido) e alterações do admin
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pharmacies' }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'medicines' }, () => fetchData())
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  return (
    <DataContext.Provider value={{ medicines, pharmacies, loading, error, refetch: fetchData }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
