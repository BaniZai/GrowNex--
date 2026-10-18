'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'

export type TokenFeature = '治理' | '开发' | '制度'

export type Totals = { input: number; output: number }

export type TokenCall = {
  id: string
  feature: TokenFeature
  title: string
  time: string
  input: number
  output: number
  active: boolean
}

export type HistoryDay = { label: string } & Totals

export const FEATURE_LABEL: Record<TokenFeature, string> = {
  治理: '元数据治理',
  开发: '数据开发',
  制度: '制度解读',
}

export const DAILY_QUOTA = 200_000

const HISTORY: HistoryDay[] = [
  { label: '10-12', input: 9200, output: 2300 },
  { label: '10-13', input: 14800, output: 3900 },
  { label: '10-14', input: 21600, output: 6100 },
  { label: '10-15', input: 8400, output: 1900 },
  { label: '10-16', input: 17300, output: 4800 },
  { label: '10-17', input: 26100, output: 7200 },
]

const BASE_TODAY: Totals = { input: 12480, output: 3206 }

const BASE_FEATURES: Record<TokenFeature, Totals> = {
  治理: { input: 7200, output: 1900 },
  开发: { input: 3800, output: 980 },
  制度: { input: 1480, output: 326 },
}

const BASE_CALLS: TokenCall[] = [
  { id: 'c3', feature: '制度', title: '制度通知解读', time: '09:58', input: 1480, output: 326, active: false },
  { id: 'c2', feature: '开发', title: '分析需求与数据', time: '09:51', input: 3800, output: 980, active: false },
  { id: 'c1', feature: '治理', title: '生成注释建议', time: '09:42', input: 7200, output: 1900, active: false },
]

const PROFILE: Record<TokenFeature, { input: [number, number]; output: [number, number]; ms: number }> = {
  治理: { input: [4200, 6800], output: [1600, 2600], ms: 6000 },
  开发: { input: [2200, 3600], output: [800, 1500], ms: 4200 },
  制度: { input: [1200, 2400], output: [500, 1100], ms: 3600 },
}

type Snap = {
  today: Totals
  byFeature: Record<TokenFeature, Totals>
  calls: TokenCall[]
  rate: Totals
  active: boolean
}

type Stream = {
  id: string
  feature: TokenFeature
  input: number
  output: number
  start: number
  duration: number
  emittedIn: number
  emittedOut: number
}

type TokenApi = Snap & {
  history: HistoryDay[]
  weekTotal: Totals
  allTotal: Totals
  stream: (feature: TokenFeature, title: string, durationMs?: number) => void
  reset: () => void
  panelOpen: boolean
  openPanel: () => void
  closePanel: () => void
}

const TICK_MS = 100

const initial = (): Snap => ({
  today: { ...BASE_TODAY },
  byFeature: {
    治理: { ...BASE_FEATURES.治理 },
    开发: { ...BASE_FEATURES.开发 },
    制度: { ...BASE_FEATURES.制度 },
  },
  calls: BASE_CALLS.map((c) => ({ ...c })),
  rate: { input: 0, output: 0 },
  active: false,
})

const rand = ([a, b]: [number, number]) => Math.round(a + Math.random() * (b - a))
const clamp = (n: number) => Math.min(1, Math.max(0, n))
const easeOut = (t: number) => 1 - Math.pow(1 - t, 2.2)

const Ctx = createContext<TokenApi | null>(null)

export function TokenProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snap>(initial)
  const [panelOpen, setPanelOpen] = useState(false)
  const streams = useRef<Stream[]>([])
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)
  const seq = useRef(0)

  const stopTimer = useCallback(() => {
    if (timer.current) clearInterval(timer.current)
    timer.current = null
  }, [])

  const tick = useCallback(() => {
    const now = performance.now()
    const deltas: { id: string; feature: TokenFeature; dIn: number; dOut: number; done: boolean }[] = []

    for (const s of streams.current) {
      const t = clamp((now - s.start) / s.duration)
      const done = t >= 1
      const targetIn = done ? s.input : Math.round(s.input * easeOut(clamp(t / 0.3)))
      const jitter = 0.94 + Math.random() * 0.06
      const targetOut = done ? s.output : Math.round(s.output * clamp((t - 0.12) / 0.88) * jitter)
      const dIn = Math.max(0, targetIn - s.emittedIn)
      const dOut = Math.max(0, targetOut - s.emittedOut)
      s.emittedIn += dIn
      s.emittedOut += dOut
      deltas.push({ id: s.id, feature: s.feature, dIn, dOut, done })
    }

    streams.current = streams.current.filter((s) => !deltas.find((d) => d.id === s.id && d.done))
    const stillActive = streams.current.length > 0
    if (!stillActive) stopTimer()

    const sumIn = deltas.reduce((n, d) => n + d.dIn, 0)
    const sumOut = deltas.reduce((n, d) => n + d.dOut, 0)

    setSnap((prev) => {
      const byFeature = { ...prev.byFeature }
      for (const d of deltas) {
        const cur = byFeature[d.feature]
        byFeature[d.feature] = { input: cur.input + d.dIn, output: cur.output + d.dOut }
      }
      const calls = prev.calls.map((c) => {
        const d = deltas.find((x) => x.id === c.id)
        return d ? { ...c, input: c.input + d.dIn, output: c.output + d.dOut, active: !d.done } : c
      })
      const perSec = 1000 / TICK_MS
      return {
        today: { input: prev.today.input + sumIn, output: prev.today.output + sumOut },
        byFeature,
        calls,
        rate: stillActive
          ? {
              input: Math.round(prev.rate.input * 0.5 + sumIn * perSec * 0.5),
              output: Math.round(prev.rate.output * 0.5 + sumOut * perSec * 0.5),
            }
          : { input: 0, output: 0 },
        active: stillActive,
      }
    })
  }, [stopTimer])

  const stream = useCallback(
    (feature: TokenFeature, title: string, durationMs?: number) => {
      const p = PROFILE[feature]
      const id = `live-${Date.now()}-${seq.current++}`
      const d = new Date()
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
      streams.current.push({
        id,
        feature,
        input: rand(p.input),
        output: rand(p.output),
        start: performance.now(),
        duration: durationMs ?? p.ms,
        emittedIn: 0,
        emittedOut: 0,
      })
      setSnap((prev) => ({
        ...prev,
        active: true,
        calls: [{ id, feature, title, time, input: 0, output: 0, active: true }, ...prev.calls].slice(0, 8),
      }))
      if (!timer.current) timer.current = setInterval(tick, TICK_MS)
    },
    [tick],
  )

  const reset = useCallback(() => {
    streams.current = []
    stopTimer()
    setSnap(initial())
  }, [stopTimer])

  useEffect(() => stopTimer, [stopTimer])

  const openPanel = useCallback(() => setPanelOpen(true), [])
  const closePanel = useCallback(() => setPanelOpen(false), [])

  const value = useMemo<TokenApi>(() => {
    const past = HISTORY.reduce<Totals>((a, d) => ({ input: a.input + d.input, output: a.output + d.output }), { input: 0, output: 0 })
    const weekTotal = { input: past.input + snap.today.input, output: past.output + snap.today.output }
    return {
      ...snap,
      history: HISTORY,
      weekTotal,
      allTotal: { input: weekTotal.input + 186_400, output: weekTotal.output + 49_800 },
      stream,
      reset,
      panelOpen,
      openPanel,
      closePanel,
    }
  }, [snap, stream, reset, panelOpen, openPanel, closePanel])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTokens() {
  const v = useContext(Ctx)
  if (!v) throw new Error('TokenProvider missing')
  return v
}

export function formatTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  return n.toLocaleString('en-US')
}

export function compactTokens(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 10_000) return `${(n / 1000).toFixed(1)}k`
  return n.toLocaleString('en-US')
}
