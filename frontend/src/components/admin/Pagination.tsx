import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui'

interface PaginationProps {
  page: number
  totalPages: number
  total?: number
  onChange: (page: number) => void
}

export function Pagination({ page, totalPages, total, onChange }: PaginationProps) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between gap-3 pt-4">
      <p className="text-xs text-stone">
        Page {page} of {totalPages}
        {typeof total === 'number' ? ` · ${total} total` : ''}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
          <span className="hidden sm:inline">Prev</span>
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          aria-label="Next page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
