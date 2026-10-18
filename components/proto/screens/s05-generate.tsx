'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Ban,
  Check,
  CircleAlert,
  Download,
  FileCheck2,
  ListChecks,
  Sparkles,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AgentBanner,
  Btn,
  Card,
  CardHeader,
  Checkbox,
  FlagTag,
  Modal,
  ModalHeader,
  Notice,
  PageHeader,
  ProgressBar,
  RingLoader,
  Segmented,
  Tag,
  Toast,
} from '../ui'
import { useStore } from '../store'

type Phase = 'ready' | 'running' | 'cancelling' | 'cancelled' | 'review'
type Db = 'Oracle' | 'MySQL' | 'PostgreSQL'

type Item = {
  id: string
  table: string
  field: string
  sugg: string
  state: 'ok' | 'english' | 'empty' | 'conflict'
  checked: boolean
}

const INITIAL: Item[] = [
  { id: 'a', table: 'T_ACCT_DEPOSIT_DETAIL', field: 'ACCT_NO', sugg: '账户号码', state: 'ok', checked: true },
  { id: 'b', table: 'T_ACCT_DEPOSIT_DETAIL', field: 'CUST_ID', sugg: '客户编号', state: 'ok', checked: true },
  { id: 'c', table: 'T_ACCT_DEPOSIT_DETAIL', field: 'BAL_AMT', sugg: '账户余额(元)', state: 'ok', checked: false },
  { id: 'd', table: 'T_ACCT_DEPOSIT_DETAIL', field: 'OPEN_DT', sugg: 'open date 开户日期', state: 'english', checked: false },
  { id: 'e', table: 'T_ACCT_DEPOSIT_DETAIL', field: 'CLOSE_DT', sugg: '', state: 'empty', checked: false },
  { id: 'f', table: 'T_ACCT_DEPOSIT_DETAIL', field: 'STATUS_CD', sugg: '账户状态代码', state: 'conflict', checked: false },
  { id: 'g', table: 'T_CUST_BASE_INFO', field: 'CUST_NAME', sugg: '客户名称', state: 'ok', checked: true },
]

const stateMeta = {
  ok: null,
  english: { label: '中文含英文,请确认', tone: 'amber' as const },
  empty: { label: '建议为空,无法确认', tone: 'red' as const },
  conflict: { label: '来源冲突,请先解决', tone: 'red' as const },
}

const STAGES = ['规则匹配', '标准库比对', '候选整理', '写入待审核']

export function GenerateScreen() {
  const { go, datasets } = useStore()
  const [phase, setPhase] = useState<Phase>('ready')
  const [step, setStep] = useState(0)
  const [done, setDone] = useState(0)
  const [items, setItems] = useState(INITIAL)
  const [db, setDb] = useState<Db>('Oracle')
  const [exportOpen, setExportOpen] = useState(false)
  const [batchOpen, setBatchOpen] = useState(false)
  const [toast, setToast] = useState<null | 'batch' | 'export' | 'cancel'>(null)

  useEffect(() => {
    if (phase !== 'running') return
    setStep(0)
    setDone(0)
    const a = setInterval(() => setDone((d) => d + 137), 400)
    const b = setInterval(() => setStep((s) => Math.min(s + 1, STAGES.length - 1)), 1500)
    const c = setTimeout(() => setPhase('review'), 6200)
    return () => {
      clearInterval(a)
      clearInterval(b)
      clearTimeout(c)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'cancelling') return
    const t = setTimeout(() => {
      setPhase('cancelled')
      setToast('cancel')
    }, 1500)
    return () => clearTimeout(t)
  }, [phase])

  const valid = items.filter((i) => i.state === 'ok')
  const confirmed = valid.filter((i) => i.checked)
  const blocked = items.filter((i) => i.state !== 'ok')
  const noDataset = datasets.length === 0
  const busy = phase === 'running' || phase === 'cancelling'
  const allValidChecked = valid.length > 0 && valid.every((i) => i.checked)

  const toggle = (id: string, v: boolean) => setItems((is) => is.map((i) => (i.id === id ? { ...i, checked: v } : i)))
  const batchConfirm = () => {
    setItems((is) => is.map((i) => (i.state === 'ok' ? { ...i, checked: true } : i)))
    setBatchOpen(false)
    setToast('batch')
  }

  const note = useMemo(() => `${confirmed.length} 项可导出 · ${blocked.length} 项被阻止`, [confirmed.length, blocked.length])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="元数据治理 / 生成与审核"
        title="生成、审核与导出"
        badge={
          phase === 'review' ? <Tag tone="amber">完成待审核</Tag> : phase === 'cancelled' ? <Tag tone="gray">已取消</Tag> : phase === 'ready' ? <Tag tone="gray">未开始</Tag> : <Tag tone="purple">处理中</Tag>
        }
        subtitle="每项建议都需人工审核;只有已确认且重新校验通过的项才会进入导出。"
        actions={
          <div className="w-[400px]">
            <Segmented<Phase>
              label="演示状态"
              value={phase === 'cancelling' ? 'running' : phase}
              onChange={setPhase}
              items={[
                { id: 'ready', label: '未开始' },
                { id: 'running', label: '生成中' },
                { id: 'cancelled', label: '已取消' },
                { id: 'review', label: '待审核' },
              ]}
            />
          </div>
        }
      />

      <AgentBanner
        eyebrow="本地规则模式 · 未配置模型"
        icon={<Sparkles className="size-4" />}
        action={
          <Btn variant="white" onClick={() => go(10)}>
            配置模型
            <ArrowRight className="size-4" />
          </Btn>
        }
      >
        当前使用规则匹配与标准库比对生成建议,<b>不会</b>标注为「AI 已完成分析」。
      </AgentBanner>

      {(phase === 'ready' || phase === 'cancelled') && (
        <Card>
          <div className="grid grid-cols-[1fr_auto] items-center gap-6 p-6">
            <div className="flex flex-col gap-3">
              <h3 className="text-[16px] font-semibold">{phase === 'cancelled' ? '已取消,未产生新的建议' : '生成注释建议'}</h3>
              <p className="max-w-[560px] text-[13px] leading-6 text-ink-soft">
                {phase === 'cancelled'
                  ? '本次取消没有写入任何新建议,之前的审核状态保持不变。恢复到可操作状态,可再次生成。'
                  : '范围:CORE_ACCT 账户系统 · 86 张表 · 1,284 个字段。生成前会检查是否有数据集与可用策略。'}
              </p>
              <ul className="flex flex-wrap gap-2 text-xs">
                <li><Tag tone={noDataset ? 'red' : 'green'}>{noDataset ? '没有数据集' : '数据集可用'}</Tag></li>
                <li><Tag tone="green">本地规则策略可用</Tag></li>
                <li><Tag tone="gray">标准库 · 2,018 条</Tag></li>
              </ul>
            </div>
            <Btn variant="primary" className="h-12 px-8 text-[14px]" disabled={noDataset} onClick={() => setPhase('running')}>
              <Sparkles className="size-4" />
              {phase === 'cancelled' ? '重新生成建议' : '开始生成建议'}
            </Btn>
          </div>
        </Card>
      )}

      {phase === 'review' && (
        <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
          <Card as="div" className="overflow-hidden">
            <CardHeader
              title="待审核建议"
              sub={`当前范围:CORE_ACCT 账户系统 · 本页 ${items.length} 项`}
              right={
                <Btn variant="soft" size="sm" onClick={() => setBatchOpen(true)} disabled={allValidChecked}>
                  <ListChecks className="size-3.5" />
                  批量确认有效项
                </Btn>
              }
            />
            <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
              {items.map((i) => {
                const m = stateMeta[i.state]
                return (
                  <li key={i.id} className={cn('flex items-center gap-4 px-6 py-3.5', i.state !== 'ok' && 'bg-[#fffdf6]')}>
                    <Checkbox
                      checked={i.checked}
                      disabled={i.state !== 'ok'}
                      onChange={(v) => toggle(i.id, v)}
                      label={`确认 ${i.table}.${i.field}`}
                      hideLabel
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-mono text-[12.5px] text-ink-soft" title={`${i.table}.${i.field}`}>
                        {i.table}.<b className="text-ink">{i.field}</b>
                      </p>
                      <p className={cn('mt-0.5 truncate text-[14px] font-semibold', !i.sugg && 'font-normal text-ink-mute')}>
                        {i.sugg || '建议为空'}
                      </p>
                    </div>
                    {m ? (
                      <span className="inline-flex shrink-0 items-center gap-1.5 text-xs font-medium text-[#8f5400]">
                        <TriangleAlert className="size-3.5" />
                        {m.label}
                      </span>
                    ) : (
                      <Tag tone={i.checked ? 'green' : 'gray'}>{i.checked ? '已确认' : '待审核'}</Tag>
                    )}
                  </li>
                )
              })}
            </ul>
            <footer className="border-t border-line bg-[#fbfaff] px-6 py-3 text-xs text-ink-mute">
              批量确认只处理「状态有效」的建议,含英文、为空、来源冲突的项不会被悄悄批准。
            </footer>
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader title="导出前检查" />
              <dl className="grid grid-cols-2 gap-3 p-6 pt-4">
                <div className="rounded-2xl bg-[#e4f6ec] px-4 py-3">
                  <dt className="text-xs text-[#14623f]">可导出</dt>
                  <dd className="text-[24px] font-semibold tabular-nums leading-8 text-[#14623f]">{confirmed.length}</dd>
                </div>
                <div className="rounded-2xl bg-[#fff6dc] px-4 py-3">
                  <dt className="text-xs text-[#7a4a00]">被阻止</dt>
                  <dd className="text-[24px] font-semibold tabular-nums leading-8 text-[#7a4a00]">{blocked.length}</dd>
                </div>
              </dl>
              <div className="px-6 pb-6">
                <Btn variant="primary" className="h-11 w-full" disabled={confirmed.length === 0} onClick={() => setExportOpen(true)}>
                  <Download className="size-4" />
                  导出确认项
                </Btn>
                <p className="mt-2 text-center text-xs text-ink-mute">{note}</p>
              </div>
            </Card>
            <Notice tone="purple" icon={<FileCheck2 className="size-4" />}>
              产品<b>不连接业务数据库、不执行 SQL</b>。导出只生成文件,不会出现「已同步到数据库」的提示。
            </Notice>
          </div>
        </div>
      )}

      <Modal open={busy} onClose={() => {}} closable={false} titleId="gen-run-title" width="max-w-[480px]">
        <div className="flex flex-col items-center gap-5 px-8 py-9 text-center">
          <RingLoader size={64} />
          <div>
            <h2 id="gen-run-title" className="text-[18px] font-semibold">
              {phase === 'cancelling' ? '正在停止…' : '正在生成注释建议'}
            </h2>
            <p className="mt-1 text-[13px] text-ink-soft">CORE_ACCT 账户系统 · 本地规则</p>
          </div>
          {phase === 'cancelling' ? (
            <div className="w-full rounded-2xl bg-[#f8f6fd] p-4 text-left text-[13px] leading-5 text-ink-soft">
              取消后不会写入未完成的建议,已有审核状态保持不变。请勿重复提交。
            </div>
          ) : (
            <div className="w-full rounded-2xl bg-[#f8f6fd] p-4 text-left">
              <ol className="space-y-2 text-[13px]">
                {STAGES.map((s, idx) => (
                  <li key={s} className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        'grid size-5 place-items-center rounded-full text-[11px] font-semibold',
                        idx < step ? 'bg-brand text-white' : idx === step ? 'bg-brand-100 text-brand' : 'bg-[#ece8f6] text-ink-mute',
                      )}
                    >
                      {idx < step ? <Check className="size-3" strokeWidth={3} /> : idx + 1}
                    </span>
                    <span className={idx === step ? 'font-semibold' : idx < step ? 'text-ink-soft' : 'text-ink-mute'}>{s}</span>
                  </li>
                ))}
              </ol>
              <ProgressBar indeterminate label="生成进度,总量按字段数估算" className="mt-3" />
              <p className="mt-2 text-xs text-ink-mute">已处理 {done.toLocaleString()} 个字段</p>
            </div>
          )}
          <Btn variant="white" className="h-10 px-6" disabled={phase === 'cancelling'} onClick={() => setPhase('cancelling')}>
            {phase === 'cancelling' ? '停止中…' : '取消生成'}
          </Btn>
        </div>
      </Modal>

      <Modal open={batchOpen} onClose={() => setBatchOpen(false)} titleId="batch-title" width="max-w-[520px]">
        <ModalHeader id="batch-title" icon={<ListChecks className="size-5" />} title="批量确认有效项" onClose={() => setBatchOpen(false)} />
        <div className="space-y-3 px-7 py-5 text-[14px] leading-6">
          <p>
            范围:<b>当前数据集 · 本页 {items.length} 项</b>
          </p>
          <ul className="space-y-1.5 text-[13px]">
            <li className="flex items-center justify-between rounded-xl bg-[#e4f6ec] px-4 py-2.5 text-[#14623f]">
              <span>将确认(状态有效)</span>
              <b className="tabular-nums">{valid.filter((i) => !i.checked).length} 项</b>
            </li>
            <li className="flex items-center justify-between rounded-xl bg-[#fff6dc] px-4 py-2.5 text-[#7a4a00]">
              <span>不会确认(含英文 / 为空 / 冲突)</span>
              <b className="tabular-nums">{blocked.length} 项</b>
            </li>
          </ul>
        </div>
        <footer className="flex justify-end gap-3 border-t border-line bg-[#fbfaff] px-7 py-4">
          <Btn variant="white" className="h-10 px-5" onClick={() => setBatchOpen(false)}>取消</Btn>
          <Btn variant="primary" className="h-10 px-5" onClick={batchConfirm}>确认有效项</Btn>
        </footer>
      </Modal>

      <Modal open={exportOpen} onClose={() => setExportOpen(false)} titleId="export-title" width="max-w-[600px]">
        <ModalHeader
          id="export-title"
          icon={<Download className="size-5" />}
          title="导出确认项"
          sub="生成含审核依据的文件,不会连接或修改任何业务数据库"
          onClose={() => setExportOpen(false)}
        />
        <div className="flex flex-col gap-5 px-7 py-5">
          <div>
            <p className="mb-2 text-[13px] font-semibold">目标数据库类型</p>
            <Segmented<Db>
              label="目标数据库类型"
              value={db}
              onChange={setDb}
              items={[
                { id: 'Oracle', label: 'Oracle' },
                { id: 'MySQL', label: 'MySQL' },
                { id: 'PostgreSQL', label: 'PostgreSQL' },
              ]}
            />
          </div>
          <dl className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-[#f8f6fd] px-4 py-3">
              <dt className="text-xs text-ink-mute">已确认</dt>
              <dd className="text-[22px] font-semibold tabular-nums leading-8">{confirmed.length}</dd>
            </div>
            <div className="rounded-2xl bg-[#e4f6ec] px-4 py-3">
              <dt className="text-xs text-[#14623f]">重新校验通过</dt>
              <dd className="text-[22px] font-semibold tabular-nums leading-8 text-[#14623f]">{confirmed.length}</dd>
            </div>
            <div className="rounded-2xl bg-[#fff6dc] px-4 py-3">
              <dt className="text-xs text-[#7a4a00]">阻止</dt>
              <dd className="text-[22px] font-semibold tabular-nums leading-8 text-[#7a4a00]">{blocked.length}</dd>
            </div>
          </dl>
          <div>
            <p className="mb-2 text-[13px] font-semibold">阻止原因</p>
            <ul className="space-y-1.5 text-[13px]">
              {blocked.map((b) => (
                <li key={b.id} className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
                  <Ban className="size-3.5 shrink-0 text-[#b4233a]" />
                  <span className="font-mono text-[12px]">{b.field}</span>
                  <span className="flex-1 truncate text-ink-soft">{stateMeta[b.state]?.label}</span>
                </li>
              ))}
              <li className="flex items-center gap-2.5 rounded-xl border border-line px-3 py-2">
                <Ban className="size-3.5 shrink-0 text-[#b4233a]" />
                <span className="font-mono text-[12px]">T_CUST_BASE_INFO</span>
                <span className="flex-1 truncate text-ink-soft">没有完整列定义,无法生成 {db} 语句</span>
              </li>
            </ul>
          </div>
          <p className="flex items-center gap-2 text-xs text-ink-mute">
            <CircleAlert className="size-3.5 shrink-0" />
            输出内容含审核依据;文件由你自行审阅后在数据库侧执行。
          </p>
        </div>
        <footer className="flex justify-end gap-3 border-t border-line bg-[#fbfaff] px-7 py-4">
          <Btn variant="white" className="h-10 px-5" onClick={() => setExportOpen(false)}>取消</Btn>
          <Btn
            variant="primary"
            className="h-10 px-5"
            onClick={() => {
              setExportOpen(false)
              setToast('export')
            }}
          >
            生成导出文件
          </Btn>
        </footer>
      </Modal>

      <Toast show={toast === 'batch'} title="已确认有效项" body="含英文、为空、来源冲突的建议保持待处理。" onClose={() => setToast(null)} />
      <Toast show={toast === 'export'} title="导出文件已生成" body={`${db} 注释语句与审核依据已保存到本机。尚未执行到任何数据库。`} onClose={() => setToast(null)} />
      <Toast show={toast === 'cancel'} title="生成已取消" body="没有写入新建议,可再次生成。" onClose={() => setToast(null)} icon={<Ban className="size-4" />} />
      <FlagTag className="sr-only">合成演示</FlagTag>
    </div>
  )
}
