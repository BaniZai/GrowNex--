'use client'

import { useEffect, useState } from 'react'
import { Database, FlaskConical, Plus, RotateCcw, Trash2, TriangleAlert } from 'lucide-react'
import {
  Btn,
  Card,
  CardHeader,
  Modal,
  ModalHeader,
  Notice,
  PageHeader,
  ProgressBar,
  RingLoader,
  Tag,
  Toast,
} from '../ui'
import { useStore, type Dataset } from '../store'

type Stage = 'idle' | 'confirm' | 'deleting' | 'cancelled'

export function DatasetsScreen() {
  const { datasets, deleteDataset, resetDatasets, devSourceId, go } = useStore()
  const [picked, setPicked] = useState<string | null>(datasets[0]?.id ?? null)
  const [stage, setStage] = useState<Stage>('idle')
  const [toast, setToast] = useState<null | { name: string }>(null)
  const [rollbackToast, setRollbackToast] = useState(false)
  const [willCancel, setWillCancel] = useState(false)
  const [lastDeleted, setLastDeleted] = useState<Dataset | null>(null)

  const cur = datasets.find((d) => d.id === picked) ?? null
  const totalTables = datasets.reduce((a, d) => a + d.tables, 0)
  const totalFields = datasets.reduce((a, d) => a + d.fields, 0)
  const refByDev = !!cur && devSourceId === cur.id

  useEffect(() => {
    if (!picked || !datasets.find((d) => d.id === picked)) setPicked(datasets[0]?.id ?? null)
  }, [datasets, picked])

  useEffect(() => {
    if (stage !== 'deleting' || !cur) return
    const t = setTimeout(() => {
      if (willCancel) {
        setStage('cancelled')
        setWillCancel(false)
        setRollbackToast(true)
        return
      }
      setLastDeleted(cur)
      deleteDataset(cur.id)
      setStage('idle')
      setToast({ name: cur.name })
    }, 2200)
    return () => clearTimeout(t)
  }, [stage, cur, willCancel, deleteDataset])

  const busy = stage === 'deleting'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="元数据治理 / 数据集"
        title="数据集管理"
        subtitle={`当前统计范围:全部已导入数据集 · ${datasets.length} 个数据集 · ${totalTables} 张表 · ${totalFields.toLocaleString()} 个字段`}
        actions={
          <>
            <button
              type="button"
              onClick={() => { resetDatasets(); setPicked('d1') }}
              className="inline-flex h-10 items-center gap-2 rounded-full border border-line bg-white px-4 text-[13px] font-medium text-ink-soft hover:bg-brand-50"
            >
              <FlaskConical className="size-4" />
              恢复合成数据集
            </button>
            <Btn variant="primary" className="h-10" onClick={() => go(2)}>
              <Plus className="size-4" />
              导入资料
            </Btn>
          </>
        }
      />

      {datasets.length === 0 ? (
        <Card className="flex flex-col items-center gap-3 px-6 py-24 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-brand-50 text-brand">
            <Database className="size-6" />
          </span>
          <h3 className="text-[16px] font-semibold">还没有数据集</h3>
          <p className="max-w-[420px] text-[13px] leading-5 text-ink-soft">
            列表和统计已回到空态,没有旧行或过期数字。原始附件、标准库和已导出文件均已保留。
          </p>
          <Btn variant="primary" onClick={() => go(2)}>去导入资料</Btn>
        </Card>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
          <Card as="div" className="overflow-hidden">
            <CardHeader title="已导入数据集" sub="名称相同但来源或时间不同的导入会分别列出" />
            <ul role="radiogroup" aria-label="选择数据集" className="mt-4 divide-y divide-line/70 border-t border-line/70">
              {datasets.map((d) => {
                const on = d.id === picked
                return (
                  <li key={d.id}>
                    <button
                      type="button"
                      role="radio"
                      aria-checked={on}
                      disabled={busy}
                      onClick={() => setPicked(d.id)}
                      className={`flex w-full items-center gap-4 px-6 py-4 text-left transition-colors disabled:opacity-60 ${on ? 'bg-brand-50' : 'hover:bg-[#f6f8fa]'}`}
                    >
                      <span
                        aria-hidden
                        className={`grid size-[18px] shrink-0 place-items-center rounded-full border-2 ${on ? 'border-brand' : 'border-[#c9d2da]'}`}
                      >
                        {on && <span className="size-2 rounded-full bg-brand" />}
                      </span>
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand shadow-[0_2px_8px_-2px_rgba(23,23,26,0.25)]">
                        <Database className="size-[18px]" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-[14px] font-semibold">{d.name}</span>
                          {d.status === 'partial' ? <Tag tone="amber">不完整</Tag> : <Tag tone="green">完整</Tag>}
                          {devSourceId === d.id && <Tag tone="purple">开发草稿引用</Tag>}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink-soft">
                          来源:{d.source} · 导入 {d.time}
                        </span>
                        {d.note && <span className="mt-0.5 block text-xs text-[#9a4a00]">{d.note}</span>}
                      </span>
                      <span className="shrink-0 text-right text-xs text-ink-soft">
                        <span className="block text-[13px] font-semibold tabular-nums text-ink">{d.tables} 表</span>
                        {d.fields.toLocaleString()} 字段
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          </Card>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader title="当前数据集" sub="统计仅针对所选数据集" />
              {cur ? (
                <div className="p-6 pt-4">
                  <p className="text-[15px] font-semibold">{cur.name}</p>
                  <p className="mt-0.5 break-all text-xs text-ink-mute">{cur.source}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-[#f1f5f8] px-4 py-3">
                      <dt className="text-xs text-ink-mute">表</dt>
                      <dd className="text-[22px] font-semibold tabular-nums leading-8">{cur.tables}</dd>
                    </div>
                    <div className="rounded-2xl bg-[#f1f5f8] px-4 py-3">
                      <dt className="text-xs text-ink-mute">字段</dt>
                      <dd className="text-[22px] font-semibold tabular-nums leading-8">{cur.fields.toLocaleString()}</dd>
                    </div>
                  </dl>
                  <Btn
                    variant="danger"
                    className="mt-5 h-11 w-full"
                    disabled={!cur || busy}
                    onClick={() => setStage('confirm')}
                  >
                    <Trash2 className="size-4" />
                    删除当前数据集
                  </Btn>
                  <p className="mt-2 text-center text-xs text-ink-mute">整批删除;不提供单字段、批量或撤销</p>
                </div>
              ) : (
                <p className="p-6 text-[13px] text-ink-soft">请先选择一个数据集。</p>
              )}
            </Card>

            <Notice tone="purple" icon={<Database className="size-4" />}>
              删除不会影响:原始附件、标准库、已导出文件与历史交付物(历史结果是生成时的快照,不会被标记为已更新)。
            </Notice>
          </div>
        </div>
      )}

      <Modal open={stage === 'confirm' && !!cur} onClose={() => setStage('idle')} titleId="del-ds-title" width="max-w-[560px]">
        <ModalHeader
          id="del-ds-title"
          icon={<Trash2 className="size-5" />}
          title="删除数据集"
          sub="此操作不能直接恢复"
          onClose={() => setStage('idle')}
        />
        {cur && (
          <div className="flex flex-col gap-4 px-7 py-5">
            <div className="rounded-2xl bg-[#f1f5f8] p-4">
              <p className="text-[15px] font-semibold">{cur.name}</p>
              <p className="mt-0.5 text-xs text-ink-mute">{cur.source} · 导入 {cur.time}</p>
              <p className="mt-2 text-[13px]">
                将删除 <b className="tabular-nums">{cur.tables}</b> 张表、<b className="tabular-nums">{cur.fields.toLocaleString()}</b> 个字段
              </p>
            </div>
            <p className="text-[14px] leading-6 text-ink-soft">
              将清除数源本地该数据集及<b className="text-ink">注释建议、审核记录</b>;
              <b className="text-ink">原始附件、标准库和已导出文件保留</b>。
            </p>
            {refByDev && (
              <Notice tone="amber" icon={<TriangleAlert className="size-4" />}>
                开发草稿正在引用此数据集:业务需求和已填口径会保留,<b>来源选择与确认将失效</b>,需重新选取来源。
              </Notice>
            )}
            <label className="flex items-center gap-2 text-xs text-ink-mute">
              <input type="checkbox" checked={willCancel} onChange={(e) => setWillCancel(e.target.checked)} className="size-3.5 accent-[#0f1c2e]" />
              演示:提交前取消,验证整批回滚(AC-03)
            </label>
          </div>
        )}
        <footer className="flex justify-end gap-3 border-t border-line bg-[#f6f8fa] px-7 py-4">
          <Btn variant="white" className="h-10 px-6" autoFocus onClick={() => setStage('idle')}>
            取消
          </Btn>
          <Btn variant="danger" className="h-10 px-6" onClick={() => setStage('deleting')}>
            确认删除
          </Btn>
        </footer>
      </Modal>

      <Modal open={stage === 'deleting'} onClose={() => {}} closable={false} titleId="deleting-title" width="max-w-[440px]">
        <div className="flex flex-col items-center gap-5 px-8 py-9 text-center">
          <RingLoader size={64} />
          <div>
            <h2 id="deleting-title" className="text-[18px] font-semibold">
              {willCancel ? '正在取消删除…' : '正在删除数据集'}
            </h2>
            <p className="mt-1 text-[13px] text-ink-soft">{cur?.name}</p>
          </div>
          <div className="w-full rounded-2xl bg-[#f1f5f8] p-4 text-left text-[13px] leading-5 text-ink-soft">
            <ProgressBar indeterminate label="删除进度" className="mb-3" />
            按一个事务提交。提交前取消或失败时<b className="text-ink">整批保留</b>;提交后不能撤销。期间不能生成、审核或导出此数据集。
          </div>
          <Btn variant="white" className="h-10 px-6" disabled={willCancel} onClick={() => setWillCancel(true)}>
            提交前取消
          </Btn>
        </div>
      </Modal>

      <Toast
        show={!!toast}
        title={`已删除数据集「${toast?.name ?? ''}」`}
        body={`其他数据集保持不变;${lastDeleted ? lastDeleted.tables + ' 张表 / ' + lastDeleted.fields.toLocaleString() + ' 个字段' : ''}已移除。`}
        onClose={() => setToast(null)}
      />
      <Toast
        show={rollbackToast}
        title="已取消删除,数据集完整保留"
        body="没有留下孤立记录,选择与审核状态保持不变。"
        icon={<RotateCcw className="size-4" />}
        onClose={() => setRollbackToast(false)}
      />
    </div>
  )
}
