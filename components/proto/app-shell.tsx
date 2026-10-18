'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Activity, Bell, ChevronLeft, ChevronRight, Clock3, WifiOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModalRootContext } from './ui'
import { SCREENS, useStore, type ScreenId } from './store'
import { compactTokens, useTokens } from './tokens'
import { TokenTicker } from './token-ticker'
import { TokenPanel } from './token-panel'

type NavItem = {
  label: string
  target: ScreenId
  match: ScreenId[]
  badge?: number
}

const NAV: NavItem[] = [
  { label: '任务工作台', target: 1, match: [1] },
  { label: '元数据治理', target: 3, match: [2, 3, 4, 5], badge: 2 },
  { label: '数据开发', target: 7, match: [7, 8], badge: 1 },
  { label: '制度解读', target: 9, match: [9] },
  { label: '标准库', target: 6, match: [6] },
]

const statusDot: Record<string, string> = {
  review: 'bg-[#e5a400]',
  confirm: 'bg-[#e5a400]',
  done: 'bg-[#25a56a]',
  running: 'bg-sun',
  failed: 'bg-[#e8657a]',
}

function NavPill({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'relative inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-[13px] font-medium transition-all duration-200',
        active ? 'bg-ink text-white shadow-[0_8px_18px_-8px_rgb(var(--ink-rgb)/0.7)]' : 'text-ink-soft hover:bg-white/80 hover:text-ink',
      )}
    >
      {item.label}
      {item.badge ? (
        <span
          className={cn(
            'grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] font-bold tabular-nums',
            active ? 'grad-fire' : 'bg-ink text-white',
          )}
        >
          {item.badge}
        </span>
      ) : null}
    </button>
  )
}

function RecentsMenu() {
  const { go, recents } = useStore()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="最近任务"
        className="relative grid size-10 place-items-center rounded-full bg-white/80 text-ink shadow-[inset_0_0_0_1px_rgba(255,255,255,0.9)] transition-colors hover:bg-white"
      >
        <Clock3 className="size-[18px]" />
        {recents.length > 0 && <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-sun ring-2 ring-white" />}
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 w-[280px] rounded-3xl border border-white bg-white p-2 shadow-lift animate-in fade-in slide-in-from-top-1"
        >
          <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-mute">最近任务</p>
          {recents.length === 0 ? (
            <p className="px-3 pb-3 text-xs leading-5 text-ink-mute">暂无最近任务</p>
          ) : (
            <ul>
              {recents.slice(0, 5).map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false)
                      go(1)
                    }}
                    title={r.title}
                    className="flex h-10 w-full items-center gap-2.5 rounded-2xl px-3 text-left text-[13px] text-ink hover:bg-brand-50"
                  >
                    <span aria-hidden className={cn('size-2 shrink-0 rounded-full', statusDot[r.status])} />
                    <span className="min-w-0 flex-1 truncate">{r.title}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function AvatarMenu() {
  const { screen, go } = useStore()
  const { today, active, openPanel } = useTokens()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onSettings = screen === 10

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="个人菜单"
        className={cn(
          'grid size-10 place-items-center rounded-full bg-ink text-[13px] font-semibold text-glow transition-shadow',
          (open || onSettings) && 'ring-2 ring-ink/30 ring-offset-2 ring-offset-white',
        )}
      >
        林
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-12 z-30 w-[248px] rounded-3xl border border-white bg-white p-2 shadow-lift animate-in fade-in slide-in-from-top-1"
        >
          <div className="px-3 pb-2 pt-2.5">
            <p className="text-[14px] font-semibold text-ink">林工</p>
            <p className="text-xs text-ink-mute">元数据治理组</p>
          </div>
          <div className="mx-2 border-t border-line" />
          <button
            type="button"
            role="menuitem"
            aria-current={onSettings ? 'page' : undefined}
            onClick={() => {
              setOpen(false)
              go(10)
            }}
            className={cn(
              'mt-1 flex w-full flex-col rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-brand-50',
              onSettings && 'bg-brand-50',
            )}
          >
            <span className="text-[13px] font-medium text-ink">模型设置</span>
            <span className="text-xs text-ink-mute">当前为本地规则模式</span>
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              openPanel()
            }}
            className="flex w-full flex-col rounded-2xl px-3 py-2.5 text-left transition-colors hover:bg-brand-50"
          >
            <span className="flex items-center gap-1.5 text-[13px] font-medium text-ink">
              <Activity aria-hidden className="size-3.5" />
              Token 用量
              {active ? <span aria-hidden className="size-1.5 animate-pulse rounded-full bg-sun" /> : null}
            </span>
            <span className="text-xs tabular-nums text-ink-mute">
              今日 {compactTokens(today.input + today.output)} · 输入 {compactTokens(today.input)} · 输出 {compactTokens(today.output)}
            </span>
          </button>
        </div>
      )}
    </div>
  )
}

function TopBar() {
  const { screen, go } = useStore()
  return (
    <header className="flex shrink-0 items-center gap-4 px-7 pb-2 pt-6">
      <button
        type="button"
        onClick={() => go(1)}
        aria-label="GrowNex | 数源 首页"
        className="flex h-11 shrink-0 items-center rounded-full border border-ink/70 bg-white/50 px-5 transition-colors hover:bg-white/90"
      >
        <span className="text-[16px] font-semibold tracking-tight text-ink">GrowNex | 数源</span>
      </button>

      <nav
        aria-label="主导航"
        className="mx-auto flex h-11 min-w-0 shrink items-center gap-0.5 rounded-full bg-white/55 p-1 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.85)] backdrop-blur"
      >
        {NAV.map((it) => (
          <NavPill key={it.label} item={it} active={it.match.includes(screen)} onClick={() => go(it.target)} />
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-2">
        <div
          className="hidden h-10 items-center gap-2 rounded-full bg-white/80 px-3.5 text-[12px] font-medium text-ink xl:flex"
          title="资料仅在本机处理,不上传云端"
        >
          <WifiOff className="size-3.5 text-ink-soft" />
          私有化模式
          <span className="size-1.5 rounded-full bg-[#25a56a]" />
        </div>
        <TokenTicker />
        <RecentsMenu />
        <button
          type="button"
          aria-label="通知"
          className="relative grid size-10 place-items-center rounded-full bg-white/80 text-ink transition-colors hover:bg-white"
        >
          <Bell className="size-[18px]" />
        </button>
        <AvatarMenu />
      </div>
    </header>
  )
}

function Switcher() {
  const { screen, go } = useStore()
  const cur = SCREENS.find((s) => s.id === screen)!
  const prev = () => go((screen === 1 ? 10 : screen - 1) as ScreenId)
  const next = () => go((screen === 10 ? 1 : screen + 1) as ScreenId)
  return (
    <nav
      aria-label="原型页面切换"
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/85 p-1.5 shadow-[0_16px_40px_-14px_rgba(23,23,26,0.45)] backdrop-blur-xl"
    >
      <button
        type="button"
        onClick={prev}
        aria-label="上一张原型"
        className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-brand-50"
      >
        <ChevronLeft className="size-4" />
      </button>
      <ol className="flex items-center gap-1">
        {SCREENS.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => go(s.id)}
              title={`${String(s.id).padStart(2, '0')} ${s.title}`}
              aria-label={`第 ${s.id} 张:${s.title}`}
              aria-current={s.id === screen ? 'page' : undefined}
              className={cn(
                'grid size-9 place-items-center rounded-full text-[13px] font-semibold tabular-nums transition-colors',
                s.id === screen ? 'bg-ink text-glow' : 'text-ink-soft hover:bg-brand-50',
              )}
            >
              {String(s.id).padStart(2, '0')}
            </button>
          </li>
        ))}
      </ol>
      <div className="hidden min-w-[150px] border-l border-line px-3 text-left md:block">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-mute">{cur.group}</p>
        <p className="text-[13px] font-semibold leading-4 text-ink">{cur.title}</p>
      </div>
      <button
        type="button"
        onClick={next}
        aria-label="下一张原型"
        className="grid size-9 place-items-center rounded-full text-ink-soft hover:bg-brand-50"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

export function AppShell({ children }: { children: ReactNode }) {
  const [root, setRoot] = useState<HTMLElement | null>(null)
  const { screen } = useStore()
  const scroller = useRef<HTMLElement>(null)

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 })
  }, [screen])

  return (
    <div className="stage-bg min-h-svh overflow-x-auto p-4 pb-[88px] md:p-6 md:pb-[96px]">
      <div
        ref={setRoot}
        className="frame-bg relative mx-auto flex h-[calc(100svh-136px)] min-h-[640px] min-w-[1040px] max-w-[1560px] flex-col overflow-hidden rounded-[40px] border border-white/70 shadow-[0_40px_90px_-30px_rgba(23,23,26,0.55)]"
      >
        <ModalRootContext.Provider value={root}>
          <TopBar />
          <main
            id="main"
            ref={scroller}
            key={screen}
            className="scroll-thin min-h-0 flex-1 overflow-y-auto px-7 pb-10 pt-4 animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            {children}
          </main>
          <TokenPanel />
        </ModalRootContext.Provider>
      </div>
      <Switcher />
    </div>
  )
}
