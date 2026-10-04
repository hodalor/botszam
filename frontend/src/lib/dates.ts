const dateFormat = new Intl.DateTimeFormat('en-ZM', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFormat = new Intl.DateTimeFormat('en-ZM', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
})

/** "3 Oct 2026" */
export function formatDate(iso: string): string {
  return dateFormat.format(new Date(iso))
}

/** "3 Oct, 14:05" */
export function formatDateTime(iso: string): string {
  return dateTimeFormat.format(new Date(iso))
}
