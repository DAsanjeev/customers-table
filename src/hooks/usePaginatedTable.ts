import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

export type Sort = { key: string; dir: 'asc' | 'desc' } | null
export type Filters = Record<string, unknown>

export type Config<T> = {
  endpoint: string
  initialPage?: number
  initialPageSize?: number
  initialQuery?: string
  initialSort?: Sort
  initialFilters?: Filters
  // map server response to { items, total }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  parse: (json: any) => { items: T[]; total: number }
  // build query params from state
  buildParams?: (s: State) => URLSearchParams
  debounceMs?: number
}

export type State = {
  page: number
  pageSize: number
  query: string
  sort: Sort
  filters: Filters
}

type Result<T> = State & {
  rows: T[]
  total: number
  totalPages: number
  loading: boolean
  error: unknown
  setPage: (n: number) => void
  setPageSize: (n: number) => void
  setQuery: (q: string) => void
  setSort: (s: Sort) => void
  setFilter: (key: string, value: unknown) => void
  clearFilters: () => void
  refresh: () => void
  pageButtons: (max?: number) => (number | '…')[]
}

export function usePaginatedTable<T>(cfg: Config<T>): Result<T> {
  const {
    endpoint,
    initialPage = 1,
    initialPageSize = 10,
    initialQuery = '',
    initialSort = null,
    initialFilters = {},
    parse,
    buildParams,
    debounceMs = 300,
  } = cfg

  // 1) init from URL
  const urlInit = useMemo(
    () =>
      readFromUrl({
        page: initialPage,
        pageSize: initialPageSize,
        query: initialQuery,
        sort: initialSort,
        filters: initialFilters,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  )

  const [page, setPage] = useState(urlInit.page)
  const [pageSize, setPageSize] = useState(urlInit.pageSize)
  const [query, setQueryState] = useState(urlInit.query)
  const [sort, setSort] = useState<Sort>(urlInit.sort)
  const [filters, setFilters] = useState<Filters>(urlInit.filters)

  const [rows, setRows] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<unknown>(null)

  // 2) debounced query
  const debouncedQuery = useDebounce(query, debounceMs)

  // 3) URL sync (client-side only)
  useEffect(() => {
    writeToUrl({ page, pageSize, query, sort, filters })
  }, [page, pageSize, query, sort, filters])

  // 4) fetch with AbortController + latest-wins guard
  const latest = useRef(0)
  const refresh = useCallback(() => {
    const id = ++latest.current
    const ac = new AbortController()
    setLoading(true)
    setError(null)

    const params = buildParams
      ? buildParams({ page, pageSize, query: debouncedQuery, sort, filters })
      : defaultParams({ page, pageSize, query: debouncedQuery, sort, filters })

    fetch(`${endpoint}?${params}`, { signal: ac.signal })
      .then(r => {
        if (!r.ok) throw new Error(r.statusText)
        return r.json()
      })
      .then(json => {
        if (id !== latest.current) return // stale
        const { items, total } = parse(json)
        setRows(items)
        setTotal(total)
      })
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .catch((e: any) => {
        if (id === latest.current && e.name !== 'AbortError') setError(e)
      })
      .finally(() => {
        if (id === latest.current) setLoading(false)
      })

    return () => ac.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint, page, pageSize, debouncedQuery, sort, JSON.stringify(filters)])

  useEffect(() => {
    return refresh()
  }, [refresh])

  const setQuery = useCallback((q: string) => {
    setQueryState(q)
    setPage(1)
  }, [])

  const setFilter = useCallback((k: string, v: unknown) => {
    setFilters(f => ({ ...f, [k]: v }))
    setPage(1)
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPage(1)
  }, [])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const pageButtons = useCallback(
    (max: number = 7) => makePageButtons(page, totalPages, max),
    [page, totalPages]
  )

  return {
    page,
    pageSize,
    total,
    totalPages,
    query,
    setQuery,
    sort,
    setSort,
    filters,
    setFilter,
    clearFilters,
    rows,
    loading,
    error,
    setPage,
    setPageSize,
    refresh,
    pageButtons,
  }
}

// helpers -------------------------------------------------
function defaultParams(s: State) {
  const p = new URLSearchParams()
  p.set('page', String(s.page))
  p.set('pageSize', String(s.pageSize))
  if (s.query) p.set('q', s.query)
  if (s.sort) p.set('sort', `${s.sort.key}:${s.sort.dir}`)
  Object.entries(s.filters).forEach(([k, v]) => {
    if (v != null && v !== '') p.set(`filters[${k}]`, String(v))
  })
  return p
}

function useDebounce<T>(value: T, delay: number) {
  const [v, setV] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return v
}

function readFromUrl(fallback: State): State {
  if (typeof window === 'undefined') return fallback
  const u = new URL(window.location.href)
  const q = u.searchParams
  const page = parseInt(q.get('page') || '') || fallback.page
  const pageSize = parseInt(q.get('pageSize') || '') || fallback.pageSize
  const query = q.get('q') ?? fallback.query
  const sortParam = q.get('sort')
  const sort = sortParam
    ? {
        key: sortParam.split(':')[0],
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dir: (sortParam.split(':')[1] as any) || 'asc',
      }
    : fallback.sort
  const filters: Filters = { ...fallback.filters }
  q.forEach((val, key) => {
    const m = key.match(/^filters\[(.+)\]$/)
    if (m) filters[m[1]] = val
  })
  return { page, pageSize, query, sort, filters }
}

function writeToUrl(s: State) {
  if (typeof window === 'undefined') return
  const p = defaultParams(s)
  const url = `${window.location.pathname}?${p.toString()}`
  window.history.replaceState({}, '', url)
}

export function makePageButtons(
  curr: number,
  total: number,
  max: number
): (number | '…')[] {
  if (total <= max) return Array.from({ length: total }, (_, i) => i + 1)
  const out: (number | '…')[] = []
  const left = Math.max(1, curr - 1)
  const right = Math.min(total, curr + 1)
  const add = (n: number | '…') => {
    if (out[out.length - 1] !== n) out.push(n)
  }
  add(1)
  if (left > 2) add('…')
  for (let i = left; i <= right; i++) add(i)
  if (right < total - 1) add('…')
  add(total)
  return out
}
