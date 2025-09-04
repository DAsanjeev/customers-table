import { usePaginatedTable } from '@/hooks'

type Row = {
  id: string
  name: string
  email: string
  company: string
  status: 'active' | 'trial' | 'churned'
  createdAt: string
}

export default function CustomersTable() {
  const t = usePaginatedTable<Row>({
    endpoint: '/api/customers',
    parse: json => ({ items: json.items as Row[], total: json.total }),
    initialSort: { key: 'createdAt', dir: 'desc' },
  })

  return (
    <div className="mx-auto max-w-[900px] p-6 text-gray-900">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="h-9 w-64 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          placeholder="Search name/email/company"
          value={t.query}
          onChange={e => t.setQuery(e.target.value)}
        />
        <select
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          value={(t.filters.company as string) || ''}
          onChange={e => t.setFilter('company', e.target.value || undefined)}
        >
          <option value="">All companies</option>
          <option value="Analytica">Analytica</option>
          <option value="ByteForge">ByteForge</option>
          <option value="CloudNine">CloudNine</option>
          <option value="Delta Labs">Delta Labs</option>
          <option value="Epsilon">Epsilon</option>
        </select>
        <select
          className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          value={(t.filters.status as string) || ''}
          onChange={e => t.setFilter('status', e.target.value || undefined)}
        >
          <option value="">All statuses</option>
          <option value="active">active</option>
          <option value="trial">trial</option>
          <option value="churned">churned</option>
        </select>

        <button
          className="h-9 rounded-md border text-white border-gray-300 px-3 text-sm hover:text-black hover:bg-gray-50"
          onClick={() => t.clearFilters()}
        >
          Clear Filters
        </button>
      </div>

      {/* Table */}
      <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-gray-50 text-gray-700">
            <tr>
              {['name', 'email', 'company', 'status', 'createdAt'].map(col => (
                <Th
                  key={col}
                  col={col}
                  sort={t.sort}
                  onSort={k =>
                    t.setSort(
                      t.sort && t.sort.key === k
                        ? { key: k, dir: t.sort.dir === 'asc' ? 'desc' : 'asc' }
                        : { key: k, dir: 'asc' }
                    )
                  }
                />
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200">
            {t.loading ? (
              <tr>
                <td className="px-3 py-4 text-gray-600" colSpan={5}>
                  Loading…
                </td>
              </tr>
            ) : t.error ? (
              <tr>
                <td className="px-3 py-4 text-red-600" colSpan={5}>
                  Error: {String(t.error)}
                </td>
              </tr>
            ) : t.rows.length === 0 ? (
              <tr>
                <td className="px-3 py-4 text-gray-600" colSpan={5}>
                  No results
                </td>
              </tr>
            ) : (
              t.rows.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2">{r.name}</td>
                  <td className="px-3 py-2">{r.email}</td>
                  <td className="px-3 py-2">{r.company}</td>
                  <td className="px-3 py-2 capitalize">{r.status}</td>
                  <td className="px-3 py-2">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & page size */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            className="rounded-md border text-white border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 hover:text-black"
            disabled={t.page === 1}
            onClick={() => t.setPage(t.page - 1)}
          >
            Prev
          </button>

          <div className="flex items-center gap-1">
            {t.pageButtons(7).map((p, i) =>
              p === '…' ? (
                <span key={i} className="px-2 text-gray-500">
                  …
                </span>
              ) : (
                <button
                  key={i}
                  className={`rounded-md px-3  text-white py-1 text-sm ${
                    t.page === p
                      ? 'bg-indigo-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50 hover:text-black'
                  }`}
                  onClick={() => t.setPage(p as number)}
                  disabled={t.page === p}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            className="rounded-md border text-white border-gray-300 px-3 py-1 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 hover:text-black"
            disabled={t.page === t.totalPages}
            onClick={() => t.setPage(t.page + 1)}
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-white">Page size:</label>
          <select
            className="h-9 rounded-md border border-gray-300 bg-white px-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            value={t.pageSize}
            onChange={e => t.setPageSize(parseInt(e.target.value))}
          >
            {[10, 20, 50].map(n => (
              <option key={n} value={n}>
                {n}/page
              </option>
            ))}
          </select>
          <span className="text-sm text-white">{t.total} results</span>
        </div>
      </div>
    </div>
  )
}

function Th({
  col,
  sort,
  onSort,
}: {
  col: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sort: any
  onSort: (k: string) => void
}) {
  const dir = sort?.key === col ? sort.dir : undefined
  const aria = dir ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'
  return (
    <th
      scope="col"
      role="columnheader"
      aria-sort={aria as 'none' | 'ascending' | 'descending'}
      className="select-none border-b-2 border-gray-200 px-3 py-2 text-left font-semibold capitalize"
    >
      <button
        onClick={() => onSort(col)}
        className="inline-flex items-center gap-1"
      >
        {col}
        <span className="text-xs">
          {dir === 'asc' ? '▲' : dir === 'desc' ? '▼' : ''}
        </span>
      </button>
    </th>
  )
}
