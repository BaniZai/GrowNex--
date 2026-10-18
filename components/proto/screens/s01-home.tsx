'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Code2,
  FileText,
  FolderOpen,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AgentBanner,
  Btn,
  Card,
  CardHeader,
  FlagTag,
  Modal,
  ModalHeader,
  Notice,
  PillTabs,
  Tag,
  Toast,
  type Tone,
} from '../ui'
import { useStore, type RecentTask, type ScreenId } from '../store'

const STARTERS: { title: string; desc: string; icon: React.ReactNode; target: ScreenId }[] = [
  { title: '补全表字段注释', desc: '导入源系统导出,匹配标准并生成待审核的中文注释', icon: <ShieldCheck className="size-5" />, target: 2 },
  { title: '根据需求开发数据', desc: '描述业务目标,检索字典、核对口径、生成加工代码', icon: <Code2 className="size-5" />, target: 7 },
  { title: '解读制度通知', desc: '上传通知并结合现状,输出依据、影响与行动建议', icon: <FileText className="size-5" />, target: 9 },
]

const statusMeta: Record<RecentTask['status'], { label: string; tone: Tone }> = {
  review: { label: '完成待审核', tone: 'amber' },
  confirm: { label: '待确认口径', tone: 'amber' },
  done: { label: '已完成', tone: 'green' },
  running: { label: '执行中', tone: 'purple' },
  failed: { label: '打开失败', tone: 'red' },
}

const typeIcon = { 治理: ShieldCheck, 开发: Code2, 制度: FileText }

type FilterId = 'all' | 'todo' | 'running' | 'done'

const CHEERS = [
  '每一条被治理的数据,都在让下游更可靠。',
  '今天的每个口径,都会成为团队明天的共识。',
  '好数据不是偶然,是你一次次认真确认的结果。',
  '你的专业判断,是这个平台最宝贵的部分。',
  '把复杂留给我们,把判断留给你,一起把活干漂亮。',
]

function greetingFor(hour: number) {
  if (hour < 6) return '夜深了'
  if (hour < 11) return '早上好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

function WelcomeHero({ todo, running, done }: { todo: number; running: number; done: number }) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
  }, [])

  const greeting = now ? greetingFor(now.getHours()) : '你好'
  const cheer = CHEERS[(now ? now.getDay() : 0) % CHEERS.length]
  const dateText = now
    ? `${now.getMonth() + 1} 月 ${now.getDate()} 日 · 星期${'日一二三四五六'[now.getDay()]}`
    : '今天'

  const stats = [
    { label: '待你确认', value: todo, hot: true },
    { label: '正在执行', value: running, hot: false },
    { label: '已经完成', value: done, hot: false },
  ]

  return (
    <section
      aria-label="欢迎"
      className="flex flex-wrap items-end justify-between gap-x-10 gap-y-5 px-1 pt-1"
    >
      <div className="min-w-0 max-w-[620px]">
        <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-ink-mute">{dateText}</p>
        <h1 className="mt-2 text-balance text-[40px] font-light leading-[1.15] tracking-tight text-ink">
          {greeting},
          <span className="font-semibold">林工</span>
          <span className="ml-1 inline-block h-2.5 w-2.5 rounded-full grad-fire align-middle" aria-hidden />
        </h1>
        <p className="mt-3 text-pretty text-[15px] leading-relaxed text-ink-soft">
          {cheer}
          {todo > 0 ? (
            <>
              {' '}今天有 <span className="font-semibold text-ink">{todo} 项</span>在等你拍板,我们已经准备好了。
            </>
          ) : (
            ' 今天的待办已经清空,可以开始新的任务了。'
          )}
        </p>
      </div>

      <dl className="flex items-end gap-9">
        {stats.map((s) => (
          <div key={s.label} className="flex flex-col">
            <dd
              className={cn(
                'text-[56px] font-extralight leading-none tabular-nums tracking-tight',
                s.hot ? 'text-ink' : 'text-ink/70',
              )}
            >
              {s.value}
              {s.hot && s.value > 0 && (
                <span className="relative -top-6 ml-1 inline-block size-2.5 rounded-full grad-fire" aria-hidden />
              )}
            </dd>
            <dt className="mt-1.5 text-[12px] font-medium text-ink-mute">{s.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  )
}

export function HomeScreen() {
  const { recents, removeRecent, resetRecents, go } = useStore()
  const [filter, setFilter] = useState<FilterId>('all')
  const [q, setQ] = useState('')
  const [newOpen, setNewOpen] = useState(false)
  const [taskType, setTaskType] = useState('治理')
  const [desc, setDesc] = useState('')
  const [target, setTarget] = useState<RecentTask | null>(null)
  const [failedSave, setFailedSave] = useState(false)
  const [toast, setToast] = useState<'ok' | 'fail' | null>(null)
  const [openFail, setOpenFail] = useState<RecentTask | null>(null)

  const counts = useMemo(
    () => ({
      all: recents.length,
      todo: recents.filter((r) => r.status === 'review' || r.status === 'confirm').length,
      running: recents.filter((r) => r.status === 'running').length,
      done: recents.filter((r) => r.status === 'done' || r.status === 'failed').length,
    }),
    [recents],
  )

  const list = recents.filter((r) => {
    const f =
      filter === 'all' ||
      (filter === 'todo' && (r.status === 'review' || r.status === 'confirm')) ||
      (filter === 'running' && r.status === 'running') ||
      (filter === 'done' && (r.status === 'done' || r.status === 'failed'))
    return f && (q === '' || r.title.includes(q))
  })

  const typeCounts = (['治理', '开发', '制度'] as const).map((t) => ({
    t,
    n: recents.filter((r) => r.type === t).length,
  }))
  const colors = ['var(--ink)', 'var(--accent)', 'var(--accent-100)']

  const confirmRemove = () => {
    if (!target) return
    if (failedSave) {
      setFailedSave(false)
      setTarget(null)
      setToast('fail')
      return
    }
    removeRecent(target.id)
    setTarget(null)
    setToast('ok')
  }

  const C = 2 * Math.PI * 38
  let offset = 0

  return (
    <div className="flex flex-col gap-5">
      <WelcomeHero todo={counts.todo} running={counts.running} done={counts.done} />
      <div className="grid grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)] gap-5">
        <Card>
          <CardHeader
            title="从这里开始"
            sub="描述任务、附上资料,或直接选择一个方向"
            right={<FlagTag>对话式编排 · 待增强</FlagTag>}
          />
          <div className="grid grid-cols-3 gap-3 p-6 pt-4">
            {STARTERS.map((s) => (
              <button
                key={s.title}
                type="button"
                onClick={() => go(s.target)}
                className="group flex flex-col gap-3 rounded-2xl border border-line bg-cream p-4 text-left transition-colors hover:border-dash hover:bg-brand-50"
              >
                <span className="grid size-10 place-items-center rounded-xl bg-white text-brand shadow-[0_2px_8px_-2px_rgba(23,23,26,0.25)]">
                  {s.icon}
                </span>
                <span>
                  <span className="block text-[14px] font-semibold text-ink">{s.title}</span>
                  <span className="mt-1 block text-xs leading-5 text-ink-soft">{s.desc}</span>
                </span>
                <span className="mt-auto flex items-center gap-1 text-xs font-semibold text-brand">
                  开始 <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </button>
            ))}
          </div>
          <div className="mx-6 mb-6 flex items-center gap-3 rounded-2xl border border-dashed border-dash bg-white px-4 py-3">
            <Paperclip className="size-4 shrink-0 text-ink-mute" />
            <p className="min-w-0 flex-1 text-[13px] text-ink-soft">
              或先选择附件:支持 SQL、XLS、XLSX、CSV、TSV、TXT、MD、DOCX。文件仅在本机解析,不会上传云端。
            </p>
            <Btn variant="soft" size="sm" onClick={() => go(2)}>
              选择文件
            </Btn>
          </div>
        </Card>

        <Card>
          <CardHeader title="最近任务分布" right={<span className="text-xs text-ink-mute">共 {recents.length} 项</span>} />
          <div className="flex items-center gap-5 p-6 pt-4">
            <svg viewBox="0 0 100 100" className="size-[112px] shrink-0 -rotate-90" role="img" aria-label="最近任务类型分布">
              <circle cx="50" cy="50" r="38" fill="none" style={{ stroke: 'var(--panel2)' }} strokeWidth="12" />
              {typeCounts.map((c, i) => {
                const len = (c.n / Math.max(recents.length, 1)) * C
                const el = (
                  <circle
                    key={c.t}
                    cx="50"
                    cy="50"
                    r="38"
                    fill="none"
                    style={{ stroke: colors[i] }}
                    strokeWidth="12"
                    strokeDasharray={`${Math.max(len - 2, 0)} ${C}`}
                    strokeDashoffset={-offset}
                    strokeLinecap="round"
                  />
                )
                offset += len
                return el
              })}
            </svg>
            <ul className="min-w-0 flex-1 space-y-2.5 text-[13px]">
              {typeCounts.map((c, i) => (
                <li key={c.t} className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full" style={{ background: colors[i] }} />
                  <span className="flex-1 text-ink-soft">{c.t}</span>
                  <span className="font-semibold tabular-nums text-ink">{c.n}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="mx-6 mb-6">
            <Notice tone="amber" icon={<TriangleAlert className="size-4" />}>
              最近任务是<b>结果历史</b>,尚不是可断点恢复的完整会话。
            </Notice>
          </div>
        </Card>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs<FilterId>
          label="任务筛选"
          value={filter}
          onChange={setFilter}
          items={[
            { id: 'all', label: '全部', count: counts.all },
            { id: 'todo', label: '待确认', count: counts.todo },
            { id: 'running', label: '执行中', count: counts.running },
            { id: 'done', label: '已完成 / 失败', count: counts.done },
          ]}
        />
        <div className="flex items-center gap-2">
          <label className="relative">
            <span className="sr-only">搜索最近任务</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-mute" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索最近任务"
              className="h-10 w-[220px] rounded-full border border-line bg-white pl-10 pr-4 text-[13px] outline-none placeholder:text-ink-mute focus:border-brand"
            />
          </label>
          <Btn variant="primary" className="h-10" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            新建任务
          </Btn>
        </div>
      </div>

      <AgentBanner
        eyebrow="本地规则模式"
        icon={<Sparkles className="size-4" />}
        action={
          <Btn variant="white" className="h-9" onClick={() => go(10)}>
            配置模型
            <ArrowRight className="size-4" />
          </Btn>
        }
      >
        未配置模型:仅使用本地规则与标准库匹配,结果不会标注为「AI 已完成分析」。
      </AgentBanner>

      <Card as="div" className="overflow-hidden">
        {recents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand">
              <FolderOpen className="size-6" />
            </span>
            <h3 className="text-[16px] font-semibold">还没有最近任务</h3>
            <p className="max-w-[360px] text-[13px] leading-5 text-ink-soft">
              ��上方选择一个任务方向,或导入资料开始。这里不会出现虚构的任务或模型调用记录。
            </p>
            <Btn variant="primary" onClick={() => setNewOpen(true)}>
              <Plus className="size-4" />
              新建任务
            </Btn>
          </div>
        ) : (
          <table className="w-full table-fixed text-left text-[13px]">
            <caption className="sr-only">最近任务列表</caption>
            <colgroup>
              <col className="w-[42%]" />
              <col className="w-[10%]" />
              <col className="w-[14%]" />
              <col className="w-[18%]" />
              <col className="w-[16%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-line text-ink-mute">
                <th scope="col" className="h-12 px-6 font-medium">任务</th>
                <th scope="col" className="font-medium">类型</th>
                <th scope="col" className="font-medium">时间</th>
                <th scope="col" className="font-medium">状态</th>
                <th scope="col" className="pr-6 text-right font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="h-24 px-6 text-center text-ink-soft">
                    没有符合「{q || '当前筛选'}」的任务。
                    <button type="button" className="ml-2 font-semibold text-brand" onClick={() => { setQ(''); setFilter('all') }}>
                      清除条件
                    </button>
                  </td>
                </tr>
              )}
              {list.map((r) => {
                const Icon = typeIcon[r.type]
                const m = statusMeta[r.status]
                return (
                  <tr key={r.id} className="h-[68px] border-b border-line/70 last:border-b-0 hover:bg-cream">
                    <td className="px-6">
                      <button
                        type="button"
                        onClick={() => (r.fileMissing ? setOpenFail(r) : go(r.type === '治理' ? 3 : r.type === '开发' ? 8 : 9))}
                        className="flex w-full items-center gap-3 text-left"
                        title={r.title}
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                          <Icon className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{r.title}</span>
                          <span className="block truncate text-xs text-ink-mute">{r.detail}</span>
                        </span>
                      </button>
                    </td>
                    <td className="text-ink-soft">{r.type}</td>
                    <td className="whitespace-nowrap text-ink-mute">{r.time}</td>
                    <td>
                      <Tag tone={m.tone}>{m.label}</Tag>
                    </td>
                    <td className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          disabled={r.status === 'running'}
                          onClick={() => setTarget(r)}
                          title={r.status === 'running' ? '任务执行中,不能移除' : '移除最近任务'}
                          className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium text-ink-soft hover:bg-[#fdecef] hover:text-[#b4233a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-ink-soft"
                        >
                          <Trash2 className="size-3.5" />
                          移除
                        </button>
                        <button type="button" aria-label="更多操作" className="grid size-8 place-items-center rounded-full text-ink-mute hover:bg-brand-50">
                          <MoreHorizontal className="size-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {recents.length > 0 && (
          <footer className="flex items-center justify-between border-t border-line px-6 py-3.5 text-xs text-ink-mute">
            <span>
              显示 {list.length} / 共 {recents.length} 项 · 执行中的任务不可移除,移除不等于取消任务
            </span>
            <span>
              演示数据均为合成内容 ·{' '}
              <button type="button" onClick={resetRecents} className="font-semibold text-brand hover:underline">
                恢复演示记录
              </button>
            </span>
          </footer>
        )}
      </Card>

      <Modal open={newOpen} onClose={() => setNewOpen(false)} titleId="new-task-title" width="max-w-[620px]">
        <ModalHeader
          id="new-task-title"
          icon={<Sparkles className="size-5" />}
          title="新建任务"
          sub="描述你要完成的工作,智能体会列出步骤并在关键处请你确认"
          onClose={() => setNewOpen(false)}
        />
        <div className="flex flex-col gap-5 px-7 py-6">
          <fieldset>
            <legend className="mb-2 text-[13px] font-semibold">任务类型</legend>
            <div className="flex flex-wrap gap-2">
              {['治理', '开发', '制度'].map((t) => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={taskType === t}
                  onClick={() => setTaskType(t)}
                  className={cn(
                    'h-9 rounded-full border px-4 text-[13px] font-medium',
                    taskType === t ? 'border-brand bg-brand-50 text-brand' : 'border-line text-ink hover:bg-brand-50',
                  )}
                >
                  {t === '治理' ? '元数据治理' : t === '开发' ? '数据开发' : '制度通知解读'}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="task-desc" className="mb-2 block text-[13px] font-semibold">
              你想完成什么?
            </label>
            <div className="rounded-2xl border-2 border-sun bg-white p-3 shadow-[0_0_0_4px_rgb(var(--ink-rgb)/0.08)]">
              <textarea
                id="task-desc"
                value={desc}
                maxLength={500}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="例如:为 CORE_ACCT 账户系统导出的 86 张表补全中文字段注释"
                className="h-24 w-full resize-none bg-transparent text-[14px] leading-6 outline-none placeholder:text-ink-mute"
              />
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand">
                  <Sparkles className="size-3.5" />
                  整理为清晰描述
                </span>
                <span className="text-xs tabular-nums text-ink-mute">{desc.length} / 500</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-panel px-4 py-4">
            <Paperclip className="size-4 text-ink-mute" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold">添加资料(可选)</p>
              <p className="text-xs text-ink-soft">文件保留原样,只解析内容,不会执行其中的 SQL 或指令</p>
            </div>
          </div>
        </div>
        <footer className="flex justify-end gap-3 border-t border-line bg-cream px-7 py-4">
          <Btn variant="white" className="h-11 px-6" onClick={() => setNewOpen(false)}>
            取消
          </Btn>
          <Btn
            variant="primary"
            className="h-11 px-6"
            onClick={() => {
              setNewOpen(false)
              go(taskType === '治理' ? 2 : taskType === '开发' ? 7 : 9)
            }}
          >
            开始任务
          </Btn>
        </footer>
      </Modal>

      <Modal open={!!target} onClose={() => setTarget(null)} titleId="remove-recent-title" width="max-w-[520px]">
        <ModalHeader id="remove-recent-title" icon={<Trash2 className="size-5" />} title="移除最近任务" sub={target?.title} />
        <div className="space-y-4 px-7 py-5">
          <p className="text-[14px] leading-6 text-ink-soft">
            只移除最近记录,<b className="text-ink">保留本地结果文件和当前工作区内容</b>。该操作不会取消任务,也不会删除引用的数据集。
          </p>
          <label className="flex items-center gap-2 text-xs text-ink-mute">
            <input type="checkbox" checked={failedSave} onChange={(e) => setFailedSave(e.target.checked)} className="size-3.5 accent-ink" />
            演示:模拟保存失败(AC-07)
          </label>
        </div>
        <footer className="flex justify-end gap-3 border-t border-line bg-cream px-7 py-4">
          <Btn variant="white" className="h-10 px-5" autoFocus onClick={() => setTarget(null)}>
            取消
          </Btn>
          <Btn variant="danger" className="h-10 px-5" onClick={confirmRemove}>
            移除记录
          </Btn>
        </footer>
      </Modal>

      <Modal open={!!openFail} onClose={() => setOpenFail(null)} titleId="open-fail-title" width="max-w-[480px]">
        <ModalHeader id="open-fail-title" icon={<TriangleAlert className="size-5" />} title="无法打开结果" sub={openFail?.title} />
        <p className="px-7 py-5 text-[14px] leading-6 text-ink-soft">
          结果文件已不在原保存位置,可能被移动或删除。不会生成空白结果。你可以移除这条记录,或重新发起任务。
        </p>
        <footer className="flex justify-end gap-3 border-t border-line bg-cream px-7 py-4">
          <Btn variant="white" onClick={() => setOpenFail(null)}>知道了</Btn>
          <Btn variant="primary" onClick={() => { setTarget(openFail); setOpenFail(null) }}>移除这条记录</Btn>
        </footer>
      </Modal>

      <Toast
        show={toast === 'ok'}
        title="已移除最近任务"
        body="结果文件仍保留在本地,其他记录可正常打开。"
        onClose={() => setToast(null)}
      />
      <Toast
        show={toast === 'fail'}
        title="保存失败,记录已保留"
        body="历史列表写入失败,未删除任何结果文件。可稍后重试。"
        icon={<TriangleAlert className="size-4" />}
        onClose={() => setToast(null)}
      />
    </div>
  )
}
