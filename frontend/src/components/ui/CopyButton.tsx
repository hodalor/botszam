import { Check, Copy } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { cn } from '@/lib/cn'

async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Fallback for non-secure contexts (e.g. testing on a phone over the LAN).
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const ok = document.execCommand('copy')
  textarea.remove()
  if (!ok) throw new Error('Copy failed')
}

interface CopyButtonProps {
  value: string
  /** What is being copied, for screen readers, e.g. "MTN number". */
  label: string
  className?: string
}

export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)
  const timer = useRef<number>(undefined)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const onCopy = async () => {
    try {
      await copyText(value)
      setCopied(true)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy. Please select the text and copy it manually.')
    }
  }

  return (
    <button
      type="button"
      onClick={onCopy}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-medium transition-colors duration-200',
        copied
          ? 'border-success/30 bg-success-soft text-success'
          : 'border-charcoal/15 bg-cream text-charcoal hover:border-charcoal/30 hover:bg-white',
        className,
      )}
    >
      {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" strokeWidth={1.75} aria-hidden="true" />}
      <span aria-live="polite">{copied ? 'Copied' : 'Copy'}</span>
      <span className="sr-only"> {label}</span>
    </button>
  )
}
