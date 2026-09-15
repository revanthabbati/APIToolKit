import { useEffect, useState } from 'react'
import { loadTheme, saveTheme } from '../lib/storage'
import type { ThemePreference } from '../lib/storage'

function applyTheme(pref: ThemePreference) {
  const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', isDark)
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemePreference>(() => loadTheme())

  useEffect(() => {
    applyTheme(theme)
    saveTheme(theme)
    if (theme !== 'system') return
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => applyTheme('system')
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [theme])

  return { theme, setTheme }
}
