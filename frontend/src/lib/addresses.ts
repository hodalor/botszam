import type { Address } from '@/api/types'

/** The API replaces the whole address list on update, so existing entries are sent back without their ids. */
export function toAddressInput({ label, zone, area, street, landmark, notes, isDefault }: Address): Omit<Address, '_id'> {
  return { label, zone, area, street, landmark, notes, isDefault }
}
