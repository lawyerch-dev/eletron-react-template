import { useState } from 'react'
import { Boxes } from 'lucide-react'
import { logoUrl } from '@ert/shared/utils/plugin'

interface Props {
  logo?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap = {
  sm: { box: 'h-12 w-12 rounded-2xl', icon: 'h-6 w-6' },
  md: { box: 'h-16 w-16 rounded-3xl', icon: 'h-8 w-8' },
  lg: { box: 'h-20 w-20 rounded-3xl', icon: 'h-10 w-10' },
}

/** 插件图标：加载失败时回退到默认占位，避免显示浏览器裂图 */
export function PluginLogo({ logo, size = 'sm', className = '' }: Props) {
  const [failed, setFailed] = useState(false)
  const s = sizeMap[size]
  const src = logo && !failed ? logoUrl(logo) : ''

  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden bg-surface-hover ${s.box} ${className}`}
    >
      {src ? (
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <Boxes className={`${s.icon} text-foreground-muted`} />
      )}
    </div>
  )
}
