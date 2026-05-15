import request from '@/utils/request';
import type { CreateFolderDTO } from '@/types/resource';

export const createFolder = (data: CreateFolderDTO) => {
  return request.post<string>('/resources/folders', data)
}

export 