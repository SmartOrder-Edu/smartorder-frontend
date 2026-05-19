/** 创建文件夹请求体 */
export interface CreateFolderDTO {
  folderName: string
  parentId: string | number | null
}
// ==================== FileFolderVO ====================
/** 文件夹基本信息（树节点） */
export interface FileFolderVO {
  /** 文件夹ID */
  folderId: string
  /** 父文件夹ID */
  folderParentId: string | null
  /** 文件夹名称 */
  folderName: string
  /** 排序 */
  sort: number
  /** 更新时间 */
  updateTime: string
  /** 子文件夹（树形结构） */
  children?: FileFolderVO[]
}

// ==================== FileResourceVO ====================
/** 文件资源 */
export interface FileResourceVO {
  /** 文件ID */
  fileId: string
  /** 文件名称 */
  fileName: string
  /** 文件URL */
  fileUrl: string
  /** 文件大小，单位字节 */
  fileSize: number
  /** 文件类型，如 pdf、docx 等 */
  fileType: string
  /** 解析状态：0-未解析，1-解析中，2-向量化完成，3-解析失败 */
  parseStatus: 0 | 1 | 2 | 3 | number
  /** 资源来源：1-原创，2-AI生成，3-广场转存 */
  source: 1 | 2 | 3 | number
  /** 修改时间 */
  updateTime: string
}

// ==================== FileFolderContentVO ====================
/** 文件夹内容（包含子文件夹列表 + 文件列表） */
export interface FileFolderContentVO {
  /** 文件夹ID */
  folderId: string
  /** 文件夹名称 */
  folderName: string
  /** 父文件夹ID */
  folderParentId: string | null
  /** 子文件夹列表 */
  folders: FileFolderVO[]
  /** 文件列表 */
  files: FileResourceVO[]
}
