import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const DataContext = createContext(null)

export function DataProvider({ children }) {
  const [medicines, setMedicines] = useState([])
  const [pharmacies, setPharmacies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const [medsRes, pharmsRes, stockRes] = await Promise.all([
        supabase.from('medicines').select('*').order('id'),
        supabase.from('pharmacies').select('*').order('id'),
        supabase.from('pharmacy_stock').select('*'),
      ])

      const meds = medsRes.data || []
      const pharms = pharmsRes.data || []
      const stocks = stockRes.data || []

      // Reconstruir o formato stock: { [medicine_id]: { available, qty } }
      const pharmaciesWithStock = pharms.map((p) => {
        const stock = {}
        stocks
          .filter((s) => s.pharmacy_id === p.id)
          .forEach((s) => {
            stock[s.medicine_id] = { available: s.available, qty: s.qty }
          })
        return {
          ...p,
          coords: [p.lat, p.lng],
          stock,
        }
      })

      setMedicines(meds)
      setPharmacies(pharmaciesWithStock)
      setLoading(false)
    }

    fetchData()
  }, [])

  return (
    <DataContext.Provider value={{ medicines, pharmacies, loading }}>
      {children}
    </DataContext.Provider>
  )
}

export const useData = () => useContext(DataContext)
