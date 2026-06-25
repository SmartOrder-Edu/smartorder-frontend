import request from './request'
import type {
  StartStudySessionRequest,
  StudyEventReceipt,
  StudyEventRequest,
  StudySessionVO,
} from '@/types/study'

export const studySessionApi = {
  start(data: StartStudySessionRequest): Promise<StudySessionVO> {
    return request.post('/study-sessions', data)
  },

  get(sessionId: string): Promise<StudySessionVO> {
    return request.get(`/study-sessions/${sessionId}`)
  },

  reportEvent(sessionId: string, data: StudyEventRequest): Promise<StudyEventReceipt> {
    return request.post(`/study-sessions/${sessionId}/events`, data, { showError: false })
  },
}

export default studySessionApi
