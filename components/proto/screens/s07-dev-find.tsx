'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CircleAlert,
  Database,
  Lightbulb,
  MessageSquareText,
  Search,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
  Wrench,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Btn,
  Card,
  CardHeader,
  Checkbox,
  FlagTag,
  Notice,
  PageHeader,
  ProgressBar,
  SectionLabel,
  Tag,
  type Tone,
} from '../ui'
import { useStore } from '../store'

type Cand = {
  id: string
  table: string
  field: string
  orig: string
  explain: string
  review: '已审核' | '未审核' | '无解释'
  src: string
  sensitive?: boolean
}

const CANDS: Cand[] = [
  { id: 'c1', table: 'T_LOAN_CONTRACT', field: 'CUST_ID', orig: '客户编号', explain: '客户编号', review: '已审核', src: 'CORE_ACCT · 治理审核' },
  { id: 'c2', table: 'T_LOAN_CONTRACT', field: 'LOAN_BAL', orig: '', explain: '贷款余额(元)', review: '未审核', src: '规则建议,尚未审核' },
  { id: 'c3', table: 'T_LOAN_CONTRACT', field: 'LOAN_STS', orig: '状态', explain: '', review: '无解释', src: '仅有原注释' },
  { id: 'c4', table: 'T_CUST_BASE_INFO', field: 'ID_NO', orig: '证件号码', explain: '客户证件号码', review: '已审核', src: 'CORE_ACCT · 治理审核', sensitive: true },
  { id: 'c5', table: 'T_CUST_BASE_INFO', field: 'MOBILE', orig: '手机号', explain: '客户手机号码', review: '已审核', src: 'CORE_ACCT · 治理审核', sensitive: true },
]

const reviewTone: Record<Cand['review'], Tone> = { 已审核: 'green', 未审核: 'amber', 无解释: 'gray' }

const STEPS = ['描述目标', '找数据', '分析需求', '确认口径', '代码交付']

export function DevFindScreen() {
  const { go, datasets, devSourceId, setDevSourceId, devInvalidated, ackDevInvalidated } = useStore()
  const [goal, setGoal] = useState('统计每个月末各支行的个人客户贷款余额,用于经营分析月报。')
  const [output, setOutput] = useState('按月、支行汇总的贷款余额表')
  const [db, setDb] = useState('Oracle')
  const [searched, setSearched] = useState(true)
  const [picked, setPicked] = useState<Record<string, boolean>>({ c1: true, c2: true })
  const [analysed, setAnalysed] = useState(true)

  const src = datasets.find((d) => d.id === devSourceId)
  const nSel = Object.values(picked).filter(Boolean).length
  const hasUnreviewed = CANDS.some((c) => picked[c.id] && c.review !== '已审核')
  const noSource = !src

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="数据开发 / 需求 D-017"
        title="客户贷款余额月度汇总"
        badge={<Tag tone="purple">找数据与分析</Tag>}
        subtitle="候选只是相关数据,不会被自动视为已确认关联。"
        actions={
          <>
            <Btn variant="white" onClick={() => go(3)}>
              <Wrench className="size-4" />
              去治理处理选中数据
            </Btn>
            <Btn variant="primary" disabled={nSel === 0 || noSource} onClick={() => go(8)}>
              进入口径确认
              <ArrowRight className="size-4" />
            </Btn>
          </>
        }
      />

      <Card className="px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-[14px] font-semibold">流程进度</p>
            <p className="text-xs text-ink-mute">已完成 2 / 5 步 · 当前:分析需求</p>
          </div>
          <ol className="flex flex-1 items-center justify-end gap-2">
            {STEPS.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex h-8 items-center gap-2 rounded-full px-3 text-xs font-medium',
                    i < 2 ? 'bg-brand text-white' : i === 2 ? 'bg-brand-100 text-brand' : 'bg-panel2 text-ink-mute',
                  )}
                >
                  <span className="grid size-4 place-items-center rounded-full bg-white/25 text-[10px] font-semibold">{i + 1}</span>
                  {s}
                </span>
                {i < STEPS.length - 1 && <span className="h-px w-4 bg-dash" aria-hidden />}
              </li>
            ))}
          </ol>
        </div>
      </Card>

      {devInvalidated && (
        <Notice tone="amber" icon={<TriangleAlert className="size-4" />}>
          <div className="flex items-center justify-between gap-4">
            <p>
              <b>来源数据集已被删除,选择与确认已失效。</b>业务需求与已填写的口径草稿已保留,请重新选择来源并确认字段。
            </p>
            <Btn variant="white" size="sm" onClick={ackDevInvalidated}>知道了</Btn>
          </div>
        </Notice>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader title="描述业务目标" sub="目标、预期输出与目标数据库" />
            <div className="flex flex-col gap-4 p-6 pt-4">
              <div>
                <label htmlFor="goal" className="mb-2 block text-[13px] font-semibold">业务目标</label>
                <div className="rounded-2xl border-2 border-sun bg-white p-3 shadow-[0_0_0_4px_rgb(var(--ink-rgb)/0.08)]">
                  <textarea
                    id="goal"
                    value={goal}
                    maxLength={500}
                    onChange={(e) => setGoal(e.target.value)}
                    className="h-20 w-full resize-none bg-transparent text-[14px] leading-6 outline-none"
                  />
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                      <Sparkles className="size-3.5" />
                      整理为清晰描述
                    </span>
                    <span className="text-xs tabular-nums text-ink-mute">{goal.length} / 500</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="out" className="mb-2 block text-[13px] font-semibold">预期输出</label>
                  <input id="out" value={output} onChange={(e) => setOutput(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] outline-none focus:border-brand" />
                </div>
                <div>
                  <label htmlFor="db" className="mb-2 block text-[13px] font-semibold">目标数据库</label>
                  <select id="db" value={db} onChange={(e) => setDb(e.target.value)} className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] outline-none focus:border-brand">
                    <option>Oracle</option>
                    <option>MySQL</option>
                    <option>PostgreSQL</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Btn variant="primary" className="h-10" disabled={noSource} onClick={() => setSearched(true)}>
                  <Search className="size-4" />
                  在所选范围检索
                </Btn>
                {noSource && <span className="text-xs text-[#8a5a00]">请先在右侧选择数据来源范围</span>}
              </div>
            </div>
          </Card>

          <Card as="div" className="overflow-hidden">
            <CardHeader
              title="候选表与字段"
              sub={searched && !noSource ? `在「${src?.name}」中找到 ${CANDS.length} 个相关字段 · 请明确选择加工所需字段` : '尚未检索'}
              right={<span className="text-[13px] text-ink-soft">已选 <b className="tabular-nums text-ink">{nSel}</b> 项</span>}
            />
            {noSource ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand"><Database className="size-5" /></span>
                <p className="text-[14px] font-semibold">没有可用的数据来源</p>
                <p className="max-w-[380px] text-[13px] leading-5 text-ink-soft">
                  来源数据集已被删除或尚未选择。不会编造不存在的表和字段;请选择已导入数据集,或去导入字典。
                </p>
                <div className="mt-1 flex gap-2">
                  <Btn variant="primary" onClick={() => go(2)}>导入字典</Btn>
                </div>
              </div>
            ) : !searched ? (
              <p className="px-6 py-10 text-center text-[13px] text-ink-soft">点击「在所选范围检索」查看候选。</p>
            ) : (
              <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
                {CANDS.map((c) => (
                  <li key={c.id} className={cn('flex items-center gap-4 px-6 py-3.5', picked[c.id] && 'bg-brand-50/60')}>
                    <Checkbox
                      checked={!!picked[c.id]}
                      onChange={(v) => setPicked((p) => ({ ...p, [c.id]: v }))}
                      label={`选择 ${c.table}.${c.field}`}
                      hideLabel
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 truncate font-mono text-[12.5px]">
                        <span className="truncate text-ink-soft">{c.table}.</span>
                        <b className="shrink-0">{c.field}</b>
                        {c.sensitive && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#fdecef] px-2 py-0.5 font-sans text-[11px] font-semibold text-[#a31f35]">
                            <ShieldAlert className="size-3" />
                            敏感
                          </span>
                        )}
                      </p>
                      <p className="mt-0.5 truncate text-[13px]">
                        <span className="text-ink-mute">原注释:</span>
                        {c.orig || '无'}
                        <span className="mx-2 text-ink-mute">|</span>
                        <span className="text-ink-mute">当前解释:</span>
                        <b className="font-semibold">{c.explain || '无可用解释'}</b>
                      </p>
                      <p className="mt-0.5 truncate text-xs text-ink-mute">出处:{c.src}</p>
                    </div>
                    <Tag tone={reviewTone[c.review]}>{c.review}</Tag>
                  </li>
                ))}
              </ul>
            )}
            <footer className="flex items-center gap-2 border-t border-line bg-cream px-6 py-3 text-xs text-ink-mute">
              <ShieldAlert className="size-3.5 shrink-0" />
              敏感字段不会被默认选中,也不会默认发送给模型。
            </footer>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="数据来源范围" sub="删除来源后,依赖它的选择会失效" />
            <div className="p-6 pt-4">
              <label htmlFor="src" className="sr-only">选择数据集</label>
              <select
                id="src"
                value={devSourceId ?? ''}
                onChange={(e) => { setDevSourceId(e.target.value || null); ackDevInvalidated() }}
                className="h-11 w-full rounded-xl border border-line bg-white px-4 text-[13px] outline-none focus:border-brand"
              >
                <option value="">请选择数据集</option>
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} · {d.time}</option>
                ))}
              </select>
              {src && (
                <p className="mt-3 text-xs leading-5 text-ink-soft">
                  {src.source} · {src.tables} 表 · {src.fields.toLocaleString()} 字段{src.status === 'partial' && <span className="text-[#8a5a00]"> · 数据集不完整</span>}
                </p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="需求分析"
              sub={analysed ? '本地规则检查 · 未调用模型' : undefined}
              right={<FlagTag>本地规则</FlagTag>}
            />
            <div className="flex flex-col gap-4 p-6 pt-4">
              {!analysed ? (
                <Btn variant="primary" onClick={() => setAnalysed(true)}>开始分析</Btn>
              ) : (
                <>
                  <div>
                    <SectionLabel>已知事实</SectionLabel>
                    <ul className="mt-2 space-y-1.5 text-[13px] leading-5">
                      <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#25a56a]" />合同表含客户编号(已审核)</li>
                      <li className="flex gap-2"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[#25a56a]" />目标库 {db},输出为月度汇总</li>
                    </ul>
                  </div>
                  <div>
                    <SectionLabel>口径缺口</SectionLabel>
                    <ul className="mt-2 space-y-1.5 text-[13px] leading-5">
                      <li className="flex gap-2"><CircleAlert className="mt-0.5 size-3.5 shrink-0 text-[#d49400]" />「贷款余额」含义未审核</li>
                      <li className="flex gap-2"><CircleAlert className="mt-0.5 size-3.5 shrink-0 text-[#d49400]" />LOAN_STS 无可用解释,有效状态未知</li>
                    </ul>
                  </div>
                  <div className="rounded-2xl bg-brand-50 p-3.5">
                    <p className="flex items-center gap-1.5 text-xs font-semibold text-brand"><Lightbulb className="size-3.5" />建议治理事项</p>
                    <p className="mt-1 text-[13px] leading-5">先在治理中审核 LOAN_BAL、LOAN_STS 的解释,返回后会重读最新结果。</p>
                  </div>
                  {hasUnreviewed && (
                    <p className="flex items-start gap-1.5 text-xs leading-5 text-[#8a5a00]">
                      <MessageSquareText className="mt-0.5 size-3.5 shrink-0" />
                      未审核建议已清晰标记,不会混入业务事实。
                    </p>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <p className="mb-2 text-[13px] font-semibold">草稿保留</p>
            <ProgressBar value={60} label="草稿完整度" />
            <p className="mt-2 text-xs leading-5 text-ink-soft">返回治理再回来时保留需求、口径草稿与仍有效的字段选择。</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
