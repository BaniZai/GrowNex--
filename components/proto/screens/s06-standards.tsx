'use client'

import { useMemo, useState } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Info,
  Search,
  TriangleAlert,
  UploadCloud,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Btn, Card, CardHeader, FlagTag, KV, Modal, ModalHeader, Notice, PageHeader, PillTabs, SectionLabel, Tag, type Tone } from '../ui'

type Kind = 'auth' | 'dict' | 'code' | 'root'

type Std = {
  id: string
  cn: string
  en: string
  rule: string
  kind: Kind
  codeName: string
  src: string
  check: string
  checkTone: Tone
}

const KIND_LABEL: Record<Kind, string> = { auth: '权威标准', dict: '数据字典引用', code: '代码取值', root: '词根' }

const DATA: Std[] = [
  { id: '1', cn: '账户号码', en: 'ACCT_NO', rule: '由 19 位数字组成,前 6 位为机构码', kind: 'auth', codeName: '—', src: '标准手册.xlsx · 第 12 页', check: '通过', checkTone: 'green' },
  { id: '2', cn: '客户编号', en: 'CUST_ID', rule: '客户在全行范围内的唯一标识,不可复用', kind: 'auth', codeName: '—', src: '标准手册.xlsx · 第 13 页', check: '通过', checkTone: 'green' },
  { id: '3', cn: '开户日期 open date', en: 'OPEN_DT', rule: '账户首次激活的日期,格式 YYYYMMDD', kind: 'auth', codeName: '—', src: '标准手册.xlsx · 第 15 页', check: '中文含英文', checkTone: 'amber' },
  { id: '4', cn: '账户状态', en: 'ACCT_STS_CD', rule: '见代码取值', kind: 'code', codeName: '01 正常 / 02 冻结 / 03 销户', src: '代码表.xlsx · 第 4 行', check: '通过', checkTone: 'green' },
  { id: '5', cn: '余额', en: 'BAL', rule: '参考字典引用,待核对业务规则', kind: 'dict', codeName: '—', src: '工作表「字典」(无文件名)', check: '出处不完整', checkTone: 'gray' },
  { id: '6', cn: '账户', en: 'ACCT', rule: '词根:账户', kind: 'root', codeName: '—', src: '词根表.csv · 第 21 行', check: '通过', checkTone: 'green' },
  { id: '7', cn: '客户号', en: 'CUST_ID', rule: '与「客户编号」英文名相同、中文不同', kind: 'auth', codeName: '—', src: '标准手册.xlsx · 第 13 页', check: '中文冲突', checkTone: 'red' },
]

const TABS: { id: 'all' | Kind; label: string; count: number }[] = [
  { id: 'all', label: '全部', count: 3040 },
  { id: 'auth', label: '权威标准', count: 2018 },
  { id: 'dict', label: '数据字典引用', count: 612 },
  { id: 'code', label: '代码取值', count: 304 },
  { id: 'root', label: '词根', count: 106 },
]

export function StandardsScreen() {
  const [tab, setTab] = useState<'all' | Kind>('all')
  const [q, setQ] = useState('')
  const [sel, setSel] = useState<Std | null>(null)
  const [importOpen, setImportOpen] = useState(false)
  const [page, setPage] = useState(1)

  const list = useMemo(
    () =>
      DATA.filter((d) => (tab === 'all' || d.kind === tab) && (q === '' || d.cn.includes(q) || d.en.toLowerCase().includes(q.toLowerCase()) || d.rule.includes(q))),
    [tab, q],
  )

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="资料与标准"
        title="标准库"
        subtitle="治理与开发共用同一标准库。分类分别统计,不用工作表行数虚增标准数量。"
        actions={
          <>
            <label className="relative">
              <span className="sr-only">搜索标准</span>
              <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="搜索中文名、英文名、规则"
                className="h-10 w-[280px] rounded-full border border-line bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-ink-mute focus:border-brand"
              />
            </label>
            <Btn variant="primary" className="h-10" onClick={() => setImportOpen(true)}>
              <UploadCloud className="size-4" />
              导入标准
            </Btn>
          </>
        }
      />

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: '权威标准', value: '2,018', note: '来源:标准手册.xlsx · 「标准」工作表有效行' },
          { label: '数据字典引用', value: '612', note: '来源:字典类工作表,未计入权威标准' },
          { label: '代码取值', value: '304', note: '来源:代码表,按取值记录统计' },
          { label: '词根', value: '106', note: '来源:词根表,用于规则命名拆分' },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <p className="text-xs text-ink-mute">{s.label}</p>
            <p className="mt-1 text-[28px] font-semibold tabular-nums leading-9">{s.value}</p>
            <p className="mt-1 text-xs leading-5 text-ink-soft">{s.note}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs<'all' | Kind> label="标准类型" items={TABS} value={tab} onChange={setTab} />
        <FlagTag>版本管理 · 后续能力</FlagTag>
      </div>

      <div className="flex items-start gap-4">
        <Card as="div" className="min-w-0 flex-1 overflow-hidden">
          <div className="scroll-thin overflow-x-auto">
            <table className="w-full min-w-[960px] table-fixed text-left text-[13px]">
              <caption className="sr-only">标准库列表</caption>
              <colgroup>
                <col className="w-[15%]" />
                <col className="w-[12%]" />
                <col className="w-[24%]" />
                <col className="w-[11%]" />
                <col className="w-[14%]" />
                <col className="w-[13%]" />
                <col className="w-[11%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-line text-ink-mute">
                  {['中文名', '英文名', '业务规则', '类型', '代码名称', '来源页 / 行', '校验'].map((h) => (
                    <th key={h} scope="col" className="h-12 px-4 font-medium first:pl-6">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {list.length === 0 && (
                  <tr>
                    <td colSpan={7} className="h-32 text-center text-ink-soft">
                      没有符合「{q}」的标准。
                      <button type="button" className="ml-2 font-semibold text-brand" onClick={() => { setQ(''); setTab('all') }}>清除条件</button>
                    </td>
                  </tr>
                )}
                {list.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSel(r)}
                    className={cn('h-[60px] cursor-pointer border-b border-line/70 hover:bg-brand-50', sel?.id === r.id && 'bg-brand-50')}
                  >
                    <td className="px-4 pl-6">
                      <button type="button" onClick={() => setSel(r)} className="block max-w-full truncate text-left font-semibold" title={r.cn}>
                        {r.cn}
                      </button>
                    </td>
                    <td className="px-4"><span className="block truncate font-mono text-[12.5px]" title={r.en}>{r.en}</span></td>
                    <td className="px-4"><span className="block truncate text-ink-soft" title={r.rule}>{r.rule}</span></td>
                    <td className="px-4"><Tag tone="purple" dot={false}>{KIND_LABEL[r.kind]}</Tag></td>
                    <td className="px-4"><span className="block truncate" title={r.codeName}>{r.codeName}</span></td>
                    <td className="px-4"><span className="block truncate text-ink-soft" title={r.src}>{r.src}</span></td>
                    <td className="px-4"><Tag tone={r.checkTone}>{r.check}</Tag></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <footer className="flex items-center justify-between border-t border-line px-6 py-3 text-xs text-ink-mute">
            <span>第 1–{list.length} 条 · 当前类型共 {tab === 'all' ? '3,040' : TABS.find((t) => t.id === tab)?.count.toLocaleString()} 条</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="上一页" disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-brand-50 disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              {[1, 2, 3].map((n) => (
                <button key={n} type="button" onClick={() => setPage(n)} aria-current={page === n ? 'page' : undefined} className={cn('size-8 rounded-full text-[13px] font-semibold', page === n ? 'bg-ink text-white' : 'text-ink-soft hover:bg-brand-50')}>{n}</button>
              ))}
              <button type="button" aria-label="下一页" onClick={() => setPage((p) => p + 1)} className="grid size-8 place-items-center rounded-full border border-line bg-white hover:bg-brand-50"><ChevronRight className="size-4" /></button>
            </div>
          </footer>
        </Card>

        {sel && (
          <Card as="div" className="sticky top-0 w-[320px] shrink-0">
            <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-5">
              <div className="min-w-0">
                <SectionLabel>标准原文与规则</SectionLabel>
                <h3 className="mt-1 text-[17px] font-semibold leading-6">{sel.cn}</h3>
                <p className="font-mono text-xs text-ink-mute">{sel.en}</p>
              </div>
              <button type="button" onClick={() => setSel(null)} aria-label="关闭详情" className="grid size-8 shrink-0 place-items-center rounded-full bg-brand-50 text-ink-soft hover:bg-brand-100"><X className="size-4" /></button>
            </header>
            <div className="flex flex-col gap-4 px-5 pb-5">
              <div className="flex flex-wrap gap-1.5">
                <Tag tone="purple" dot={false}>{KIND_LABEL[sel.kind]}</Tag>
                <Tag tone={sel.checkTone}>{sel.check}</Tag>
              </div>
              <div className="rounded-2xl bg-panel p-4">
                <p className="text-xs text-ink-mute">业务规则</p>
                <p className="mt-1 text-[14px] leading-6">{sel.rule}</p>
              </div>
              {sel.check === '中文含英文' && (
                <Notice tone="amber" icon={<TriangleAlert className="size-4" />}>中文原文含英文,已<b>原样保留并标记</b>,未改写为所谓原标准。</Notice>
              )}
              {sel.check === '中文冲突' && (
                <Notice tone="red" icon={<TriangleAlert className="size-4" />}>与「客户编号」英文名相同、中文不同。同名规则冲突治理为后续能力。</Notice>
              )}
              <dl>
                <KV k="代码名称" v={sel.codeName} />
                <KV k="来源" v={sel.src} />
              </dl>
              {sel.src.includes('无文件名') && (
                <p className="flex items-start gap-1.5 text-xs leading-5 text-ink-mute">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  老记录只有工作表出处,不虚构文件名。
                </p>
              )}
            </div>
          </Card>
        )}
      </div>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} titleId="std-import-title" width="max-w-[640px]">
        <ModalHeader id="std-import-title" icon={<UploadCloud className="size-5" />} title="导入标准" sub="标准手册.xlsx · 逐页识别结果" onClose={() => setImportOpen(false)} />
        <div className="flex flex-col gap-4 px-7 py-5">
          <div className="overflow-hidden rounded-2xl border border-line">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-panel text-ink-mute">
                <tr>
                  {['工作表', '识别类型', '有效', '新增', '重复', '无效', '中文冲突'].map((h) => (
                    <th key={h} scope="col" className="h-10 px-3 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  ['标准', '权威标准', 2018, 1840, 178, 12, 3],
                  ['字典', '数据字典引用', 612, 590, 22, 0, 0],
                  ['代码', '代码取值', 304, 304, 0, 0, 0],
                  ['说明', '无法识别', 0, 0, 0, 41, 0],
                ].map((r) => (
                  <tr key={String(r[0])} className="h-11 border-t border-line/70">
                    {r.map((c, i) => (
                      <td key={i} className={cn('px-3', i > 1 && 'tabular-nums')}>{c}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Notice tone="amber" icon={<Info className="size-4" />}>
            重复导入<b>保留首次入库记录</b>,不会覆盖为更新版本。178 条重复已跳过。
          </Notice>
        </div>
        <footer className="flex justify-end gap-3 border-t border-line bg-cream px-7 py-4">
          <Btn variant="white" className="h-10 px-5" onClick={() => setImportOpen(false)}>关闭</Btn>
        </footer>
      </Modal>
    </div>
  )
}
