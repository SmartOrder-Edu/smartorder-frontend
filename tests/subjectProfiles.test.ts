import assert from 'node:assert/strict'
import { buildSubjectProfileList } from '../src/views/Profile/subjectProfiles'

const profile = {
  subjectProfiles: {
    profiles: {
      DATA_STRUCTURES: {
        subjectId: 'DATA_STRUCTURES',
        subjectNameCache: 'Data Structures',
        subjectStatus: 'ACTIVE',
        knowledgeMastery: {
          chapterSummaries: {
            CHAPTER_1: {
              chapterName: 'Arrays',
              masteryScore: 80
            },
            CHAPTER_2: {
              chapterName: 'Linked Lists',
              masteryScore: 60
            }
          }
        },
        subjectMisconceptions: {
          patterns: {
            M1: {
              title: 'Boundary mistakes',
              status: 'ACTIVE'
            },
            M2: {
              title: 'Inactive issue',
              status: 'RESOLVED'
            }
          }
        },
        learningPreferenceOverride: {
          preferredResourceTypes: ['DIAGRAM', 'CODE_EXAMPLE']
        },
        metadata: {
          confidence: 0.82,
          completeness: 75
        }
      }
    }
  }
}

const list = buildSubjectProfileList(profile, {
  DIAGRAM: 'Diagram',
  CODE_EXAMPLE: 'Code example'
})

assert.equal(list.length, 1)
assert.equal(list[0].subjectId, 'DATA_STRUCTURES')
assert.equal(list[0].subjectName, 'Data Structures')
assert.equal(list[0].statusLabel, '学习中')
assert.equal(list[0].mastery, 70)
assert.deepEqual(list[0].chapters, [
  { name: 'Arrays', mastery: 80 },
  { name: 'Linked Lists', mastery: 60 }
])
assert.deepEqual(list[0].misconceptions, ['Boundary mistakes'])
assert.equal(list[0].preferenceOverride, 'Diagram、Code example')
assert.equal(list[0].confidence, 0.82)
assert.equal(list[0].completeness, 75)
