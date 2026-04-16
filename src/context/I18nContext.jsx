import { createContext, useContext, useState, useEffect } from 'react'
import { translations } from '../lib/translations.js'

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const stored = localStorage.getItem('vonamed_lang')
    if (stored && translations[stored]) return stored
    const browserLang = navigator.language.split('-')[0]
    return translations[browserLang] ? browserLang : 'pt'
  })

  useEffect(() => {
    localStorage.setItem('vonamed_lang', lang)
    document.documentElement.lang = lang
  }, [lang])

  const t = (key) => translations[lang]?.[key] || translations.pt[key] || key

  const toggleLang = () => setLang((l) => (l === 'pt' ? 'en' : 'pt'))

  return (
    <I18nContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export const useI18n = () => useContext(I18nContext)
