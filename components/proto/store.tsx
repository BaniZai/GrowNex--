'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export const SCREENS = [
  { id: 1, title: '工作台首页', short: '工作台', group: '任务工作区' },
  { id: 2, title: '资料导入', short: '导入', group: '元数据治理' },
  { id: 3, title: '治理列表与详情', short: '列表', group: '元数据治理' },
  { id: 4, title: '数据集管理与删除', short: '数据集', group: '元数据治理' },
  { id: 5, title: '生成、审核与导出', short: '生成', group: '元数据治理' },
  { id: 6, title: '标准库', short: '标准库', group: '资料与标准' },
  { id: 7, title: '开发:找数据与分析', short: '找数据', group: '数据开发' },
  { id: 8, title: '开发:口径确认与交付', short: '口径', group: '数据开发' },
  { id: 9, title: '制度通知解读', short: '制度', group: '制度通知' },
  { id: 10, title: '模型设置', short: '模型', group: '配置' },
] as const

export type ScreenId = (typeof SCREENS)[number]['id']

export type RecentTask = {
  id: string
  title: string
  type: '治理' | '开发' | '制度'
  time: string
  status: 'review' | 'confirm' | 'done' | 'running' | 'failed'
  detail: string
  fileMissing?: boolean
}

const INITIAL_RECENTS: RecentTask[] = [
  { id: 'r1', title: '补全 CORE_ACCT 账户表字段注释', type: '治理', time: '今天 09:42', status: 'review', detail: '1,284 项建议 · 待审核' },
  { id: 'r2', title: '客户贷款余额月度汇总加工', type: '开发', time: '昨天 17:08', status: 'confirm', detail: '口径 3 项待确认' },
  { id: 'r3', title: '《关于加强数据治理工作的通知》解读', type: '制度', time: '10-16 11:20', status: 'done', detail: '5 条行动建议' },
  { id: 'r4', title: '信贷系统元数据导入(CREDIT_V3)', type: '治理', time: '10-16 14:30', status: 'running', detail: '已处理 62,400 / 总量未知' },
  { id: 'r5', title: '零售客户宽表开发方案', type: '开发', time: '10-14 16:55', status: 'failed', detail: '结果文件缺失', fileMissing: true },
]

export type Dataset = {
  id: string
  name: string
  source: string
  time: string
  tables: number
  fields: number
  status: 'complete' | 'partial'
  note?: string
}

const INITIAL_DATASETS: Dataset[] = [
  { id: 'd1', name: 'CORE_ACCT 账户系统', source: '核心系统导出_账户.xlsx', time: '10-17 09:12', tables: 86, fields: 1284, status: 'complete' },
  { id: 'd2', name: 'CORE_ACCT 账户系统', source: '核心系统导出_账户_补充.xlsx', time: '10-16 15:40', tables: 12, fields: 203, status: 'complete' },
  { id: 'd3', name: 'CREDIT_V3 信贷系统', source: '信贷_数据字典.csv', time: '10-16 14:30', tables: 41, fields: 620, status: 'partial', note: '已提交 41 / 总量未知 张表,导入被取消' },
]

type Store = {
  datasets: Dataset[]
  deleteDataset: (id: string) => void
  resetDatasets: () => void
  clearDatasets: () => void
  devSourceId: string | null
  setDevSourceId: (id: string | null) => void
  devInvalidated: boolean
  ackDevInvalidated: () => void
  screen: ScreenId
  go: (s: ScreenId) => void
  recents: RecentTask[]
  removeRecent: (id: string) => void
  resetRecents: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [screen, setScreen] = useState<ScreenId>(1)
  const [recents, setRecents] = useState<RecentTask[]>(INITIAL_RECENTS)

  useEffect(() => {
    const read = () => {
      const n = Number(window.location.hash.replace('#', ''))
      if (n >= 1 && n <= 10) setScreen(n as ScreenId)
    }
    read()
    window.addEventListener('hashchange', read)
    return () => window.removeEventListener('hashchange', read)
  }, [])

  const go = useCallback((s: ScreenId) => {
    setScreen(s)
    window.history.replaceState(null, '', `#${s}`)
  }, [])

  const [datasets, setDatasets] = useState<Dataset[]>(INITIAL_DATASETS)
  const [devSourceId, setDevSourceId] = useState<string | null>('d1')
  const [devInvalidated, setDevInvalidated] = useState(false)

  const deleteDataset = useCallback(
    (id: string) => {
      setDatasets((d) => d.filter((x) => x.id !== id))
      setDevSourceId((cur) => {
        if (cur === id) {
          setDevInvalidated(true)
          return null
        }
        return cur
      })
    },
    [],
  )
  const resetDatasets = useCallback(() => {
    setDatasets(INITIAL_DATASETS)
    setDevSourceId('d1')
    setDevInvalidated(false)
  }, [])
  const clearDatasets = useCallback(() => {
    setDatasets([])
    setDevSourceId((cur) => {
      if (cur) setDevInvalidated(true)
      return null
    })
  }, [])
  const ackDevInvalidated = useCallback(() => setDevInvalidated(false), [])

  const removeRecent = useCallback((id: string) => setRecents((r) => r.filter((x) => x.id !== id)), [])
  const resetRecents = useCallback(() => setRecents(INITIAL_RECENTS), [])

  const value = useMemo(
    () => ({
      screen, go, recents, removeRecent, resetRecents,
      datasets, deleteDataset, resetDatasets, clearDatasets,
      devSourceId, setDevSourceId, devInvalidated, ackDevInvalidated,
    }),
    [screen, go, recents, removeRecent, resetRecents, datasets, deleteDataset, resetDatasets, clearDatasets, devSourceId, devInvalidated, ackDevInvalidated],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const v = useContext(Ctx)
  if (!v) throw new Error('StoreProvider missing')
  return v
}
