import request from '@/utils/request'
import type {
  CreateFolderDTO,
  FileFolderContentVO,
  FileFolderVO,
  FileResourceVO
} from '@/types/resource'

export const createFolder = (data: CreateFolderDTO) => {
  return request.post<{ code: number; message: string; data: number }>(
    '/yun-resource/folders',
    data
  )
}

export const getFolderList = (id: number) => {
  return request.get<{ code: number; message: string; data: FileFolderContentVO[] }>(
    `/yun-resource/folders/${id}`
  )
}

export const deleteFolder = (data: CreateFolderDTO) => {
  return request.delete<{ code: number; message: string; data: string }>('/yun-resource/folders', {
    data
  })
}

export const updateFolder = (data: CreateFolderDTO) => {
  return request.put<{ code: number; message: string; data: string }>('/yun-resource/folders', data)
}

export const moveFolder = (id: number, targetParentId: number) => {
  return request.post<{ code: number; message: string; data: string }>(
    `/yun-resource/folders/${id}`,
    { id, targetParentId }
  )
}
