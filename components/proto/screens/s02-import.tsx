'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CircleAlert,
  FileSpreadsheet,
  FileText,
  FileX2,
  HardDrive,
  Loader2,
  Lock,
  RotateCcw,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react'
import {
  Btn,
  Card,
  CardHeader,
  FlagTag,
  Modal,
  Notice,
  PageHeader,
  ProgressBar,
  RingLoader,
  Segmented,
  Tag,
  type Tone,
} from '../ui'
import { useStore } from '../store'

type Phase = 'empty' | 'running' | 'cancelling' | 'partial' | 'done'

const FORMATS = ['SQL', 'XLS', 'XLSX', 'CSV', 'TSV', 'TXT']

type FileRow = {
  name: string
  size: string
  fmt: string
  state: 'ok' | 'running' | 'kept' | 'skipped' | 'unsupported' | 'queued'
  stage: string
  result: string
}

function rowsFor(phase: Phase): FileRow[] {
  if (phase === 'empty') return []
  const running = phase === 'running'
  const cancelling = phase === 'cancelling'
  const partial = phase === 'partial'
  return [
    { name: '核心系统导出_账户.xlsx', size: '4.2 MB', fmt: 'XLSX', state: 'ok', stage: '已识别', result: '86 张表 · 1,284 个字段' },
    {
      name: '信贷_数据字典.csv',
      size: '38.6 MB',
      fmt: 'CSV',
      state: running ? 'running' : cancelling ? 'running' : partial ? 'kept' : 'ok',
      stage: running ? '解析字段定义' : cancelling ? '正在停止' : partial ? '已取消,保留已提交批次' : '已识别',
      result: running ? '已处理 62,400 行' : cancelling ? '正在提交最后一批' : partial ? '41 张表 · 620 个字段' : '41 张表 · 620 个字段',
    },
    {
      name: '取数SQL模板_月报.sql',
      size: '18 KB',
      fmt: 'SQL',
      state: running || cancelling ? 'queued' : 'skipped',
      stage: running || cancelling ? '排队中' : '已跳过',
      result: running || cancelling ? '等待处理' : '取数模板不是查询结果,未识别字段',
    },
    {
      name: '系统连接清单.txt',
      size: '3 KB',
      fmt: 'TXT',
      state: running || cancelling ? 'queued' : 'skipped',
      stage: running || cancelling ? '排队中' : '已跳过',
      result: running || cancelling ? '等待处理' : '连接清单不含表字段定义',
    },
    {
      name: '数据架构说明.pdf',
      size: '2.1 MB',
      fmt: 'PDF',
      state: 'unsupported',
      stage: '当前不支持',
      result: 'PDF / 扫描件识别尚未接入',
    },
  ]
}

const stateTone: Record<FileRow['state'], Tone> = {
  ok: 'green',
  running: 'purple',
  kept: 'amber',
  skipped: 'amber',
  unsupported: 'red',
  queued: 'gray',
}

export function ImportScreen() {
  const { go } = useStore()
  const [phase, setPhase] = useState<Phase>('empty')
  const [processed, setProcessed] = useState(0)

  useEffect(() => {
    if (phase !== 'running') return
    setProcessed(18200)
    const t = setInterval(() => setProcessed((p) => p + 3100), 500)
    const done = setTimeout(() => setPhase('done'), 7000)
    return () => {
      clearInterval(t)
      clearTimeout(done)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'cancelling') return
    const t = setTimeout(() => setPhase('partial'), 1800)
    return () => clearTimeout(t)
  }, [phase])

  const rows = rowsFor(phase)
  const busy = phase === 'running' || phase === 'cancelling'

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="元数据治理 / 导入资料"
        title="导入资料"
        badge={
          phase === 'partial' ? (
            <Tag tone="amber">数据集不完整</Tag>
          ) : phase === 'done' ? (
            <Tag tone="green">识别完成</Tag>
          ) : phase === 'empty' ? (
            <Tag tone="gray">未开始</Tag>
          ) : (
            <Tag tone="purple">处理中</Tag>
          )
        }
        subtitle="一次选择多份文件。文件只在本机解析,原文件保持不变,不会执行其中的 SQL 或指令。"
        actions={
          <div className="w-[420px]">
            <Segmented<Phase>
              label="演示状态"
              value={phase}
              onChange={setPhase}
              items={[
                { id: 'empty', label: '空态' },
                { id: 'running', label: '导入中' },
                { id: 'partial', label: '已取消' },
                { id: 'done', label: '完成' },
              ]}
            />
          </div>
        }
      />

      <div className="grid grid-cols-[minmax(0,1fr)_320px] gap-5">
        <div className="flex min-w-0 flex-col gap-5">
          <Card>
            <CardHeader
              title="选择文件"
              sub="支持多选;其他格式会明确提示当前支持情况"
              right={<FlagTag>PDF / OCR · 待接入</FlagTag>}
            />
            <div className="p-6 pt-4">
              <div className="flex items-center gap-5 rounded-2xl border-2 border-dashed border-[#d9d3bd] bg-[#fbfaf5] px-6 py-6">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white text-brand shadow-[0_6px_16px_-8px_rgba(23,23,26,0.5)]">
                  <UploadCloud className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-semibold">拖入文件,或从本机选择</p>
                  <p className="mt-1 text-[13px] leading-5 text-ink-soft">
                    文件在本机完成解析,<b className="text-ink">不会上传到云端</b>。
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {FORMATS.map((f) => (
                      <span key={f} className="rounded-md border border-line bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
                <Btn variant="primary" className="h-11 px-6" disabled={busy} onClick={() => setPhase('running')}>
                  选择合成演示文件
                </Btn>
              </div>
              <p className="mt-3 flex items-center gap-2 text-xs text-ink-mute">
                <FlagTag>合成演示</FlagTag>
                演示入口不会读取你电脑上的业务附件,也不会混入真实工作区。
              </p>
            </div>
          </Card>

          {phase === 'partial' && (
            <Notice tone="amber" icon={<CircleAlert className="size-4" />}>
              <p className="font-semibold">导入已取消,数据集标记为「不完整」</p>
              <p className="mt-0.5">
                已提交的 <b>41 张表、620 个字段</b> 已保留;未处理部分没有写入。可以查看或删除该数据集,再重新选择文件导入(不承诺按原位置断点续传)。
              </p>
              <div className="mt-3 flex gap-2">
                <Btn variant="white" size="sm" onClick={() => go(3)}>查看已导入内容</Btn>
                <Btn variant="white" size="sm" onClick={() => go(4)}>
                  <Trash2 className="size-3.5" />
                  前往删除不完整数据集
                </Btn>
                <Btn variant="soft" size="sm" onClick={() => setPhase('empty')}>
                  <RotateCcw className="size-3.5" />
                  重新选择文件
                </Btn>
              </div>
            </Notice>
          )}

          {phase === 'done' && (
            <Notice tone="amber" icon={<CircleAlert className="size-4" />}>
              <p className="font-semibold">识别完成,但有 3 份文件未产生字段</p>
              <p className="mt-0.5">整体不显示为「全部成功」。取数 SQL 模板、系统连接清单不等同于查询结果,PDF 当前不支持。</p>
            </Notice>
          )}

          <Card as="div" className="overflow-hidden">
            <CardHeader title="本次文件" sub={rows.length ? `${rows.length} 份文件 · 逐份显示状态与原因` : '尚未选择文件'} />
            {rows.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-brand-50 text-brand">
                  <FileText className="size-5" />
                </span>
                <p className="text-[14px] font-semibold">还没有选择任何文件</p>
                <p className="max-w-[360px] text-[13px] leading-5 text-ink-soft">
                  选择后这里会显示文件名、当前阶段、识别的表/字段数、跳过原因,并可取消。
                </p>
              </div>
            ) : (
              <ul className="mt-3 divide-y divide-line/70 border-t border-line/70">
                {rows.map((r) => {
                  const Icon = r.state === 'unsupported' ? FileX2 : r.fmt === 'XLSX' || r.fmt === 'CSV' ? FileSpreadsheet : FileText
                  return (
                    <li key={r.name} className="flex items-center gap-4 px-6 py-3.5">
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                        <Icon className="size-[18px]" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[13px] font-semibold">
                          <span className="truncate" title={r.name}>{r.name}</span>
                          <span className="shrink-0 text-xs font-normal text-ink-mute">{r.size}</span>
                        </p>
                        <p className="mt-0.5 truncate text-xs text-ink-soft">{r.result}</p>
                        {r.state === 'running' && (
                          <ProgressBar indeterminate label="解析进度,总量未知" className="mt-2 max-w-[360px]" />
                        )}
                      </div>
                      <Tag tone={stateTone[r.state]} dot={r.state !== 'running'}>
                        {r.state === 'running' && <Loader2 className="size-3 animate-spin" />}
                        {r.stage}
                      </Tag>
                      {r.state === 'running' && phase === 'running' ? (
                        <Btn variant="white" size="sm" onClick={() => setPhase('cancelling')}>取消</Btn>
                      ) : (
                        <span className="w-[52px]" aria-hidden />
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="识别结果" sub="当前数据集范围" />
            <dl className="grid grid-cols-2 gap-3 p-6 pt-4">
              {[
                { k: '表', v: phase === 'done' ? '127' : phase === 'partial' ? '127' : '—' },
                { k: '字段', v: phase === 'done' ? '1,904' : phase === 'partial' ? '1,904' : '—' },
                { k: '跳过记录', v: phase === 'done' || phase === 'partial' ? '3' : '—' },
                { k: '失败文件', v: phase === 'done' || phase === 'partial' ? '1' : '—' },
              ].map((x) => (
                <div key={x.k} className="rounded-2xl bg-[#f7f5ec] px-4 py-3">
                  <dt className="text-xs text-ink-mute">{x.k}</dt>
                  <dd className="mt-0.5 text-[22px] font-semibold tabular-nums leading-8">{x.v}</dd>
                </div>
              ))}
            </dl>
            <div className="px-6 pb-6">
              <Btn variant="primary" className="w-full" disabled={phase !== 'done' && phase !== 'partial'} onClick={() => go(3)}>
                查看识别结果
                <ArrowRight className="size-4" />
              </Btn>
            </div>
          </Card>

          <Card>
            <CardHeader title="跳过原因" />
            <ul className="space-y-3 p-6 pt-3 text-[13px]">
              {[
                ['取数 SQL 模板', '不含查询结果,不作为字段来源'],
                ['系统连接清单', '只有连接信息,无表字段定义'],
                ['PDF / 扫描件', '当前不支持,请转为 XLSX / CSV'],
              ].map(([k, v]) => (
                <li key={k} className="flex gap-3">
                  <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-[#f08a1a]" />
                  <p className="leading-5">
                    <b className="font-semibold">{k}</b>
                    <span className="block text-xs text-ink-soft">{v}</span>
                  </p>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <div className="flex items-start gap-3 p-5">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand">
                <Lock className="size-4" />
              </span>
              <div className="text-[13px] leading-5">
                <p className="font-semibold">资料边界</p>
                <p className="mt-0.5 flex items-start gap-1.5 text-ink-soft">
                  <HardDrive className="mt-0.5 size-3.5 shrink-0" />
                  所有资料默认留在本机。大文件在后台处理,窗口可继续操作。
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Modal open={busy} onClose={() => {}} closable={false} titleId="import-run-title" width="max-w-[460px]">
        <div className="flex flex-col items-center gap-5 px-8 py-9 text-center">
          <RingLoader size={64} />
          <div>
            <h2 id="import-run-title" className="text-[18px] font-semibold">
              {phase === 'cancelling' ? '正在停止导入…' : '正在导入元数据'}
            </h2>
            <p className="mt-1 text-[13px] text-ink-soft">
              {phase === 'cancelling' ? '请稍候,不要重复提交' : '信贷_数据字典.csv · 解析字段定义'}
            </p>
          </div>
          <div className="w-full rounded-2xl bg-[#f7f5ec] p-4 text-left text-[13px]">
            {phase === 'cancelling' ? (
              <p className="leading-5 text-ink-soft">
                正在提交最后一批。<b className="text-ink">已提交的数据会保留</b>,数据集将标记为不完整,之后可查看或删除。
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-ink-soft">已处理</span>
                  <span className="font-semibold tabular-nums">{processed.toLocaleString()} 行</span>
                </div>
                <ProgressBar indeterminate label="导入进度,总量未知" className="mt-2.5" />
                <p className="mt-2.5 text-xs text-ink-mute">总量未知,不显示百分比。窗口可继续响应。</p>
              </>
            )}
          </div>
          <Btn variant="white" className="h-10 px-6" disabled={phase === 'cancelling'} onClick={() => setPhase('cancelling')}>
            <X className="size-4" />
            {phase === 'cancelling' ? '停止中…' : '取消导入'}
          </Btn>
        </div>
      </Modal>
    </div>
  )
}
