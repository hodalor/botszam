import { usePublicSettings } from '@/api/store'
import { FALLBACK_CONTACT } from './constants'
import { toWhatsAppNumber } from './phone'

/** wa.me link to the store's WhatsApp number (from settings), with an optional prefilled message. */
export function useWhatsAppLink(message?: string): string | null {
  const { data: settings } = usePublicSettings()
  const number = toWhatsAppNumber(settings?.whatsappNumber || FALLBACK_CONTACT.whatsapp)
  if (!number) return null
  return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ''}`
}
