import { Search } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCategories } from '@/api/store'
import { Button, Input, Modal } from '@/components/ui'

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { data: categories = [] } = useCategories()

  const submit = (event: FormEvent) => {
    event.preventDefault()
    const q = query.trim()
    if (!q) return
    onClose()
    navigate(`/shop?search=${encodeURIComponent(q)}`)
  }

  return (
    <Modal open={open} onClose={onClose} title="Search the shop" initialFocusRef={inputRef}>
      <form role="search" onSubmit={submit} className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end md:p-6">
        <Input
          ref={inputRef}
          label="Search products"
          hideLabel
          type="search"
          name="search"
          placeholder="Bath sheet, hand towel, set…"
          leftIcon={<Search className="size-4" />}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
          autoComplete="off"
          enterKeyHint="search"
        />
        <Button type="submit" disabled={!query.trim()}>
          Search
        </Button>
      </form>
      <div className="px-5 pb-6 md:px-6">
        <p className="eyebrow mb-3">Browse collections</p>
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                to={`/shop/${c.slug}`}
                onClick={onClose}
                className="inline-block rounded-full border border-coral/25 bg-rose-soft px-3.5 py-1.5 text-sm text-charcoal-soft transition-colors hover:border-coral/50 hover:text-charcoal"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Modal>
  )
}
