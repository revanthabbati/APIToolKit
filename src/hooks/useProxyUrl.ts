import { useEffect, useState } from 'react'
import { loadProxyUrl, saveProxyUrl } from '../lib/storage'

export function useProxyUrl() {
  const [proxyUrl, setProxyUrl] = useState(() => loadProxyUrl())

  useEffect(() => {
    saveProxyUrl(proxyUrl)
  }, [proxyUrl])

  return { proxyUrl, setProxyUrl }
}
