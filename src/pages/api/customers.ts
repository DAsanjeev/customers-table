import type { NextApiRequest, NextApiResponse } from 'next'

type Row = {
  id: string
  name: string
  email: string
  company: string
  status: 'active' | 'trial' | 'churned'
  createdAt: string
}

const COMPANIES = [
  'Analytica',
  'ByteForge',
  'CloudNine',
  'Delta Labs',
  'Epsilon',
]
const N = 500
const ROWS: Row[] = Array.from({ length: N }, (_, i) => ({
  id: `c_${String(i + 1).padStart(3, '0')}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  company: COMPANIES[i % COMPANIES.length],
  status: (['active', 'trial', 'churned'] as const)[i % 3],
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
}))

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // helper to read a query value that might be string | string[]
  const qval = (x: string | string[] | undefined, fallback = '') =>
    Array.isArray(x) ? x[0] ?? fallback : x ?? fallback

  const page = Math.max(1, parseInt(qval(req.query.page, '1'), 10))
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(qval(req.query.pageSize, '10'), 10))
  )
  const q = qval(req.query.q).toLowerCase()
  const sort = qval(req.query.sort) // e.g. "name:asc"

  // --- Parse filters[...] from flat query keys like "filters[status]" ---
  const filters: Record<string, string> = {}
  for (const [key, value] of Object.entries(req.query)) {
    const m = key.match(/^filters\[(.+)\]$/)
    if (m) filters[m[1]] = qval(value)
  }
  // ---------------------------------------------------------------------

  let data = ROWS.slice()

  // search
  if (q) {
    data = data.filter(
      r =>
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.company.toLowerCase().includes(q)
    )
  }

  // filters
  if (filters.status) data = data.filter(r => r.status === filters.status)
  if (filters.company) data = data.filter(r => r.company === filters.company)
  if (filters.createdAtFrom)
    data = data.filter(r => r.createdAt >= filters.createdAtFrom)
  if (filters.createdAtTo)
    data = data.filter(r => r.createdAt <= filters.createdAtTo)

  // sort
  if (sort) {
    const [field, dir] = sort.split(':')
    const sign = dir === 'desc' ? -1 : 1

    data.sort(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (a: any, b: any) =>
        (a[field] > b[field] ? 1 : a[field] < b[field] ? -1 : 0) * sign
    )
  }

  const total = data.length
  const start = (page - 1) * pageSize
  const items = data.slice(start, start + pageSize)

  res.status(200).json({ items, total, page, pageSize })
}
