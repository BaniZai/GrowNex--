'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const ModalRootContext = createContext<HTMLElement | null>(null)

/* ---------- Tag ---------- */
export type Tone = 'red' | 'amber' | 'purple' | 'gray' | 'green' | 'dark' | 'blue'

const toneMap: Record<Tone, { box: string; dot: string }> = {
  red: { box: 'bg-[#fde8ec] text-[#b4233a]', dot: 'bg-[#d93a52]' },
  amber: { box: 'bg-[#fdf1c8] text-[#8f5400]', dot: 'bg-[#f0a31a]' },
  purple: { box: 'bg-[#ece6fb] text-[#5b2fc4]', dot: 'bg-[#6d3fd8]' },
  gray: { box: 'bg-[#f1eff7] text-[#625d7c]', dot: 'bg-[#a39fb8]' },
  green: { box: 'bg-[#dcf4e6] text-[#17704a]', dot: 'bg-[#25a56a]' },
  blue: { box: 'bg-[#e3effd] text-[#1e5aa8]', dot: 'bg-[#3b82d6]' },
  dark: { box: 'bg-ink text-white', dot: 'bg-white' },
}

export function Tag({
  tone = 'gray',
  dot = true,
  children,
  className,
}: {
  tone?: Tone
  dot?: boolean
  children: ReactNode
  className?: string
}) {
  const t = toneMap[tone]
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-medium',
        t.box,
        className,
      )}
    >
      {dot && <span aria-hidden className={cn('size-1.5 rounded-full', t.dot)} />}
      {children}
    </span>
  )
}

/** 标注"未实现 / 未接通 / 合成演示"的虚线标签,不只靠颜色表达。 */
export function FlagTag({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-full border border-dashed border-[#b9a6ee] bg-white/60 px-2.5 text-xs font-medium text-brand',
        className,
      )}
    >
      {children}
    </span>
  )
}

/* ---------- Card ---------- */
export function Card({
  className,
  children,
  as: As = 'section',
}: {
  className?: string
  children: ReactNode
  as?: 'section' | 'div' | 'article'
}) {
  return (
    <As className={cn('rounded-3xl border border-white bg-white shadow-card', className)}>{children}</As>
  )
}

export function CardHeader({
  title,
  sub,
  right,
  className,
}: {
  title: ReactNode
  sub?: ReactNode
  right?: ReactNode
  className?: string
}) {
  return (
    <header className={cn('flex items-start justify-between gap-4 px-6 pt-5', className)}>
      <div className="min-w-0">
        <h3 className="text-[15px] font-semibold leading-6 text-ink">{title}</h3>
        {sub && <p className="mt-0.5 text-[13px] leading-5 text-ink-mute">{sub}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </header>
  )
}

/* ---------- Buttons ---------- */
type BtnVariant = 'primary' | 'white' | 'dark' | 'danger' | 'soft' | 'ghost'

const btnVariant: Record<BtnVariant, string> = {
  primary: 'bg-brand text-white hover:bg-brand-600 shadow-[0_6px_16px_-8px_rgba(109,63,216,0.8)]',
  white: 'bg-white text-ink border border-line hover:bg-brand-50',
  dark: 'bg-ink text-white hover:bg-[#2b1c5c]',
  danger: 'bg-[#d93a52] text-white hover:bg-[#c02d44]',
  soft: 'bg-brand-50 text-brand hover:bg-brand-100',
  ghost: 'text-ink-soft hover:bg-brand-50 hover:text-brand',
}

export function Btn({
  variant = 'white',
  size = 'md',
  className,
  children,
  ...props
}: {
  variant?: BtnVariant
  size?: 'sm' | 'md'
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      {...props}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-45',
        size === 'md' ? 'h-9 px-4 text-[13px]' : 'h-7 px-3 text-xs',
        btnVariant[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}

/* ---------- Tabs ---------- */
export function PillTabs<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: T; label: string; count?: number | string }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div role="tablist" aria-label={label} className="flex flex-wrap items-center gap-2">
      {items.map((it) => {
        const active = it.id === value
        return (
          <button
            key={it.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={cn(
              'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-[13px] font-medium transition-colors',
              active
                ? 'border-ink bg-ink text-white'
                : 'border-line bg-white text-ink hover:bg-brand-50',
            )}
          >
            {it.label}
            {it.count !== undefined && (
              <span className={cn('text-xs', active ? 'text-white/70' : 'text-ink-mute')}>{it.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Page header ---------- */
export function PageHeader({
  crumb,
  title,
  badge,
  subtitle,
  actions,
}: {
  crumb?: ReactNode
  title: ReactNode
  badge?: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="min-w-0">
        {crumb && <div className="mb-1 text-[13px] text-ink-mute">{crumb}</div>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-balance text-[28px] font-semibold leading-9 tracking-tight text-ink">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="mt-1 text-[13px] leading-5 text-ink-soft">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}

/* ---------- Agent banner (深紫横幅) ---------- */
export function AgentBanner({
  eyebrow,
  children,
  action,
  icon,
}: {
  eyebrow: string
  children: ReactNode
  action?: ReactNode
  icon: ReactNode
}) {
  return (
    <div className="agent-banner flex items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-[0_14px_30px_-18px_rgba(42,22,112,0.9)]">
      <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#f4c6f0] to-[#a98af0] text-deep">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-white/60">{eyebrow}</p>
        <p className="text-[14px] leading-5">{children}</p>
      </div>
      {action}
    </div>
  )
}

/* ---------- Progress ---------- */
export function ProgressBar({
  value,
  tone = 'purple',
  indeterminate,
  label,
  className,
}: {
  value?: number
  tone?: 'purple' | 'red' | 'amber' | 'green'
  indeterminate?: boolean
  label: string
  className?: string
}) {
  const color = {
    purple: 'bg-brand',
    red: 'bg-[#d93a52]',
    amber: 'bg-[#f0a31a]',
    green: 'bg-[#25a56a]',
  }[tone]
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={indeterminate ? undefined : value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-[#ece8f6]', className)}
    >
      {indeterminate ? (
        <div className={cn('h-full w-2/5 animate-[slide_1.4s_ease-in-out_infinite] rounded-full', color)} />
      ) : (
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      )}
    </div>
  )
}

/* ---------- Ring loader (中央动态加载) ---------- */
export function RingLoader({ size = 56, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 50 50"
      aria-hidden
      className={cn('animate-spin [animation-duration:1.1s]', className)}
    >
      <defs>
        <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ee9be6" />
          <stop offset="100%" stopColor="#6d3fd8" />
        </linearGradient>
      </defs>
      <circle cx="25" cy="25" r="20" fill="none" stroke="#ece8f6" strokeWidth="5" />
      <circle
        cx="25"
        cy="25"
        r="20"
        fill="none"
        stroke="url(#ring-g)"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="34 120"
      />
    </svg>
  )
}

/* ---------- Checkbox (复选框与文字同行居中) ---------- */
export function Checkbox({
  checked,
  onChange,
  label,
  hideLabel,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hideLabel?: boolean
  disabled?: boolean
}) {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2 text-[13px] leading-none text-ink',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className={cn(
          'grid size-[18px] shrink-0 place-items-center rounded-md border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-brand',
          checked ? 'border-brand bg-brand text-white' : 'border-[#cfc7e6] bg-white',
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className={hideLabel ? 'sr-only' : ''}>{label}</span>
    </label>
  )
}

/* ---------- Segmented ---------- */
export function Segmented<T extends string>({
  items,
  value,
  onChange,
  label,
}: {
  items: { id: T; label: ReactNode }[]
  value: T
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex rounded-full bg-[#f1edfa] p-1 shadow-[inset_0_0_0_1px_rgba(109,63,216,0.06)]"
    >
      {items.map((it) => {
        const active = it.id === value
        return (
          <button
            key={it.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(it.id)}
            className={cn(
              'flex h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-all',
              active ? 'bg-white text-ink shadow-[0_2px_8px_-2px_rgba(60,30,120,0.2)]' : 'text-ink-soft hover:text-ink',
            )}
          >
            {it.label}
          </button>
        )
      })}
    </div>
  )
}

/* ---------- Modal (渲染在应用框架内) ---------- */
export function Modal({
  open,
  onClose,
  titleId,
  children,
  width = 'max-w-[560px]',
  closable = true,
}: {
  open: boolean
  onClose: () => void
  titleId: string
  children: ReactNode
  width?: string
  closable?: boolean
}) {
  const root = useContext(ModalRootContext)

  useEffect(() => {
    if (!open || !closable) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose, closable])

  if (!open || !root) return null
  return createPortal(
    <div className="pointer-events-auto absolute inset-0 z-50 flex items-center justify-center bg-[#2a1670]/25 p-6 backdrop-blur-[6px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          'max-h-full w-full overflow-y-auto rounded-[28px] border border-white bg-white shadow-[0_30px_80px_-20px_rgba(42,22,112,0.5)]',
          width,
        )}
      >
        {children}
      </div>
    </div>,
    root,
  )
}

export function ModalHeader({
  id,
  icon,
  title,
  sub,
  onClose,
}: {
  id: string
  icon: ReactNode
  title: ReactNode
  sub?: ReactNode
  onClose?: () => void
}) {
  return (
    <div className="flex items-start gap-4 border-b border-line px-7 pb-5 pt-6">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-brand-50 text-brand">{icon}</div>
      <div className="min-w-0 flex-1">
        <h2 id={id} className="text-[19px] font-semibold leading-7 text-ink">
          {title}
        </h2>
        {sub && <p className="mt-0.5 text-[13px] leading-5 text-ink-mute">{sub}</p>}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-50 text-ink-soft hover:bg-brand-100"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/* ---------- Toast ---------- */
export function Toast({
  show,
  title,
  body,
  icon,
  onClose,
}: {
  show: boolean
  title: string
  body?: string
  icon?: ReactNode
  onClose?: () => void
}) {
  if (!show) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-24 left-1/2 z-[60] flex w-[min(92vw,460px)] -translate-x-1/2 items-center gap-3 rounded-2xl bg-[#241160] px-4 py-3 text-white shadow-[0_20px_50px_-16px_rgba(36,17,96,0.8)] animate-in fade-in slide-in-from-bottom-2"
    >
      <div className="grid size-8 shrink-0 place-items-center rounded-full bg-white/10">
        {icon ?? <Check className="size-4" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-5">{title}</p>
        {body && <p className="text-xs leading-4 text-white/70">{body}</p>}
      </div>
      {onClose && (
        <button type="button" onClick={onClose} aria-label="关闭提示" className="rounded-full p-1 text-white/70 hover:bg-white/10">
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}

/* ---------- Misc ---------- */
export function SectionLabel({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p className={cn('text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute', className)}>{children}</p>
  )
}

export function KV({ k, v, tone }: { k: string; v: ReactNode; tone?: 'green' | 'red' | 'amber' }) {
  const color = tone === 'green' ? 'text-[#17704a]' : tone === 'red' ? 'text-[#b4233a]' : tone === 'amber' ? 'text-[#8f5400]' : 'text-ink'
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-2.5 text-[13px] last:border-b-0">
      <dt className="text-ink-soft">{k}</dt>
      <dd className={cn('min-w-0 text-right font-medium', color)}>{v}</dd>
    </div>
  )
}

export function LinkArrow({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 text-[13px] font-semibold text-brand hover:text-brand-600"
    >
      {children}
      <ChevronRight className="size-4" />
    </button>
  )
}

export function Notice({
  tone = 'purple',
  icon,
  children,
  className,
}: {
  tone?: 'purple' | 'amber' | 'red' | 'green'
  icon: ReactNode
  children: ReactNode
  className?: string
}) {
  const map = {
    purple: 'bg-brand-50 text-[#43249f]',
    amber: 'bg-[#fff6dc] text-[#7a4a00]',
    red: 'bg-[#fdecef] text-[#a31f35]',
    green: 'bg-[#e4f6ec] text-[#14623f]',
  }
  return (
    <div className={cn('flex items-start gap-3 rounded-2xl px-4 py-3 text-[13px] leading-5', map[tone], className)}>
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}
