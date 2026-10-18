import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans, Noto_Sans_SC } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
})

const noto = Noto_Sans_SC({
  weight: ['400', '500', '600', '700'],
  variable: '--font-noto',
  display: 'swap',
  preload: false,
})

export const metadata: Metadata = {
  title: '数源 GrowNex · 产品原型',
  description: '银行 AI 数据工作智能体前端产品原型:任务工作区、元数据治理、数据开发、制度解读与模型设置共 10 张原型图。',
}

export const viewport: Viewport = {
  themeColor: '#e9e5de',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" data-theme="volt" suppressHydrationWarning className={`${jakarta.variable} ${noto.variable}`}>
      <body className="antialiased">{children}</body>
    </html>
  )
}
