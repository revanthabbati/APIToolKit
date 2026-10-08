import { useEffect, useState } from 'react'
import { createPaginationConfig } from '../lib/paginationFactory'
import type { PaginationConfig } from '../lib/paginationTypes'
import { loadPaginationState, savePaginationState } from '../lib/storage'

function initialState() {
  const stored = loadPaginationState()
  if (stored && stored.configs.length > 0) {
    const selectedId = stored.configs.some((c) => c.id === stored.selectedId) ? stored.selectedId : stored.configs[0].id
    return { configs: stored.configs, selectedId }
  }
  const first = createPaginationConfig()
  return { configs: [first], selectedId: first.id }
}

export function usePaginationConfigs() {
  const [state, setState] = useState(initialState)

  useEffect(() => {
    savePaginationState(state)
  }, [state])

  const selected = state.configs.find((c) => c.id === state.selectedId) ?? state.configs[0]

  function select(id: string) {
    setState((prev) => ({ ...prev, selectedId: id }))
  }

  function update(config: PaginationConfig) {
    setState((prev) => ({ ...prev, configs: prev.configs.map((c) => (c.id === config.id ? config : c)) }))
  }

  function create() {
    const config = createPaginationConfig()
    setState((prev) => ({ configs: [...prev.configs, config], selectedId: config.id }))
  }

  function duplicate(id: string) {
    setState((prev) => {
      const source = prev.configs.find((c) => c.id === id)
      if (!source) return prev
      const copy = { ...structuredClone(source), id: crypto.randomUUID(), name: `${source.name} (copy)` }
      return { configs: [...prev.configs, copy], selectedId: copy.id }
    })
  }

  function remove(id: string) {
    setState((prev) => {
      const remaining = prev.configs.filter((c) => c.id !== id)
      if (remaining.length === 0) {
        const fresh = createPaginationConfig()
        return { configs: [fresh], selectedId: fresh.id }
      }
      const selectedId = prev.selectedId === id ? remaining[0].id : prev.selectedId
      return { configs: remaining, selectedId }
    })
  }

  return { configs: state.configs, selected, select, update, create, duplicate, remove }
}
