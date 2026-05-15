/** 文件夹节点 */
export interface FileFolderVO {
  id: number
  folderName: string
  parentId: number | null
  createTime: string
}

/** 文件夹树节点（递归结构） */
export interface FileFolderTreeVO extends FileFolderVO {
  children: FileFolderTreeVO[]
  files: FileResourceVO[]
}

/** 文件资源 */
export interface FileResourceVO {
  id: number
  fileName: string
  fileType: string
  fileSize: number
  ossUrl: string
  folderId: number
  parseStatus: number // 0=未解析, 1=解析中, 2=已向量化, 3=解析失败
  createTime: string
}

/** 创建文件夹请求体 */
export interface CreateFolderDTO {
  folderName: string
  parentId: number | null
}
