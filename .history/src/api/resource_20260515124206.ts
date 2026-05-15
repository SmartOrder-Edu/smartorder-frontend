import request from '@/utils/request'
import type { CreateFolderDTO } from '@/types/resource'

export const createFolder = (data: CreateFolderDTO) => {
  return request.post<string>('/yun-resource/folders', data)
}

export const getFolderList = (id: number) => {
  return request.get<>(`/yun-resource/folders/${id}`)
}
