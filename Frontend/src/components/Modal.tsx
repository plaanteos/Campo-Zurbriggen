import type { ReactNode } from "react"
import { Button, Icon } from "./ui"

export function Modal({
  title,
  eyebrow = "NUEVO REGISTRO",
  onClose,
  children,
  footer,
  wide,
}: {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  wide?: boolean
}) {
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal" style={wide ? { width: "min(840px, calc(100vw - 30px))" } : undefined}>
        <div className="modal-head">
          <div>
            <span>{eyebrow}</span>
            <h2>{title}</h2>
          </div>
          <button onClick={onClose}>
            <Icon name="close" />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}

export function SuccessModal({
  onClose,
  title = "Registro guardado",
  text = "La información se incorporó correctamente al sistema.",
}: {
  onClose: () => void
  title?: string
  text?: string
}) {
  return (
    <div className="modal-backdrop">
      <div className="success-modal">
        <div>
          <Icon name="check" size={28} />
        </div>
        <h2>{title}</h2>
        <p>{text}</p>
        <Button onClick={onClose}>Continuar</Button>
      </div>
    </div>
  )
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return <div className="form-error">{error}</div>
}
