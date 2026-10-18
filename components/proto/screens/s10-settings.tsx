'use client'

import { useEffect, useState } from 'react'
import { CircleCheck, KeyRound, Lock, PlugZap, Save, ShieldCheck, TriangleAlert, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Btn, Card, CardHeader, Notice, PageHeader, ProgressBar, RingLoader, Modal, Segmented, Tag, Toast } from '../ui'

type Mode = 'private' | 'public'
type Test = 'idle' | 'testing' | 'cancelling' | 'ok' | 'cancelled'

export function SettingsScreen() {
  const [mode, setMode] = useState<Mode>('private')
  const [endpoint, setEndpoint] = useState('http://10.20.4.18:8000/v1')
  const [model, setModel] = useState('qwen2.5-32b-instruct')
  const [concurrency, setConcurrency] = useState('1')
  const [batch, setBatch] = useState('20')
  const [timeout, setTimeoutV] = useState('60')
  const [allowOut, setAllowOut] = useState(false)
  const [test, setTest] = useState<Test>('idle')
  const [ms, setMs] = useState<number | null>(null)
  const [toast, setToast] = useState<null | 'saved' | 'saveFail'>(null)
  const [simFail, setSimFail] = useState(false)

  useEffect(() => {
    if (test !== 'testing') return
    const t = setTimeout(() => {
      setMs(1840)
      setTest('ok')
    }, 2600)
    return () => clearTimeout(t)
  }, [test])

  useEffect(() => {
    if (test !== 'cancelling') return
    const t = setTimeout(() => setTest('cancelled'), 900)
    return () => clearTimeout(t)
  }, [test])

  const hostBad = mode === 'private' && /^https?:\/\/(?!10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|localhost|127\.)/.test(endpoint)
  const publicBlocked = mode === 'public' && !allowOut

  const changeMode = (m: Mode) => {
    setMode(m)
    setAllowOut(false)
    setTest('idle')
    if (m === 'public') {
      setEndpoint('https://api.example-llm.com/v1')
      setConcurrency('4')
    } else {
      setEndpoint('http://10.20.4.18:8000/v1')
      setConcurrency('1')
    }
  }

  const save = () => {
    if (simFail) {
      setToast('saveFail')
      return
    }
    setToast('saved')
  }

  const busy = test === 'testing' || test === 'cancelling'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="配置"
        title="模型设置"
        badge={mode === 'private' ? <Tag tone="green">私有化模式</Tag> : <Tag tone="amber">公网模式</Tag>}
        subtitle="服务配置状态:模型已填写,密钥已保存(不显示明文)。"
        actions={
          <>
            <Btn variant="white" className="h-10" disabled={busy || hostBad || publicBlocked} onClick={() => setTest('testing')}>
              <PlugZap className="size-4" />
              测试连接
            </Btn>
            <Btn variant="primary" className="h-10" disabled={busy} onClick={save}>
              <Save className="size-4" />
              保存设置
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader title="运行模式" sub="切换模式不会隐式授权资料出网" />
            <div className="flex flex-col gap-4 p-6 pt-4">
              <Segmented<Mode>
                label="运行模式"
                value={mode}
                onChange={changeMode}
                items={[
                  { id: 'private', label: '私有化模式' },
                  { id: 'public', label: '公网模式' },
                ]}
              />
              {mode === 'private' ? (
                <Notice tone="green" icon={<ShieldCheck className="size-4" />}>
                  地址须为白名单主机或私有地址;默认并发为 1。资料不离开行内网络。
                </Notice>
              ) : (
                <Notice tone="amber" icon={<TriangleAlert className="size-4" />}>
                  <p>公网模式<b>默认禁止发送业务资料</b>。需下方单独授权,并且仍受内容范围限制。</p>
                  <label className="mt-2 inline-flex items-center gap-2 text-[13px]">
                    <input type="checkbox" checked={allowOut} onChange={(e) => setAllowOut(e.target.checked)} className="size-4 accent-[#17171a]" />
                    我已了解风险,允许发送所选字段的脱敏内容
                  </label>
                </Notice>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="模型服务" />
            <div className="grid grid-cols-2 gap-x-5 gap-y-4 p-6 pt-4">
              <div className="col-span-2">
                <label htmlFor="endpoint" className="mb-2 block text-[13px] font-semibold">服务地址</label>
                <input
                  id="endpoint"
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  aria-invalid={hostBad}
                  className={cn('h-11 w-full rounded-xl border bg-white px-4 font-mono text-[13px] outline-none focus:border-brand', hostBad ? 'border-[#d93a52]' : 'border-line')}
                />
                {hostBad && (
                  <p className="mt-1.5 flex items-center gap-1.5 text-xs text-[#b4233a]">
                    <TriangleAlert className="size-3.5" />
                    私有化模式只允许白名单主机或私有地址,当前地址被拒绝。
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="model" className="mb-2 block text-[13px] font-semibold">模型标识</label>
                <input id="model" value={model} onChange={(e) => setModel(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-4 font-mono text-[13px] outline-none focus:border-brand" />
              </div>
              <div>
                <label htmlFor="key" className="mb-2 block text-[13px] font-semibold">密钥</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
                  <input id="key" readOnly value="••••••••••••••••" className="h-11 w-full rounded-xl border border-line bg-[#f7f5ec] pl-10 pr-24 font-mono text-[13px] text-ink-soft outline-none" />
                  <button type="button" className="absolute right-2 top-1/2 h-8 -translate-y-1/2 rounded-full bg-white px-3 text-xs font-semibold text-brand shadow-sm hover:bg-brand-50">更换</button>
                </div>
                <p className="mt-1.5 flex items-center gap-1.5 text-xs text-ink-mute"><Lock className="size-3" />不明文展示,不进入结果和错误信息</p>
              </div>
              <div>
                <label htmlFor="conc" className="mb-2 block text-[13px] font-semibold">总并发</label>
                <input id="conc" value={concurrency} onChange={(e) => setConcurrency(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] tabular-nums outline-none focus:border-brand" />
                {mode === 'private' && <p className="mt-1.5 text-xs text-ink-mute">私有化默认 1</p>}
              </div>
              <div>
                <label htmlFor="batch" className="mb-2 block text-[13px] font-semibold">批大小</label>
                <input id="batch" value={batch} onChange={(e) => setBatch(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] tabular-nums outline-none focus:border-brand" />
              </div>
              <div>
                <label htmlFor="to" className="mb-2 block text-[13px] font-semibold">超时(秒)</label>
                <input id="to" value={timeout} onChange={(e) => setTimeoutV(e.target.value.replace(/\D/g, ''))} inputMode="numeric" className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] tabular-nums outline-none focus:border-brand" />
              </div>
            </div>
            <footer className="flex items-center justify-between border-t border-line bg-[#fbfaf5] px-6 py-3 text-xs text-ink-mute">
              <label className="inline-flex items-center gap-2">
                <input type="checkbox" checked={simFail} onChange={(e) => setSimFail(e.target.checked)} className="size-3.5 accent-[#17171a]" />
                演示:模拟保存失败(已填内容保留)
              </label>
              <span>保存不会触发连接测试</span>
            </footer>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="测试连接" sub="只发送固定合成内容" />
            <div className="flex flex-col gap-4 p-6 pt-4">
              <dl className="space-y-2 text-[13px]">
                {[
                  ['网络', test === 'ok' ? '可达' : '—'],
                  ['认证', test === 'ok' ? '通过' : '—'],
                  ['模型响应', test === 'ok' ? '有效响应' : '—'],
                  ['耗时', test === 'ok' && ms ? `${(ms / 1000).toFixed(2)} 秒` : '—'],
                ].map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between rounded-xl bg-[#f7f5ec] px-4 py-2.5">
                    <dt className="text-ink-soft">{k}</dt>
                    <dd className={cn('font-semibold', v === '—' && 'font-normal text-ink-mute')}>{v}</dd>
                  </div>
                ))}
              </dl>
              {test === 'ok' && (
                <Notice tone="green" icon={<CircleCheck className="size-4" />}>
                  连接可用。这<b>不代表</b>注释质量或 SQL 正确。
                </Notice>
              )}
              {test === 'cancelled' && (
                <Notice tone="amber" icon={<X className="size-4" />}>测试已取消,没有保存任何配置。</Notice>
              )}
              <p className="text-xs leading-5 text-ink-mute">测试不带附件、不保存配置、不改变资料发送授权。</p>
            </div>
          </Card>

          <Card className="p-5">
            <p className="text-[14px] font-semibold">当前状态</p>
            <ul className="mt-3 space-y-2.5 text-[13px]">
              <li className="flex items-center justify-between"><span className="text-ink-soft">运行模式</span><b>{mode === 'private' ? '私有化模式' : '公网模式'}</b></li>
              <li className="flex items-center justify-between"><span className="text-ink-soft">资料出网</span>{mode === 'private' ? <Tag tone="green">不出网</Tag> : allowOut ? <Tag tone="amber">已授权</Tag> : <Tag tone="gray">未授权</Tag>}</li>
              <li className="flex items-center justify-between"><span className="text-ink-soft">模型标识</span><b className="max-w-[160px] truncate font-mono text-xs">{model}</b></li>
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={busy} onClose={() => {}} closable={false} titleId="test-title" width="max-w-[440px]">
        <div className="flex flex-col items-center gap-5 px-8 py-9 text-center">
          <RingLoader size={64} />
          <div>
            <h2 id="test-title" className="text-[18px] font-semibold">{test === 'cancelling' ? '正在取消测试…' : '正在测试连接'}</h2>
            <p className="mt-1 text-[13px] text-ink-soft">仅发送固定合成内容 · 验证网络、认证与模型响应</p>
          </div>
          <ProgressBar indeterminate label="测试进度" />
          <Btn variant="white" className="h-10 px-6" disabled={test === 'cancelling'} onClick={() => setTest('cancelling')}>
            {test === 'cancelling' ? '取消中…' : '取消测试'}
          </Btn>
        </div>
      </Modal>

      <Toast show={toast === 'saved'} title="设置已保存" body="未改变资料发送授权。" onClose={() => setToast(null)} />
      <Toast show={toast === 'saveFail'} title="保存失败,已填内容保留" body="配置文件写入失败,请检查本机存储后重试。" icon={<TriangleAlert className="size-4" />} onClose={() => setToast(null)} />
    </div>
  )
}
