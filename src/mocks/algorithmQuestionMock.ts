import type { EvaluationQuestion } from '@/api/evaluationQuestion'

const LINKED_LIST_INSERTION_SORT_STEM = `
<p>使用单链表实现插入排序算法。</p>
<p><strong>输入格式：</strong>第一行一个整数 n (1 ≤ n ≤ 1000)，表示元素个数。第二行 n 个整数，每个整数在 [-10^5, 10^5] 范围内。</p>
<p><strong>输出格式：</strong>一行，包含升序排序后的整数序列，相邻整数之间用一个空格分隔，行末无空格，但需换行。</p>
<p><strong>约束：</strong>要求实现单链表的插入排序，不得使用数组。</p>
`

const LINKED_LIST_INSERTION_SORT_STARTER_CODE = `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int val;
    struct Node *next;
} Node;

Node* createNode(int val) {
    Node *node = (Node*)malloc(sizeof(Node));
    node->val = val;
    node->next = NULL;
    return node;
}

Node* insertionSortList(Node *head) {
    // 在这里实现单链表插入排序
    return head;
}

int main() {
    int n;
    scanf("%d", &n);

    Node *head = NULL;
    Node *tail = NULL;

    // 按输入顺序构建单链表，不使用数组保存数据
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        Node *node = createNode(x);
        if (head == NULL) {
            head = node;
            tail = node;
        } else {
            tail->next = node;
            tail = node;
        }
    }

    head = insertionSortList(head);

    // 输出排序后的链表
    for (Node *cur = head; cur != NULL; cur = cur->next) {
        printf("%d", cur->val);
        if (cur->next != NULL) printf(" ");
    }
    printf("\\n");

    // 释放链表节点，避免内存泄漏
    while (head != NULL) {
        Node *temp = head;
        head = head->next;
        free(temp);
    }

    return 0;
}
`

const LINKED_LIST_INSERTION_SORT_DEMO_ANSWER = `#include <stdio.h>
#include <stdlib.h>

typedef struct Node {
    int val;
    struct Node *next;
} Node;

Node* createNode(int val) {
    Node *node = (Node*)malloc(sizeof(Node));
    node->val = val;
    node->next = NULL;
    return node;
}

Node* insertionSortList(Node *head) {
    Node dummy;
    dummy.next = NULL;

    Node *cur = head;
    while (cur != NULL) {
        Node *nextNode = cur->next;
        Node *prev = &dummy;

        // 在已排序链表中找到第一个大于当前节点的位置
        while (prev->next != NULL && prev->next->val <= cur->val) {
            prev = prev->next;
        }

        // 将当前节点插入到已排序链表的正确位置
        cur->next = prev->next;
        prev->next = cur;
        cur = nextNode;
    }

    return dummy.next;
}

int main() {
    int n;
    scanf("%d", &n);

    Node *head = NULL;
    Node *tail = NULL;

    // 按输入顺序构建单链表，不使用数组保存数据
    for (int i = 0; i < n; i++) {
        int x;
        scanf("%d", &x);
        Node *node = createNode(x);
        if (head == NULL) {
            head = node;
            tail = node;
        } else {
            tail->next = node;
            tail = node;
        }
    }

    head = insertionSortList(head);

    // 输出排序后的链表，行末不输出多余空格
    for (Node *cur = head; cur != NULL; cur = cur->next) {
        printf("%d", cur->val);
        if (cur->next != NULL) printf(" ");
    }
    printf("\\n");

    // 释放链表节点，避免内存泄漏
    while (head != NULL) {
        Node *temp = head;
        head = head->next;
        free(temp);
    }

    return 0;
}
`

/**
 * 算法题前端本地 mock：后端代码判题接口未接入前，测评页直接使用该题目模板渲染。
 */
export function getMockAlgorithmQuestions(): EvaluationQuestion[] {
  return [
    {
      id: 'mock-alg-linked-list-insertion-sort',
      questionCode: 'ALG-LIST-INSERTION-SORT-001',
      learningSpaceId: 'mock-algorithm-space',
      questionType: 'code',
      questionTypeName: '编程题',
      sortOrder: 1,
      difficulty: 3,
      score: 15,
      abilityDimension: 'algorithm_implementation',
      stem: LINKED_LIST_INSERTION_SORT_STEM,
      correctAnswer: {
        allowedLanguages: ['c11'],
        starterCode: LINKED_LIST_INSERTION_SORT_STARTER_CODE,
        demoAnswer: LINKED_LIST_INSERTION_SORT_DEMO_ANSWER,
        judgeMode: 'local_mock',
        examples: [
          {
            input: '5\n3 1 4 2 5',
            output: '1 2 3 4 5'
          },
          {
            input: '3\n10 5 8',
            output: '5 8 10'
          }
        ],
        constraints: [
          '1 ≤ n ≤ 1000',
          '每个整数在 [-10^5, 10^5] 范围内',
          '必须使用单链表实现插入排序，不得用数组完成排序'
        ]
      },
      explanation: '本题用于前端 mock 算法题流程，真实编译运行与判题接口后续再接入后端。',
      tags: ['链表', '插入排序', 'C语言'],
      knowledgePoints: ['单链表', '插入排序', '指针操作'],
      abilityTags: ['编程实现', '算法思维']
    }
  ]
}

/**
 * 视频演示用默认答案：进入算法题 mock 页面时直接填入完整 C 语言参考实现。
 */
export function getMockAlgorithmDefaultAnswers(): Record<string, string> {
  const answers: Record<string, string> = {}

  getMockAlgorithmQuestions().forEach(question => {
    const demoAnswer = question.correctAnswer?.demoAnswer
    if (typeof demoAnswer === 'string' && demoAnswer.trim()) {
      answers[question.id] = demoAnswer
    }
  })

  return answers
}
