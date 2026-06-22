import axios from 'axios'

// Coze 智能体配置
const COZE_API_URL = 'https://nt8xzpg462.coze.site/stream_run'
const API_TOKEN = 'eyJhbGciOiJSUzI1NiIsImtpZCI6IjI2NjdjM2QzYy00ZTVhLTQwMzYtYmU0ZS04ODFkMjA1OTJkM2QifQ.eyJpc3MiOiJodHRwczovL2FwaS5jb3plLmNuIiwiYXVkIjpbIjlVRVMzRkgwMWdyOVMwUEFyRzFHQnFBQzMxRldDR09rIl0sImV4cCI6ODIxMDI2Njg3Njc5OSwiaWF0IjoxNzgxNjY0MTcxLCJzdWIiOiJzcGlmZmU6Ly9hcGkuY296ZS5jbi93b3JrbG9hZF9pZGVudGl0eS9pZDo3NjUxNTUzMjg5MDM2NjI4MDAzIiwic3JjIjoiaW5ib3VuZF9hdXRoX2FjY2Vzc190b2tlbl9pZDo3NjUyMTg5MzUwNzE2NzY4MjY1In0.c1B4km9UfD9VPB77kSqrxGRL9R9KEVhVRFuTVqGrvJq6j15lWyhtCFtcH2nxdYfmCLoyHROnCiSqUC_Ed3icerMBqnAVgfLsrdth9q1s4fH9FOKpOji9U0zIW7HvZHyvoapDwEtl-GZKX_CX397-xQNpBxQkbYs-GMoy-bOTtzSJWpdS_5yZ-gZyuz4kaUWjKoNVx5OmPM9g1HTrZoXaclvfpDevpWgTqQ-CDEFOAWK0ynO8w6ICRe3qaLrYyAZCyDdDv8PhPNy_sns8gFwnSLS_0GJ3MpIRa3eWbt-xI8619u2o_Cd5gwa7LBH9TXr2i7_hBayKGiAkLSHxW2ol2g'
const PROJECT_ID = '7651543630016102400'

// 生成会话ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

// 保存会话ID
let currentSessionId = generateSessionId()

/**
 * 调用 Coze 智能体
 * @param {string} text - 用户输入的文本
 * @param {number} childId - 孩子ID（可选，用于上下文）
 * @returns {Promise<string>} - 返回AI响应内容
 */
export async function callCozeAgent(text, childId = null) {
  try {
    // 构建带有上下文的提示
    let fullText = text
    if (childId !== null) {
      // 如果指定了孩子，添加上下文
      if (text.includes('小明') || text.includes('驾驶舱') || text.includes('错题')) {
        fullText = `孩子ID是${childId}。${text}`
      }
    }

    const response = await axios.post(COZE_API_URL, {
      content: {
        query: {
          prompt: [{
            type: 'text',
            content: { text: fullText }
          }]
        }
      },
      type: 'query',
      session_id: currentSessionId,
      project_id: PROJECT_ID
    }, {
      headers: {
        'Authorization': `Bearer ${API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000
    })

    // 处理返回数据
    if (response.data && response.data.content) {
      // 解析响应内容
      const result = response.data.content
      if (typeof result === 'string') {
        return result
      }
      if (result.messages) {
        return result.messages.join('\n')
      }
      return JSON.stringify(result)
    }

    return '收到响应，但格式未知'
  } catch (error) {
    console.error('Coze API 调用失败:', error)
    throw new Error(error.response?.data?.message || error.message || '调用失败')
  }
}

/**
 * 流式调用 Coze 智能体
 * @param {string} text - 用户输入的文本
 * @param {function} onMessage - 消息回调
 * @param {function} onComplete - 完成回调
 * @param {function} onError - 错误回调
 */
export function callCozeAgentStream(text, onMessage, onComplete, onError) {
  const eventSource = new EventSource(`${COZE_API_URL}?text=${encodeURIComponent(text)}`)
  
  eventSource.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.content) {
        onMessage(data.content)
      }
      if (data.done) {
        onComplete()
        eventSource.close()
      }
    } catch (e) {
      console.error('解析流数据失败:', e)
    }
  }

  eventSource.onerror = (error) => {
    eventSource.close()
    onError(error)
  }
}

/**
 * 获取家长驾驶舱数据
 */
export async function getParentDashboard(childId) {
  return callCozeAgent(`孩子ID是${childId}，查看家长驾驶舱`)
}

/**
 * 获取学习报告
 */
export async function getLearningReport(childId, days = 7) {
  return callCozeAgent(`孩子ID是${childId}，获取近${days}天的学习报告`)
}

/**
 * 获取待复习错题
 */
export async function getReviewQuestions(childId) {
  return callCozeAgent(`孩子ID是${childId}，获取待复习的错题列表`)
}

/**
 * 添加错题
 */
export async function addWrongQuestion(childId, subject, question, answer, studentAnswer = '') {
  return callCozeAgent(`孩子ID是${childId}，添加${subject}错题：${question}，正确答案：${answer}，学生答案：${studentAnswer}`)
}

/**
 * 获取变式题
 */
export async function generateVariationQuestion(childId, questionId) {
  return callCozeAgent(`孩子ID是${childId}，为第${questionId}道错题生成变式题`)
}

/**
 * 导出错题本PDF
 */
export async function exportWrongNotebookPdf(childId, subject = '') {
  const subjectText = subject ? `，学科是${subject}` : ''
  return callCozeAgent(`孩子ID是${childId}${subjectText}，生成错题本PDF`)
}

/**
 * AI 讲解
 */
export async function startAITutorial(childId, questionId) {
  return callCozeAgent(`孩子ID是${childId}，开始讲解第${questionId}道错题`)
}

/**
 * 获取下一步提示
 */
export async function getNextHint(childId, questionId, currentStep = 0) {
  return callCozeAgent(`孩子ID是${childId}，第${questionId}道错题，获取第${currentStep + 1}步提示`)
}

/**
 * 深度理解检验
 */
export async function startDeepUnderstandingCheck(childId, questionId) {
  return callCozeAgent(`孩子ID是${childId}，对第${questionId}道错题进行深度理解检验`)
}

/**
 * 月度进度对比
 */
export async function compareMonthlyProgress(childId) {
  return callCozeAgent(`孩子ID是${childId}，对比本月与上月的学习进步`)
}

export { currentSessionId, generateSessionId }
