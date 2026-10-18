'use client'

import { cn } from '@/lib/utils'
import { formatTokens, useTokens } from './tokens'

export function TokenTicker() {
  const { today, rate, active, openPanel } = useTokens()
  const total = today.input + today.output
  const perSecond = rate.input + rate.output

  return (
    <button
      type="button"
      onClick={openPanel}
      aria-haspopup="dialog"
      aria-label={`今日 Token 用量 ${total},输入 ${today.input},输出 ${today.output},点击查看详情`}
      title={
        active
          ? `生成中 · 输入 ${rate.input} tok/s · 输出 ${rate.output} tok/s`
          : `今日 Token · 输入 ${formatTokens(today.input)} · 输出 ${formatTokens(today.output)}`
      }
      className="group hidden h-10 items-center gap-2 rounded-full px-3 text-[12px] text-ink-soft transition-colors hover:bg-white/80 hover:text-ink lg:flex"
    >
      <span aria-hidden className="relative grid size-2 place-items-center">
        <span
          className={cn(
            'size-1.5 rounded-full transition-colors duration-500',
            active ? 'bg-[#25a56a]' : 'bg-ink-mute/60 group-hover:bg-ink-mute',
          )}
        />
        {active && <span className="tok-breathe absolute inset-0 rounded-full bg-[#25a56a]/40" />}
      </span>
      <span className="font-medium">今日</span>
      <span className="min-w-[44px] text-left font-medium tabular-nums text-ink">{formatTokens(total)}</span>
      <span
        aria-hidden
        className={cn(
          'overflow-hidden whitespace-nowrap tabular-nums text-ink-mute transition-all duration-500',
          active ? 'max-w-[72px] opacity-100' : 'max-w-0 opacity-0',
        )}
      >
        {formatTokens(perSecond)}/s
      </span>
      <span className="sr-only" aria-live="off">
        {active ? '正在统计' : ''}
      </span>
    </button>
  )
}
