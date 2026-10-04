import type { ReactNode } from 'react'
import { Button, Modal } from '@/components/ui'

interface ConfirmDialogProps {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'danger' | 'default'
  loading?: boolean
  onConfirm: () => void | Promise<void>
  children?: ReactNode
}

export function ConfirmDialog({
  open,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  loading,
  onConfirm,
  children,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={loading ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant="primary"
            className={tone === 'danger' ? 'bg-danger hover:bg-danger/90' : undefined}
            loading={loading}
            onClick={() => void onConfirm()}
          >
            {confirmLabel}
          </Button>
        </div>
      }
    >
      {children ? <div className="px-5 py-4 md:px-6">{children}</div> : <div className="px-5 py-2 md:px-6" />}
    </Modal>
  )
}
