'use client'

import { useMemo, useState } from 'react'
import { Check, ClipboardCopy, CircleHelp, FileCode2, Lock, Pencil, ShieldCheck, TriangleAlert } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Btn, Card, CardHeader, FlagTag, Notice, PageHeader, PillTabs, Tag, Toast } from '../ui'
import { useStore } from '../store'

type Item = {
  id: string
  label: string
  value: string
  state: 'filled' | 'pending'
  hint: string
}

const INITIAL: Item[] = [
  { id: 'grain', label: '输出粒度', value: '按月末日期 × 支行汇总', state: 'filled', hint: '来自你描述的预期输出' },
  { id: 'window', label: '时间窗口与边界', value: '', state: 'pending', hint: '含月末当日吗?统计哪些月份?' },
  { id: 'status', label: '有效状态与过滤', value: '', state: 'pending', hint: 'LOAN_STS 无解释,哪些状态计入?' },
  { id: 'join', label: '表关联与基数', value: 'T_LOAN_CONTRACT.CUST_ID = T_CUST_BASE_INFO.CUST_ID(多对一)', state: 'filled', hint: '候选关联,需你确认' },
  { id: 'metric', label: '指标公式', value: 'SUM(LOAN_BAL)', state: 'filled', hint: '「贷款余额」含义未审核' },
  { id: 'dedupe', label: '去重规则', value: '', state: 'pending', hint: '同一合同多笔流水如何去重?' },
  { id: 'null', label: '空值处理', value: '', state: 'pending', hint: 'LOAN_BAL 为空视为 0 还是排除?' },
  { id: 'fields', label: '输出字段', value: '月末日期、支行编号、贷款余额', state: 'filled', hint: '来自所选字段' },
]

const TABS = [
  { id: 'sql', label: '开发 SQL' },
  { id: 'spec', label: '口径说明' },
  { id: 'map', label: '字段来源映射' },
  { id: 'verify', label: '核验 SQL' },
] as const
type TabId = (typeof TABS)[number]['id']

export function DevConfirmScreen() {
  const { go, devSourceId, devInvalidated } = useStore()
  const [items, setItems] = useState(INITIAL)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [tab, setTab] = useState<TabId>('sql')
  const [toast, setToast] = useState<null | 'copy' | 'invalid'>(null)

  const pending = items.filter((i) => i.state === 'pending').length
  const canConfirm = pending === 0 && !!devSourceId && !devInvalidated

  const startEdit = (i: Item) => {
    setEditing(i.id)
    setDraft(i.value)
  }
  const save = (id: string) => {
    if (!draft.trim()) return
    setItems((is) => is.map((i) => (i.id === id ? { ...i, value: draft.trim(), state: 'filled' } : i)))
    setEditing(null)
    if (confirmed) {
      setConfirmed(false)
      setToast('invalid')
    }
  }

  const content = useMemo(() => {
    const v = (id: string) => items.find((i) => i.id === id)?.value || '待确认'
    return {
      sql: `-- 合成模板:待人工审核,产品不自动执行
SELECT TRUNC(c.STAT_DT, 'MM') AS month_end,
       c.BRANCH_NO           AS branch_no,
       SUM(c.LOAN_BAL)       AS loan_bal
FROM   T_LOAN_CONTRACT c
JOIN   T_CUST_BASE_INFO u ON u.CUST_ID = c.CUST_ID
WHERE  /* ${v('status')} */ c.LOAN_STS IN ('01')
GROUP  BY TRUNC(c.STAT_DT, 'MM'), c.BRANCH_NO;`,
      spec: `粒度:${v('grain')}\n时间窗口:${v('window')}\n有效状态:${v('status')}\n关联:${v('join')}\n指标:${v('metric')}\n去重:${v('dedupe')}\n空值:${v('null')}`,
      map: `month_end ← T_LOAN_CONTRACT.STAT_DT(已审核)\nbranch_no ← T_LOAN_CONTRACT.BRANCH_NO(已审核)\nloan_bal  ← T_LOAN_CONTRACT.LOAN_BAL(未审核解释)`,
      verify: `SELECT COUNT(*) FROM T_LOAN_CONTRACT\nWHERE LOAN_BAL IS NULL;\n\n-- 边界样例:月末当日是否计入\nSELECT * FROM T_LOAN_CONTRACT\nWHERE STAT_DT = LAST_DAY(STAT_DT) AND ROWNUM <= 5;`,
    }
  }, [items])

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="数据开发 / 需求 D-017"
        title="确认加工口径与交付"
        badge={confirmed ? <Tag tone="green">口径已确认</Tag> : <Tag tone="amber">待确认 {pending} 项</Tag>}
        subtitle="未知内容以待确认问题呈现,不预填未经证实的业务事实;确认不会被分析建议自动勾选。"
        actions={
          <>
            <Btn variant="white" onClick={() => go(7)}>返回找数据</Btn>
            <Btn
              variant="primary"
              disabled={!canConfirm && !confirmed}
              onClick={() => (confirmed ? setConfirmed(false) : setConfirmed(true))}
            >
              {confirmed ? <Pencil className="size-4" /> : <ShieldCheck className="size-4" />}
              {confirmed ? '撤销确认并修改' : '最终确认口径'}
            </Btn>
          </>
        }
      />

      {(!devSourceId || devInvalidated) && (
        <Notice tone="red" icon={<TriangleAlert className="size-4" />}>
          <div className="flex items-center justify-between gap-4">
            <p>
              <b>数据来源已失效,确认已作废。</b>请回到「找数据」重新选择来源。需求与口径草稿已保留,不会靠返回按钮维持过期方案。
            </p>
            <Btn variant="white" size="sm" onClick={() => go(7)}>重新选择来源</Btn>
          </div>
        </Notice>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-5">
        <Card>
          <CardHeader
            title="口径核对"
            sub="逐项修改后再最终确认"
            right={<span className="text-xs text-ink-mute">{items.length - pending} / {items.length} 已填</span>}
          />
          <ol className="relative flex flex-col px-6 pb-6 pt-5">
            {items.map((i, idx) => {
              const last = idx === items.length - 1
              const isEdit = editing === i.id
              return (
                <li key={i.id} className="relative flex gap-4 pb-5 last:pb-0">
                  {!last && <span aria-hidden className="absolute bottom-0 left-[13px] top-7 w-0.5 bg-[#e6e1cf]" />}
                  <span
                    className={cn(
                      'relative z-[1] grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold',
                      i.state === 'filled' ? 'border-brand bg-brand text-white' : 'border-[#f5b36a] bg-white text-[#9a4a00]',
                    )}
                  >
                    {i.state === 'filled' ? <Check className="size-3.5" strokeWidth={3} /> : <CircleHelp className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[14px] font-semibold">{i.label}</p>
                      {i.state === 'pending' && <Tag tone="amber">待确认</Tag>}
                      {!confirmed && !isEdit && (
                        <button
                          type="button"
                          onClick={() => startEdit(i)}
                          className="ml-auto inline-flex h-7 items-center gap-1 rounded-full px-2.5 text-xs font-semibold text-brand hover:bg-brand-50"
                        >
                          <Pencil className="size-3" />
                          {i.state === 'filled' ? '修改' : '填写'}
                        </button>
                      )}
                    </div>
                    {isEdit ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          autoFocus
                          aria-label={`填写${i.label}`}
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) save(i.id)
                            if (e.key === 'Escape') setEditing(null)
                          }}
                          placeholder={i.hint}
                          className="h-10 min-w-0 flex-1 rounded-xl border-2 border-[#f5c93b] bg-white px-3 text-[13px] outline-none"
                        />
                        <Btn variant="primary" size="sm" className="h-10" onClick={() => save(i.id)}>保存</Btn>
                        <Btn variant="white" size="sm" className="h-10" onClick={() => setEditing(null)}>取消</Btn>
                      </div>
                    ) : i.state === 'filled' ? (
                      <p className="mt-1 text-[13px] leading-5 text-ink-soft">{i.value}</p>
                    ) : (
                      <p className="mt-1 text-[13px] leading-5 text-[#9a4a00]">{i.hint}</p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
          <footer className="flex items-center gap-2 border-t border-line bg-[#fbfaf5] px-6 py-3 text-xs text-ink-mute">
            <Lock className="size-3.5 shrink-0" />
            需求、数据源、所选字段或口径发生实质变化时,确认自动失效。
          </footer>
        </Card>

        <Card as="div" className="flex min-h-0 flex-col overflow-hidden">
          <CardHeader
            title="代码与核验交付"
            sub={confirmed ? '合成模板 · 待人工审核' : '确认口径后生成'}
            right={<FlagTag>{confirmed ? '合成模板' : '未生成'}</FlagTag>}
          />
          {!confirmed ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 py-16 text-center">
              <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand">
                <FileCode2 className="size-6" />
              </span>
              <h3 className="text-[16px] font-semibold">先确认口径,再生成代码</h3>
              <p className="max-w-[320px] text-[13px] leading-5 text-ink-soft">
                {pending > 0
                  ? `还有 ${pending} 项待确认。未填写的内容不会被预填,也不会生成含猜测的 SQL。`
                  : '全部已填。点击「最终确认口径」后,生成开发代码、口径说明、字段映射与核验 SQL。'}
              </p>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-4 p-6 pt-4">
              <PillTabs<TabId> label="交付内容" items={[...TABS]} value={tab} onChange={setTab} />
              <div className="relative flex-1 rounded-2xl bg-[#1e1445] p-4">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(content[tab]).catch(() => {})
                    setToast('copy')
                  }}
                  className="absolute right-3 top-3 inline-flex h-8 items-center gap-1.5 rounded-full bg-white/10 px-3 text-xs font-semibold text-white hover:bg-white/20"
                >
                  <ClipboardCopy className="size-3.5" />
                  复制
                </button>
                <pre className="scroll-thin max-h-[360px] overflow-auto whitespace-pre-wrap pr-16 font-mono text-[12.5px] leading-6 text-[#e6e1cf]">
                  {content[tab]}
                </pre>
              </div>
              <Notice tone="amber" icon={<TriangleAlert className="size-4" />}>
                含「待确认」的位置保持占位。代码<b>始终待人工审核,产品不会自动执行</b>;来源:合成模板,非模型生成。
              </Notice>
            </div>
          )}
        </Card>
      </div>

      <Toast show={toast === 'copy'} title="已复制到剪贴板" body="仅复制当前标签内容,不会执行。" onClose={() => setToast(null)} />
      <Toast show={toast === 'invalid'} title="口径变化,确认已失效" body="请重新核对后再次最终确认。" icon={<TriangleAlert className="size-4" />} onClose={() => setToast(null)} />
    </div>
  )
}
