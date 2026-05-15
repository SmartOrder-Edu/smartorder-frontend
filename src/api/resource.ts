import request from '@/utils/request'
import type { FileFolderContentVO, CreateFolderDTO } from '@/types/resource'

/** 查询文件夹内容（子文件夹 + 文件列表） */
export function getFolderContent(parentId: string) {
  return request.get<FileFolderContentVO>(`/yun-resource/folders/${parentId}`)
}

/** 创建文件夹 */
export function createFolder(data: CreateFolderDTO) {
  return request.post<string>('/yun-resource/folders', data)
}

/** 重命名文件夹 */
export function updateFolder(id: string, folderName: string) {
  return request.put<string>(`/yun-resource/folders/${id}`, null, {
    params: { folderName }
  })
}

/** 删除文件夹 */
export function deleteFolder(id: string) {
  return request.delete<string>(`/yun-resource/folders/${id}`)
}

/** 移动文件夹 */
export function moveFolder(id: string, targetParentId: string) {
  return request.post<string>('/yun-resource/folders/move', null, {
    params: { id, targetParentId }
  })
}
