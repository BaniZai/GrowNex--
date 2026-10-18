'use client'

import { useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Search,
  Sparkles,
  TriangleAlert,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Btn, Card, Checkbox, KV, PageHeader, SectionLabel, Tag, type Tone } from '../ui'
import { useStore } from '../store'

type Method = '标准' | '模型选标' | '模型生成' | '规则' | '原注释' | '人工修改'

type Row = {
  id: string
  kind: '表' | '字段'
  table: string
  field: string
  schema: string
  scope: string
  orig: string
  sugg: string
  method: Method | null
  basis: string
  note?: string
  reviewed: boolean
}

const methodTone: Record<Method, Tone> = {
  标准: 'green',
  模型选标: 'blue',
  模型生成: 'purple',
  规则: 'gray',
  原注释: 'gray',
  人工修改: 'amber',
}

const ROWS: Row[] = [
  { id: '1', kind: '表', table: 'T_ACCT_DEPOSIT_DETAIL_HIS_MONTHLY_SNAPSHOT', field: '', schema: 'CORE', scope: 'CORE_ACCT / 账户域', orig: '', sugg: '存款账户明细历史月度快照表', method: '规则', basis: '词根:ACCT 账户 · DEPOSIT 存款', reviewed: true },
  { id: '2', kind: '字段', table: 'T_ACCT_DEPOSIT_DETAIL_HIS_MONTHLY_SNAPSHOT', field: 'ACCT_NO', schema: 'CORE', scope: 'CORE_ACCT / 账户域', orig: '账号', sugg: '账户号码', method: '标准', basis: '标准库 · 账户号码 · 第 12 页', reviewed: true },
  { id: '3', kind: '字段', table: 'T_ACCT_DEPOSIT_DETAIL_HIS_MONTHLY_SNAPSHOT', field: 'CUST_ID', schema: 'CORE', scope: 'CORE_ACCT / 账户域', orig: '', sugg: '客户编号', method: '模型选标', basis: '候选 3 项,选标准「客户编号」', reviewed: false },
  { id: '4', kind: '字段', table: 'T_ACCT_DEPOSIT_DETAIL_HIS_MONTHLY_SNAPSHOT', field: 'BAL_AMT', schema: 'CORE', scope: 'CORE_ACCT / 账户域', orig: '', sugg: '账户余额(元)', method: '模型生成', basis: '依据字段类型 DECIMAL(18,2) 与同表上下文', reviewed: false, note: '未命中标准,依据为模型推断' },
  { id: '5', kind: '字段', table: 'T_ACCT_DEPOSIT_DETAIL_HIS_MONTHLY_SNAPSHOT', field: 'OPEN_DT', schema: 'CORE', scope: 'CORE_ACCT / 账户域', orig: 'open date', sugg: 'open date 开户日期', method: '原注释', basis: '保留原注释', reviewed: false, note: '中文校验:含英文,需确认' },
  { id: '6', kind: '字段', table: 'T_ACCT_DEPOSIT_DETAIL_HIS_MONTHLY_SNAPSHOT', field: 'STATUS_CD', schema: '', scope: '', orig: '', sugg: '账户状态代码', method: '人工修改', basis: '原建议「状态」· 人工修改', reviewed: true, note: '来源冲突:两处导入给出不同含义' },
  { id: '7', kind: '表', table: 'T_CUST_BASE_INFO', field: '', schema: 'CORE', scope: 'CORE_ACCT / 客户域', orig: '客户基本信息表', sugg: '客户基本信息表', method: '原注释', basis: '保留原注释', reviewed: true },
  { id: '8', kind: '字段', table: 'T_CUST_BASE_INFO', field: 'CUST_NAME', schema: 'CORE', scope: 'CORE_ACCT / 客户域', orig: '', sugg: '', method: null, basis: '尚未生成建议', reviewed: false },
]

const COLS = '56px 72px 260px 160px 96px 180px 180px 220px 112px 220px 96px'

const PAGE_SIZE = 8
const TOTAL = 1284

export function ListScreen() {
  const { go, datasets } = useStore()
  const [open, setOpen] = useState(true)
  const [sel, setSel] = useState<string>('4')
  const [rows, setRows] = useState(ROWS)
  const [q, setQ] = useState('')
  const [dsId, setDsId] = useState(datasets[0]?.id ?? '')
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [page, setPage] = useState(1)

  const filtered = useMemo(
    () => rows.filter((r) => q === '' || r.table.toLowerCase().includes(q.toLowerCase()) || r.field.toLowerCase().includes(q.toLowerCase()) || r.sugg.includes(q) || r.orig.includes(q)),
    [rows, q],
  )
  const cur = rows.find((r) => r.id === sel) ?? null
  const ds = datasets.find((d) => d.id === dsId) ?? datasets[0]
  const reviewedCount = rows.filter((r) => r.reviewed).length

  const toggle = (id: string, v: boolean) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, reviewed: v } : r)))

  const commit = (id: string) => {
    setRows((rs) =>
      rs.map((r) => (r.id === id ? { ...r, sugg: draft, method: '人工修改', reviewed: false, basis: `原建议「${r.sugg || '空'}」· 人工修改` } : r)),
    )
    setEditing(null)
  }

  if (datasets.length === 0) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader crumb="元数据治理 / 治理列表" title="治理列表" subtitle="当前没有数据集" />
        <Card className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <h3 className="text-[16px] font-semibold">没有可用的数据集</h3>
          <p className="max-w-[360px] text-[13px] leading-5 text-ink-soft">列表、统计和按钮已同步清空。导入资料后会在这里看到表与字段。</p>
          <Btn variant="primary" onClick={() => go(2)}>去导入资料</Btn>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        crumb="元数据治理 / 治理列表"
        title="治理列表"
        subtitle={
          <>
            统计范围:<b className="text-ink">{ds?.name}</b>({ds?.source}) · 共 {ds?.tables} 张表、{ds?.fields.toLocaleString()} 个字段
          </>
        }
        actions={
          <>
            <div className="relative">
              <label htmlFor="ds-pick" className="sr-only">选择数据集</label>
              <select
                id="ds-pick"
                value={dsId}
                onChange={(e) => setDsId(e.target.value)}
                className="h-10 w-[300px] appearance-none rounded-full border border-line bg-white pl-4 pr-10 text-[13px] font-medium outline-none focus:border-brand"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} · {d.time} · {d.status === 'partial' ? '不完整' : '完整'}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
            </div>
            <Btn variant="white" className="h-10" onClick={() => go(4)}>管理数据集</Btn>
            <Btn variant="primary" className="h-10" onClick={() => go(5)}>
              <Sparkles className="size-4" />
              生成建议
            </Btn>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <label className="relative">
          <span className="sr-only">按表、字段、注释检索</span>
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="检索表名、字段名或注释"
            className="h-10 w-[300px] rounded-full border border-line bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-ink-mute focus:border-brand"
          />
        </label>
        {['对象:全部', '审核:全部', '生成方式:全部'].map((f) => (
          <button key={f} type="button" className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-medium hover:bg-brand-50">
            {f}
            <ChevronDown className="size-4 text-ink-mute" />
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[13px] text-ink-soft">
          <span>已确认 <b className="tabular-nums text-ink">{reviewedCount}</b> / 当前页 {rows.length} 项</span>
          <span className="text-ink-mute">·</span>
          <span>数据集共 {TOTAL.toLocaleString()} 项建议</span>
        </div>
        <Btn variant="white" className="h-10" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <PanelRightClose className="size-4" /> : <PanelRightOpen className="size-4" />}
          {open ? '收起依据详情' : '展开依据详情'}
        </Btn>
      </div>

      <div className="flex min-h-0 items-start gap-4">
        <Card as="div" className="min-w-0 flex-1 overflow-hidden">
          <div className="scroll-thin overflow-x-auto" tabIndex={0} aria-label="元数据列表,可横向滚动">
            <div role="table" aria-label="元数据治理列表" className="w-max min-w-full text-[13px]">
              <div
                role="row"
                className="sticky top-0 z-10 grid items-center border-b border-line bg-white text-ink-mute"
                style={{ gridTemplateColumns: COLS }}
              >
                {['审核', '对象', '表名', '字段名', '模式', '来源范围', '原注释', '建议注释', '生成方式', '生成依据', '校验'].map((h, i) => (
                  <div
                    key={h}
                    role="columnheader"
                    className={cn(
                      'flex h-12 items-center bg-white px-3 font-medium',
                      i === 0 && 'sticky left-0 z-10 justify-center',
                      i === 1 && 'sticky left-[56px] z-10',
                    )}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="flex h-40 flex-col items-center justify-center gap-2 text-ink-soft">
                  <p>没有符合「{q}」的表、字段或注释</p>
                  <button type="button" className="font-semibold text-brand" onClick={() => setQ('')}>清除检索条件</button>
                </div>
              )}

              {filtered.map((r) => {
                const active = r.id === sel
                const isEdit = editing === r.id
                const base = active ? 'bg-brand-50' : r.kind === '表' ? 'bg-[#faf8ff]' : 'bg-white'
                return (
                  <div
                    key={r.id}
                    role="row"
                    aria-selected={active}
                    onClick={() => setSel(r.id)}
                    className={cn('group grid h-[60px] cursor-pointer items-center border-b border-line/70 hover:bg-brand-50', base)}
                    style={{ gridTemplateColumns: COLS }}
                  >
                    <div
                      role="cell"
                      className={cn('sticky left-0 z-[1] flex h-full items-center justify-center group-hover:bg-brand-50', base)}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={r.reviewed}
                        onChange={(v) => toggle(r.id, v)}
                        label={`审核 ${r.table} ${r.field}`}
                        hideLabel
                        disabled={!r.sugg}
                      />
                    </div>
                    <div role="cell" className={cn('sticky left-[56px] z-[1] flex h-full items-center px-3 group-hover:bg-brand-50', base)}>
                      <Tag tone={r.kind === '表' ? 'purple' : 'gray'} dot={false}>{r.kind}</Tag>
                    </div>
                    <div role="cell" className="min-w-0 px-3">
                      <p className="truncate font-mono text-[12.5px] font-medium" title={r.table}>{r.table}</p>
                    </div>
                    <div role="cell" className="min-w-0 px-3">
                      {r.field ? (
                        <p className="truncate font-mono text-[12.5px]" title={r.field}>{r.field}</p>
                      ) : (
                        <span className="text-ink-mute" title="表对象没有字段名">— 表级对象</span>
                      )}
                    </div>
                    <div role="cell" className="min-w-0 px-3">
                      {r.schema ? <span className="font-mono text-[12.5px]">{r.schema}</span> : <span className="text-ink-mute">未提供</span>}
                    </div>
                    <div role="cell" className="min-w-0 px-3">
                      {r.scope ? <p className="truncate" title={r.scope}>{r.scope}</p> : <span className="text-ink-mute">未提供来源范围</span>}
                    </div>
                    <div role="cell" className="min-w-0 px-3">
                      {r.orig ? <p className="truncate" title={r.orig}>{r.orig}</p> : <span className="rounded-md border border-dashed border-[#d9d2ee] px-1.5 py-0.5 text-xs text-ink-mute">原注释缺失</span>}
                    </div>
                    <div role="cell" className="min-w-0 px-3" onClick={(e) => isEdit && e.stopPropagation()}>
                      {isEdit ? (
                        <div className="flex items-center gap-1">
                          <input
                            autoFocus
                            aria-label="编辑建议注释"
                            value={draft}
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) commit(r.id)
                              if (e.key === 'Escape') setEditing(null)
                            }}
                            className="h-8 min-w-0 flex-1 rounded-lg border border-brand bg-white px-2 text-[13px] outline-none"
                          />
                          <button type="button" onClick={() => commit(r.id)} className="h-8 shrink-0 rounded-lg bg-brand px-2 text-xs font-semibold text-white">保存</button>
                        </div>
                      ) : r.sugg ? (
                        <div className="flex items-center gap-1.5">
                          <p className="min-w-0 flex-1 truncate font-medium" title={r.sugg}>{r.sugg}</p>
                          <button
                            type="button"
                            aria-label="编辑建议注释"
                            onClick={(e) => { e.stopPropagation(); setEditing(r.id); setDraft(r.sugg) }}
                            className="grid size-6 shrink-0 place-items-center rounded-full text-ink-mute opacity-0 hover:bg-white hover:text-brand focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Pencil className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-ink-mute">未生成建议</span>
                      )}
                    </div>
                    <div role="cell" className="px-3">
                      {r.method ? <Tag tone={methodTone[r.method]}>{r.method}</Tag> : <span className="text-ink-mute">—</span>}
                    </div>
                    <div role="cell" className="min-w-0 px-3">
                      <p className="truncate text-ink-soft" title={r.basis}>{r.basis}</p>
                    </div>
                    <div role="cell" className="px-3">
                      {r.note ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-[#8f5400]" title={r.note}>
                          <TriangleAlert className="size-3.5" />
                          需关注
                        </span>
                      ) : r.sugg ? (
                        <span className="text-xs text-[#17704a]">通过</span>
                      ) : (
                        <span className="text-ink-mute">—</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-line px-5 py-3 text-xs text-ink-mute">
            <span>
              第 {(page - 1) * PAGE_SIZE + 1}–{(page - 1) * PAGE_SIZE + filtered.length} 条 · 数据集共 {TOTAL.toLocaleString()} 项 · 每页 {PAGE_SIZE} 条 · 翻页前自动保存已编辑内容
            </span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="上一页" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-brand-50 disabled:opacity-40">
                <ChevronLeft className="size-4" />
              </button>
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)} aria-current={page === n ? 'page' : undefined} className={cn('size-8 rounded-full text-[13px] font-semibold', page === n ? 'bg-ink text-white' : 'text-ink-soft hover:bg-brand-50')}>
                  {n}
                </button>
              ))}
              <span className="px-1">…</span>
              <button type="button" className="h-8 rounded-full px-2 text-[13px] font-semibold text-ink-soft hover:bg-brand-50">161</button>
              <button type="button" aria-label="下一页" onClick={() => setPage((p) => Math.min(p + 1, 161))} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-brand-50">
                <ChevronRight className="size-4" />
              </button>
            </div>
          </footer>
        </Card>

        {open && cur && (
          <Card as="div" className="sticky top-0 w-[340px] shrink-0 self-start">
            <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div className="min-w-0">
                <SectionLabel>依据详情</SectionLabel>
                <h3 className="mt-1 truncate font-mono text-[14px] font-semibold" title={cur.field || cur.table}>
                  {cur.field || cur.table}
                </h3>
                <p className="mt-0.5 break-all font-mono text-[11px] text-ink-mute">{cur.field ? cur.table : '表级对象'}</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="收起详情" className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-ink-soft hover:bg-brand-100">
                <X className="size-4" />
              </button>
            </header>

            <div className="flex flex-col gap-4 px-5 pb-5">
              <div className="flex flex-wrap gap-1.5">
                <Tag tone={cur.kind === '表' ? 'purple' : 'gray'} dot={false}>{cur.kind}</Tag>
                {cur.method && <Tag tone={methodTone[cur.method]}>{cur.method}</Tag>}
                <Tag tone={cur.reviewed ? 'green' : 'amber'}>{cur.reviewed ? '已确认' : '待审核'}</Tag>
              </div>

              <div className="rounded-2xl bg-[#f8f6fd] p-4">
                <p className="text-xs text-ink-mute">建议注释</p>
                <p className="mt-1 text-[15px] font-semibold leading-6">{cur.sugg || '未生成建议'}</p>
                {cur.note && (
                  <p className="mt-2 flex items-start gap-1.5 rounded-xl bg-[#fff6dc] px-3 py-2 text-xs leading-5 text-[#7a4a00]">
                    <TriangleAlert className="mt-0.5 size-3.5 shrink-0" />
                    {cur.note}
                  </p>
                )}
              </div>

              <dl>
                <KV k="模式" v={cur.schema || '未提供'} />
                <KV k="来源范围" v={cur.scope || '未提供来源范围'} />
                <KV k="原注释" v={cur.orig || '缺失'} />
              </dl>

              <div>
                <SectionLabel>生成依据</SectionLabel>
                <ul className="mt-2 space-y-2 text-[13px] leading-5">
                  <li className="rounded-xl border border-line px-3 py-2.5">
                    <p className="text-xs text-ink-mute">标准出处 / 规则</p>
                    <p>{cur.basis}</p>
                  </li>
                  <li className="rounded-xl border border-line px-3 py-2.5">
                    <p className="text-xs text-ink-mute">原始数据出处</p>
                    <p>核心系统导出_账户.xlsx · 工作表「字段」· 第 {Number(cur.id) + 2} 行</p>
                  </li>
                </ul>
              </div>

              <p className="text-xs leading-5 text-ink-mute">人工编辑会使原审核失效,并保留原生成依据与修改标识。</p>
            </div>
          </Card>
        )}
      </div>

      <div className="flex justify-end">
        <Btn variant="soft" onClick={() => go(5)}>
          <Download className="size-4" />
          前往审核与导出
        </Btn>
      </div>
    </div>
  )
}
