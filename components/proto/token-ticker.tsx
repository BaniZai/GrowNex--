'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatTokens, useTokens } from './tokens'

export function TokenTicker() {
  const { today, rate, active, openPanel } = useTokens()

  return (
    <button
      type="button"
      onClick={openPanel}
      aria-haspopup="dialog"
      aria-label={`今日 Token 用量,输入 ${today.input},输出 ${today.output},点击查看详情`}
      title={
        active
          ? `生成中 · 输入 ${rate.input} tok/s · 输出 ${rate.output} tok/s`
          : '今日 Token 用量 · 点击查看详情'
      }
      className={cn(
        'hidden h-10 items-center gap-3 rounded-full px-3.5 text-[12px] font-medium transition-colors lg:flex',
        active ? 'bg-white text-ink shadow-[0_0_0_1px_rgb(var(--ink-rgb)/0.08)]' : 'bg-white/80 text-ink-soft hover:bg-white hover:text-ink',
      )}
    >
      <span className="flex items-center gap-1">
        <ArrowUp aria-hidden className={cn('size-3.5', active ? 'tok-up text-brand' : 'text-ink-mute')} />
        <span className="min-w-[46px] text-right tabular-nums">{formatTokens(today.input)}</span>
      </span>
      <span aria-hidden className="h-4 w-px bg-line" />
      <span className="flex items-center gap-1">
        <ArrowDown aria-hidden className={cn('size-3.5', active ? 'tok-down text-ink' : 'text-ink-mute')} />
        <span className="min-w-[40px] text-right tabular-nums">{formatTokens(today.output)}</span>
      </span>
      <span className="sr-only" aria-live="off">
        {active ? '正在统计' : ''}
      </span>
    </button>
  )
}
