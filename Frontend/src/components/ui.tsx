import type { ReactNode } from "react"

export type IconName =
  | "home"
  | "map"
  | "tractor"
  | "truck"
  | "box"
  | "wheat"
  | "file"
  | "invoice"
  | "scan"
  | "wallet"
  | "cheque"
  | "ledger"
  | "chart"
  | "users"
  | "search"
  | "bell"
  | "menu"
  | "plus"
  | "download"
  | "filter"
  | "more"
  | "arrow"
  | "calendar"
  | "check"
  | "warning"
  | "close"
  | "upload"
  | "eye"
  | "logout"
  | "mail"
  | "lock"

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7" />
        <path d="M5 9v11h14V9M9 20v-7h6v7" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3Z" />
        <path d="M9 3v15M15 6v15" />
      </>
    ),
    tractor: (
      <>
        <path d="M4 15h10l-2-5H7V5h5M14 12h3l2 3" />
        <circle cx="6" cy="17" r="3" />
        <circle cx="17" cy="17" r="2" />
        <path d="M8 7h5" />
      </>
    ),
    truck: (
      <>
        <path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" />
        <circle cx="7" cy="18" r="2" />
        <circle cx="18" cy="18" r="2" />
      </>
    ),
    box: (
      <>
        <path d="m4 7 8-4 8 4v10l-8 4-8-4Z" />
        <path d="m4 7 8 4 8-4M12 11v10" />
      </>
    ),
    wheat: (
      <>
        <path d="M12 21V8M8 5c2 0 4 2 4 4-2 0-4-2-4-4ZM16 3c-2 0-4 2-4 4 2 0 4-2 4-4ZM7 10c3 0 5 2 5 5-3 0-5-2-5-5ZM17 9c-3 0-5 2-5 5 3 0 5-2 5-5Z" />
      </>
    ),
    file: (
      <>
        <path d="M6 2h8l4 4v16H6z" />
        <path d="M14 2v5h5M9 12h6M9 16h6" />
      </>
    ),
    invoice: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    scan: (
      <>
        <path d="M3 8V4h4M17 4h4v4M21 16v4h-4M7 20H3v-4" />
        <path d="M7 9h10v7H7zM9 6h6" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 6h16v14H3z" />
        <path d="M3 9h16M15 13h6v4h-6z" />
      </>
    ),
    cheque: (
      <>
        <path d="M3 5h18v14H3zM3 9h18" />
        <path d="M7 14h4M15 14h2" />
      </>
    ),
    ledger: (
      <>
        <path d="M5 3h14v18H5zM9 3v18M12 8h4M12 12h4M12 16h3" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 20v-2c0-3 3-5 6-5s6 2 6 5v2M16 5a3 3 0 0 1 0 6M17 14c2 0 4 2 4 4v2" />
      </>
    ),
    search: (
      <>
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </>
    ),
    bell: (
      <>
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" />
      </>
    ),
    menu: (
      <>
        <path d="M4 6h16M4 12h16M4 18h16" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
      </>
    ),
    filter: (
      <>
        <path d="M3 5h18M6 12h12M10 19h4" />
      </>
    ),
    more: (
      <>
        <circle cx="5" cy="12" r="1" />
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
      </>
    ),
    arrow: (
      <>
        <path d="m9 18 6-6-6-6" />
      </>
    ),
    calendar: (
      <>
        <path d="M4 5h16v16H4zM8 3v4M16 3v4M4 10h16" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
    warning: (
      <>
        <path d="M12 3 2 21h20ZM12 9v5M12 18h.01" />
      </>
    ),
    close: (
      <>
        <path d="m5 5 14 14M19 5 5 19" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V3M7 8l5-5 5 5M4 21h16" />
      </>
    ),
    eye: (
      <>
        <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    logout: (
      <>
        <path d="M10 4H4v16h6M14 8l4 4-4 4M8 12h10" />
      </>
    ),
    mail: (
      <>
        <path d="M3 5h18v14H3z" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    lock: (
      <>
        <rect x="4" y="10" width="16" height="11" rx="1" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
      </>
    ),
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

export type BadgeTone = "success" | "danger" | "warning" | "neutral" | "info"

export function Badge({ tone = "neutral", children }: { tone?: BadgeTone; children: ReactNode }) {
  return (
    <span className={`badge ${tone}`}>
      <span className="badge-dot" />
      {children}
    </span>
  )
}

export function Button({
  children,
  variant = "primary",
  icon,
  onClick,
  disabled,
  type = "button",
  form,
}: {
  children: ReactNode
  variant?: "primary" | "secondary" | "danger" | "ghost"
  icon?: IconName
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
  form?: string
}) {
  return (
    <button className={`btn ${variant}`} onClick={onClick} disabled={disabled} type={type} form={form}>
      {icon && <Icon name={icon} size={16} />}
      {children}
    </button>
  )
}

export function PageHeader({
  eyebrow,
  title,
  subtitle,
  action,
  onAction,
  children,
}: {
  eyebrow?: string
  title: string
  subtitle: string
  action?: string
  onAction?: () => void
  children?: ReactNode
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {children}
        {action && (
          <Button icon="plus" onClick={onAction}>
            {action}
          </Button>
        )}
      </div>
    </div>
  )
}

export function Filters({
  search = "Buscar por nombre, número o CUIT...",
  extra = true,
  value,
  onChange,
}: {
  search?: string
  extra?: boolean
  value?: string
  onChange?: (v: string) => void
}) {
  return (
    <div className="filterbar">
      <label className="field-search">
        <Icon name="search" size={16} />
        <input
          placeholder={search}
          value={value ?? ""}
          onChange={(e) => onChange?.(e.target.value)}
        />
      </label>
      {extra && (
        <>
          <button className="selectlike">
            Estado: Todos <span>⌄</span>
          </button>
          <button className="selectlike">
            <Icon name="calendar" size={15} /> Últimos 30 días <span>⌄</span>
          </button>
        </>
      )}
    </div>
  )
}

export function Pagination({ total }: { total: string }) {
  return (
    <div className="pagination">
      <span>{total}</span>
      <div>
        <button disabled>‹</button>
        <button className="active">1</button>
        <button>›</button>
      </div>
    </div>
  )
}

export function Loading({ label = "Cargando información..." }: { label?: string }) {
  return <div className="page-state">{label}</div>
}

export function ErrorState({ error, onRetry }: { error: string; onRetry?: () => void }) {
  return (
    <div className="page-state error">
      <span>{error}</span>
      {onRetry && (
        <button className="btn secondary" onClick={onRetry}>
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({ label }: { label: string }) {
  return <div className="page-state">{label}</div>
}
