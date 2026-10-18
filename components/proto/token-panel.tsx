'use client'

import { Activity, ArrowDown, ArrowUp, Loader2, RotateCcw, Sparkles } from 'lucide-react'
import { Btn, Modal, ModalHeader, Tag } from './ui'
import {
  DAILY_QUOTA,
  FEATURE_LABEL,
  compactTokens,
  formatTokens,
  useTokens,
  type TokenFeature,
  type Totals,
} from './tokens'

const FEATURES: TokenFeature[] = ['治理', '开发', '制度']

const sum = (t: Totals) => t.input + t.output

function Stat({
  icon,
  label,
  value,
  share,
  rate,
  active,
}: {
  icon: React.ReactNode
  label: string
  value: number
  share: number
  rate: number
  active: boolean
}) {
  return (
    <div className="rounded-3xl bg-panel2 p-5">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
          {icon}
          {label}
        </span>
        {active ? <Tag tone="purple">{rate.toLocaleString('en-US')} tok/s</Tag> : null}
      </div>
      <p className="mt-3 text-[40px] font-light leading-none tracking-tight text-ink tabular-nums">{formatTokens(value)}</p>
      <p className="mt-2 text-[12px] text-ink-mute">占今日总量 {share}%</p>
    </div>
  )
}

export function TokenPanel() {
  const { panelOpen, closePanel, today, rate, active, byFeature, calls, history, weekTotal, allTotal, stream, reset } = useTokens()

  const total = sum(today)
  const inShare = total ? Math.round((today.input / total) * 100) : 0
  const used = Math.min(1, total / DAILY_QUOTA)

  const days = [...history, { label: '今天', ...today }]
  const max = Math.max(...days.map(sum), 1)
  const featureMax = Math.max(...FEATURES.map((f) => sum(byFeature[f])), 1)

  return (
    <Modal open={panelOpen} onClose={closePanel} titleId="token-title" width="max-w-[780px]">
      <ModalHeader
        id="token-title"
        icon={<Activity className="size-5" />}
        title="Token 用量"
        sub="按功能统计模型调用消耗的输入、输出 Token,数值为本机估算"
        onClose={closePanel}
      />

      <div className="flex flex-col gap-6 px-7 py-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Stat
            icon={<ArrowUp className="size-3.5 text-brand" />}
            label="输入 Token · 今天"
            value={today.input}
            share={inShare}
            rate={rate.input}
            active={active}
          />
          <Stat
            icon={<ArrowDown className="size-3.5 text-ink" />}
            label="输出 Token · 今天"
            value={today.output}
            share={100 - inShare}
            rate={rate.output}
            active={active}
          />
        </div>

        <div>
          <div className="mb-2 flex items-baseline justify-between text-[12px]">
            <span className="font-medium text-ink">今日参考额度</span>
            <span className="tabular-nums text-ink-mute">
              {formatTokens(total)} / {DAILY_QUOTA.toLocaleString('en-US')}
            </span>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={DAILY_QUOTA}
            aria-valuenow={total}
            aria-label="今日 Token 额度使用比例"
            className="h-2 overflow-hidden rounded-full bg-panel2"
          >
            <div className="h-full rounded-full bg-ink transition-[width] duration-300" style={{ width: `${used * 100}%` }} />
          </div>
        </div>

        <section aria-labelledby="tok-week">
          <div className="mb-3 flex items-end justify-between gap-4">
            <h3 id="tok-week" className="text-[14px] font-semibold text-ink">
              近 7 天
            </h3>
            <p className="text-[12px] tabular-nums text-ink-mute">
              近 7 天 {compactTokens(sum(weekTotal))} · 累计 {compactTokens(sum(allTotal))}
            </p>
          </div>
          <div className="flex h-36 items-end gap-3">
            {days.map((d, i) => {
              const h = (sum(d) / max) * 100
              const inH = sum(d) ? (d.input / sum(d)) * 100 : 0
              const isToday = i === days.length - 1
              return (
                <div key={d.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                  <span className="text-[11px] tabular-nums text-ink-mute">{compactTokens(sum(d))}</span>
                  <div
                    className="flex w-full max-w-[44px] flex-col overflow-hidden rounded-xl transition-[height] duration-300"
                    style={{ height: `${Math.max(h * 0.8, 4)}%` }}
                    title={`${d.label} · 输入 ${d.input.toLocaleString('en-US')} · 输出 ${d.output.toLocaleString('en-US')}`}
                  >
                    <div className="bg-ink" style={{ height: `${100 - inH}%` }} />
                    <div className="bg-brand-700" style={{ height: `${inH}%` }} />
                  </div>
                  <span className={isToday ? 'text-[11px] font-semibold text-ink' : 'text-[11px] text-ink-mute'}>{d.label}</span>
                </div>
              )
            })}
          </div>
          <div className="mt-3 flex items-center gap-4 text-[12px] text-ink-soft">
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-brand-700" />
              输入
            </span>
            <span className="flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm bg-ink" />
              输出
            </span>
          </div>
        </section>

        <div className="grid gap-6 md:grid-cols-2">
          <section aria-labelledby="tok-feature">
            <h3 id="tok-feature" className="mb-3 text-[14px] font-semibold text-ink">
              今日按功能
            </h3>
            <ul className="flex flex-col gap-3.5">
              {FEATURES.map((f) => {
                const t = byFeature[f]
                return (
                  <li key={f}>
                    <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
                      <span className="text-ink">{FEATURE_LABEL[f]}</span>
                      <span className="tabular-nums text-ink-soft">{formatTokens(sum(t))}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-panel2">
                      <div className="h-full rounded-full bg-brand transition-[width] duration-300" style={{ width: `${(sum(t) / featureMax) * 100}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] tabular-nums text-ink-mute">
                      输入 {t.input.toLocaleString('en-US')} · 输出 {t.output.toLocaleString('en-US')}
                    </p>
                  </li>
                )
              })}
            </ul>
          </section>

          <section aria-labelledby="tok-calls">
            <h3 id="tok-calls" className="mb-3 text-[14px] font-semibold text-ink">
              最近调用
            </h3>
            <ul className="scroll-thin flex max-h-[220px] flex-col overflow-y-auto">
              {calls.map((c) => (
                <li key={c.id} className="flex items-center gap-3 border-b border-line py-2.5 last:border-b-0">
                  <span className="w-10 shrink-0 text-[12px] tabular-nums text-ink-mute">{c.time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{c.title}</p>
                    <p className="text-[11px] text-ink-mute">{FEATURE_LABEL[c.feature]}</p>
                  </div>
                  <div className="text-right text-[12px] tabular-nums leading-5 text-ink-soft">
                    <p className="flex items-center justify-end gap-1">
                      {c.active ? <Loader2 aria-hidden className="size-3 animate-spin text-brand" /> : null}
                      <ArrowUp aria-hidden className="size-3 text-brand" />
                      {c.input.toLocaleString('en-US')}
                    </p>
                    <p className="flex items-center justify-end gap-1">
                      <ArrowDown aria-hidden className="size-3 text-ink" />
                      {c.output.toLocaleString('en-US')}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-line px-7 py-4">
        <p className="text-[12px] text-ink-mute">统计仅保存在本机,不上传云端。</p>
        <div className="flex items-center gap-2">
          <Btn variant="white" onClick={reset}>
            <RotateCcw className="size-4" />
            恢复示例数据
          </Btn>
          <Btn variant="primary" onClick={() => stream('开发', '模拟调用')}>
            <Sparkles className="size-4" />
            模拟一次调用
          </Btn>
        </div>
      </div>
    </Modal>
  )
}
