/**
 * 知序智学 - SVG 图标渲染工具
 * 将图标数组路径渲染为 SVG 元素
 */

import type { Component } from 'vue'

// 创建 SVG 图标组件
export function createIcon(paths: string[], options?: { size?: number; color?: string }): Component {
  return {
    name: 'SvgIcon',
    props: {
      size: {
        type: [Number, String],
        default: options?.size || 20
      },
      color: {
        type: String,
        default: options?.color || 'currentColor'
      },
      strokeWidth: {
        type: [Number, String],
        default: 2
      }
    },
    template: `
      <svg
        :width="size"
        :height="size"
        viewBox="0 0 24 24"
        fill="none"
        :stroke="color"
        :stroke-width="strokeWidth"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        ${paths.map(path => `<${path}/>`).join('\n        ')}
      </svg>
    `
  }
}

// 预设图标集合
import * as icons from './index'

export const SvgIcons = icons

// 快捷访问函数
export const getIcon = (name: keyof typeof icons) => {
  const paths = icons[name]
  if (Array.isArray(paths)) {
    return createIcon(paths)
  }
  // 对于对象类型的图标（如 BookIcon 有 open 和 closed）
  return paths
}
