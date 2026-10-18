'use client'

import { useState } from 'react'
import {
  ArrowRight,
  CalendarClock,
  FileText,
  FileX2,
  Inbox,
  Quote,
  ScanText,
  Target,
  TriangleAlert,
  Upload,
  UserRound,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Btn, Card, CardHeader, FlagTag, Notice, PageHeader, PillTabs, SectionLabel, Tag } from '../ui'
import { useStore } from '../store'

type Mode = 'result' | 'input' | 'unsupported' | 'inbox'

export function PolicyScreen() {
  const { go } = useStore()
  const [mode, setMode] = useState<Mode>('result')
  const [text, setText] = useState('')
  const [status, setStatus] = useState('')

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        crumb="制度通知"
        title="制度通知解读"
        badge={mode === 'result' ? <Tag tone="green">已解读</Tag> : mode === 'unsupported' ? <Tag tone="red">格式不支持</Tag> : <Tag tone="gray">未开始</Tag>}
        subtitle="结果基于原文依据与行内现状,即使无需改动也会说明判断依据。"
        actions={
          <PillTabs<Mode>
            label="演示状态"
            value={mode}
            onChange={setMode}
            items={[
              { id: 'input', label: '输入' },
              { id: 'result', label: '解读结果' },
              { id: 'unsupported', label: 'PDF 提示' },
              { id: 'inbox', label: 'OA 来源' },
            ]}
          />
        }
      />

      {mode === 'input' && (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
          <Card>
            <CardHeader title="录入通知" sub="上传文件,或手工粘贴正文" right={<span className="text-xs text-ink-mute">TXT · MD · DOCX</span>} />
            <div className="flex flex-col gap-4 p-6 pt-4">
              <div className="flex items-center gap-4 rounded-2xl border-2 border-dashed border-[#cfc9c0] bg-[#f7f5f2] px-5 py-5">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-brand shadow-[0_6px_16px_-8px_rgba(23,23,26,0.5)]"><Upload className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold">拖入通知文件</p>
                  <p className="text-xs text-ink-soft">文件仅在本机解析。PDF、扫描件当前不支持,会明确提示。</p>
                </div>
                <Btn variant="soft" onClick={() => setMode('result')}>选择合成演示通知</Btn>
              </div>
              <div>
                <label htmlFor="policy-text" className="mb-2 block text-[13px] font-semibold">或手工录入正文</label>
                <textarea
                  id="policy-text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="粘贴通知正文…"
                  className="h-40 w-full resize-none rounded-2xl border border-line bg-white p-4 text-[14px] leading-6 outline-none placeholder:text-ink-mute focus:border-brand"
                />
              </div>
              <div>
                <label htmlFor="policy-status" className="mb-2 block text-[13px] font-semibold">行内现状(补充)</label>
                <textarea
                  id="policy-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  placeholder="例如:目前客户信息表已有 80% 字段完成注释"
                  className="h-20 w-full resize-none rounded-2xl border border-line bg-white p-4 text-[14px] leading-6 outline-none placeholder:text-ink-mute focus:border-brand"
                />
              </div>
              <div className="flex justify-end">
                <Btn variant="primary" className="h-11 px-6" disabled={text.trim().length === 0} onClick={() => setMode('result')}>
                  开始解读
                </Btn>
              </div>
            </div>
          </Card>
          <Notice tone="purple" icon={<FileText className="size-4" />} className="self-start">
            解读结果会包含:原文依据、适用性线索、影响范围、行动建议、期限与责任线索、待确认项。
          </Notice>
        </div>
      )}

      {mode === 'unsupported' && (
        <Card className="flex flex-col items-center gap-3 px-6 py-20 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-[#fdecef] text-[#a31f35]"><FileX2 className="size-6" /></span>
          <h3 className="text-[16px] font-semibold">暂不支持 PDF / 扫描件</h3>
          <p className="max-w-[420px] text-[13px] leading-6 text-ink-soft">
            「关于数据安全管理的通知.pdf」无法解析,<b className="text-ink">没有生成空白结果</b>。请转换为 TXT、MD 或 DOCX,或直接粘贴正文。
          </p>
          <div className="flex gap-2">
            <Btn variant="white" onClick={() => setMode('input')}>手工录入正文</Btn>
            <FlagTag className="h-9 px-4"><ScanText className="mr-1.5 size-3.5" />OCR · 待接入</FlagTag>
          </div>
        </Card>
      )}

      {mode === 'inbox' && (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
          <Card as="div" className="overflow-hidden">
            <CardHeader title="通知来源" sub="模拟 OA 必须标记为合成演示" right={<FlagTag>合成演示 · 非真实收件</FlagTag>} />
            <ul className="mt-4 divide-y divide-line/70 border-t border-line/70">
              {[
                ['关于加强数据治理工作的通知', '模拟 OA · 获取于 10-18 08:30', true],
                ['关于规范客户信息管理的通知', '模拟 OA · 获取于 10-18 08:30', true],
              ].map(([t, s]) => (
                <li key={String(t)} className="flex items-center gap-4 px-6 py-4">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><Inbox className="size-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold">{t}</p>
                    <p className="text-xs text-ink-mute">{s}</p>
                  </div>
                  <Btn variant="soft" size="sm" onClick={() => setMode('result')}>解读</Btn>
                </li>
              ))}
            </ul>
          </Card>
          <Card className="self-start p-5">
            <p className="text-[14px] font-semibold">真实来源状态</p>
            <ul className="mt-3 space-y-3 text-[13px]">
              <li className="flex items-center justify-between"><span>真实 OA</span><Tag tone="gray">尚未接入</Tag></li>
              <li className="flex items-center justify-between"><span>公开采集</span><Tag tone="gray">尚未接入</Tag></li>
            </ul>
            <p className="mt-3 text-xs leading-5 text-ink-soft">未接入时不会出现伪造的「最新收件」;接入后会显示来源、获取时间与失败状态。</p>
          </Card>
        </div>
      )}

      {mode === 'result' && (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] gap-5">
          <div className="flex min-w-0 flex-col gap-5">
            <Card>
              <CardHeader title="关于加强数据治理工作的通知" sub="合成演示通知 · TXT · 来源:本机文件" right={<FlagTag>合成演示</FlagTag>} />
              <div className="flex flex-col gap-4 p-6 pt-4">
                <div className="rounded-2xl bg-[#f2efea] p-5">
                  <SectionLabel className="flex items-center gap-1.5"><Quote className="size-3.5" />原文依据</SectionLabel>
                  <blockquote className="mt-2 border-l-2 border-[#ff5a1f] pl-4 text-[14px] leading-7">
                    各部门应于 <mark className="rounded bg-[#fff0c9] px-1">11 月 30 日前</mark>完成核心业务系统表字段的中文注释补全,并由数据管理部门统一审核。
                  </blockquote>
                  <p className="mt-2 text-xs text-ink-mute">第 2 段 · 第 1 句</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-2xl border border-line p-4">
                    <SectionLabel className="flex items-center gap-1.5"><Target className="size-3.5" />适用性线索</SectionLabel>
                    <p className="mt-2 text-[13px] leading-6">本行核心系统(CORE_ACCT)适用;信贷系统因通知未提及,<b>适用性待确认</b>。</p>
                  </div>
                  <div className="rounded-2xl border border-line p-4">
                    <SectionLabel>影响范围</SectionLabel>
                    <p className="mt-2 text-[13px] leading-6">当前已导入数据集:<b>86 张表、1,284 个字段</b>中,仍有 412 个字段无审核注释。</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-line p-4">
                  <SectionLabel>行动建议</SectionLabel>
                  <ol className="mt-3 space-y-3">
                    {[
                      ['补全 CORE_ACCT 余下 412 个字段注释', '发起「元数据治理」任务'],
                      ['确认信贷系统是否纳入范围', '需向责任部门核实'],
                      ['11 月 30 日前完成审核', '数据管理部门统一审核'],
                    ].map(([t, d], i) => (
                      <li key={t} className="flex items-start gap-3">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-brand text-xs font-semibold text-white">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[14px] font-semibold">{t}</p>
                          <p className="text-xs text-ink-soft">{d}</p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex flex-col gap-5">
            <Card>
              <CardHeader title="期限与责任" />
              <ul className="space-y-4 p-6 pt-4 text-[13px]">
                <li className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><CalendarClock className="size-4" /></span>
                  <div><p className="text-xs text-ink-mute">期限线索</p><p className="font-semibold">11 月 30 日前</p></div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand"><UserRound className="size-4" /></span>
                  <div><p className="text-xs text-ink-mute">责任线索</p><p className="font-semibold">各部门补全 · 数据管理部门审核</p></div>
                </li>
              </ul>
            </Card>

            <Card>
              <CardHeader title="待确认项" />
              <ul className="space-y-2.5 p-6 pt-4 text-[13px] leading-5">
                {['信贷系统是否纳入范围', '「统一审核」的具体流程与人员'].map((x) => (
                  <li key={x} className="flex gap-2.5"><TriangleAlert className="mt-0.5 size-4 shrink-0 text-[#d49400]" />{x}</li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <p className="text-[14px] font-semibold">由建议发起任务</p>
              <p className="mt-1 text-xs leading-5 text-ink-soft">会带入相关原文与确认后的范围,由你确认后才建立任务;不会默认修改系统或发送消息。</p>
              <div className="mt-4 flex flex-col gap-2">
                <Btn variant="primary" className="w-full" onClick={() => go(3)}>
                  发起元数据治理任务
                  <ArrowRight className="size-4" />
                </Btn>
                <Btn variant="white" className="w-full" onClick={() => go(7)}>发起数据开发任务</Btn>
              </div>
            </Card>
          </div>
        </div>
      )}

      <p className={cn('sr-only')}>制度通知解读原型</p>
    </div>
  )
}
