'use client'

import { useState, type ReactNode } from 'react'
import {
  BookMarked,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Code2,
  Database,
  FileText,
  LayoutGrid,
  Settings2,
  ShieldCheck,
  Sparkles,
  WifiOff,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ModalRootContext, Tag } from './ui'
import { SCREENS, useStore, type ScreenId } from './store'

type NavItem = {
  label: string
  icon: ReactNode
  target: ScreenId
  match: ScreenId[]
  badge?: number
}

const WORK_NAV: NavItem[] = [
  { label: '任务工作台', icon: <LayoutGrid className="size-[18px]" />, target: 1, match: [1] },
  { label: '元数据治理', icon: <ShieldCheck className="size-[18px]" />, target: 3, match: [2, 3, 4, 5], badge: 2 },
  { label: '数据开发', icon: <Code2 className="size-[18px]" />, target: 7, match: [7, 8], badge: 1 },
  { label: '制度通知解读', icon: <FileText className="size-[18px]" />, target: 9, match: [9] },
]

const CONFIG_NAV: NavItem[] = [
  { label: '标准库', icon: <BookMarked className="size-[18px]" />, target: 6, match: [6] },
  { label: '模型设置', icon: <Settings2 className="size-[18px]" />, target: 10, match: [10] },
]

const statusDot: Record<string, string> = {
  review: 'bg-[#f0a31a]',
  confirm: 'bg-[#f0a31a]',
  done: 'bg-[#25a56a]',
  running: 'bg-[#a98af0]',
  failed: 'bg-[#e8657a]',
}

function NavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-10 w-full items-center gap-3 rounded-xl px-3 text-[14px] font-medium transition-colors',
        active ? 'bg-white/14 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.14)]' : 'text-white/72 hover:bg-white/8 hover:text-white',
      )}
    >
      <span className={cn(active ? 'text-white' : 'text-white/60')}>{item.icon}</span>
      <span className="flex-1 truncate text-left">{item.label}</span>
      {item.badge ? (
        <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#fbd6f3] px-1.5 text-[11px] font-semibold text-deep">
          {item.badge}
        </span>
      ) : null}
    </button>
  )
}

function Sidebar() {
  const { screen, go, recents } = useStore()
  return (
    <aside className="sidebar-bg flex w-[236px] shrink-0 flex-col gap-5 px-4 pb-4 pt-4 text-white" aria-label="主导航">
      <button
        type="button"
        className="flex items-center gap-3 rounded-2xl bg-white/10 p-2.5 text-left shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]"
        aria-label="工作区:数源本机工作区"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#f4c6f0] via-[#b79af2] to-[#6d3fd8]">
          <Database className="size-[18px] text-white" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-semibold leading-5">数源 GrowNex</span>
          <span className="block truncate text-[11px] text-white/55">本机工作区 · 离线可用</span>
        </span>
        <ChevronDown className="size-4 text-white/60" />
      </button>

      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">任务类型</p>
        {WORK_NAV.map((it) => (
          <NavButton key={it.label} item={it} active={it.match.includes(screen)} onClick={() => go(it.target)} />
        ))}
      </nav>

      <nav className="flex flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">资料与配置</p>
        {CONFIG_NAV.map((it) => (
          <NavButton key={it.label} item={it} active={it.match.includes(screen)} onClick={() => go(it.target)} />
        ))}
      </nav>

      <div className="flex min-h-0 flex-1 flex-col gap-1">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/45">最近任务</p>
        {recents.length === 0 ? (
          <p className="px-3 text-xs leading-5 text-white/50">暂无最近任务</p>
        ) : (
          <ul className="flex flex-col gap-0.5 overflow-hidden">
            {recents.slice(0, 4).map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => go(1)}
                  title={r.title}
                  className="flex h-9 w-full items-center gap-2.5 rounded-lg px-3 text-left text-[13px] text-white/75 hover:bg-white/8 hover:text-white"
                >
                  <span aria-hidden className={cn('size-2 shrink-0 rounded-full', statusDot[r.status])} />
                  <span className="min-w-0 flex-1 truncate">{r.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white/10 p-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1)]">
        <div className="flex items-center gap-2 text-[13px] font-medium">
          <WifiOff className="size-4 text-[#d7c6ff]" />
          私有化模式
        </div>
        <p className="mt-1 flex items-center gap-1.5 text-[11px] leading-4 text-white/60">
          <span className="size-1.5 rounded-full bg-[#7be0a8]" />
          资料仅在本机处理,不上传云端
        </p>
        <div className="mt-3 flex items-center gap-2.5 border-t border-white/10 pt-3">
          <span className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#f4c6f0] to-[#8a63e6] text-xs font-semibold text-deep">
            林
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium leading-4">林 工</p>
            <p className="truncate text-[11px] text-white/55">元数据治理</p>
          </div>
        </div>
      </div>
    </aside>
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
      className="fixed bottom-4 left-1/2 z-40 flex max-w-[calc(100vw-24px)] -translate-x-1/2 items-center gap-2 rounded-full border border-white/70 bg-white/85 p-1.5 shadow-[0_16px_40px_-14px_rgba(42,22,112,0.55)] backdrop-blur-xl"
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
                s.id === screen ? 'bg-ink text-white' : 'text-ink-soft hover:bg-brand-50',
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
  return (
    <div className="stage-bg min-h-svh overflow-x-auto p-4 pb-[88px] md:p-6 md:pb-[96px]">
      <div className="mx-auto flex h-[calc(100svh-136px)] min-h-[640px] min-w-[1080px] max-w-[1560px] overflow-hidden rounded-[34px] border-[3px] border-white/90 bg-white shadow-[0_40px_90px_-30px_rgba(42,22,112,0.6)]">
        <Sidebar />
        <div ref={setRoot} className="main-bg relative min-w-0 flex-1">
          <ModalRootContext.Provider value={root}>
            <main id="main" className="scroll-thin h-full overflow-y-auto px-8 pb-10 pt-8">
              {children}
            </main>
          </ModalRootContext.Provider>
        </div>
      </div>
      <Switcher />
      <p className="sr-only">
        <Sparkles /> <Tag>原型</Tag>
      </p>
    </div>
  )
}
