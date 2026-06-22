<template>
  <div class="wrong-questions">
    <h2 class="page-title">📝 错题列表</h2>
    
    <!-- 筛选栏 -->
    <el-card shadow="never" class="filter-card">
      <el-form :inline="true">
        <el-form-item label="学科">
          <el-select v-model="filters.subject" placeholder="全部学科" clearable>
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部状态" clearable>
            <el-option label="未掌握" value="unmastered" />
            <el-option label="学习中" value="learning" />
            <el-option label="已掌握" value="mastered" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadQuestions">搜索</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 操作按钮 -->
    <div class="actions">
      <el-button type="primary" @click="showAddDialog = true">
        <el-icon><Plus /></el-icon> 添加错题
      </el-button>
      <el-button @click="getVariation" :disabled="!selectedQuestion">
        <el-icon><Refresh /></el-icon> 生成变式题
      </el-button>
      <el-button @click="exportPdf" :disabled="!selectedQuestion">
        <el-icon><Download /></el-icon> 导出PDF
      </el-button>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在加载...</span>
    </div>

    <!-- 错题列表 -->
    <div v-else class="questions-list">
      <el-table 
        :data="displayQuestions" 
        style="width: 100%"
        @row-click="onRowClick"
        @selection-change="onSelectionChange"
        highlight-current-row
        border>
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="subject" label="学科" width="100">
          <template #default="{ row }">
            <el-tag :type="getSubjectType(row.subject)">{{ row.subject }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="question" label="题目" min-width="200">
          <template #default="{ row }">
            <div class="question-text">{{ row.question }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="errorReason" label="错误原因" width="120">
          <template #default="{ row }">
            <el-tag :type="getReasonType(row.errorReason)" size="small">
              {{ row.errorReason }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="mastery" label="掌握度" width="150">
          <template #default="{ row }">
            <el-progress 
              :percentage="row.mastery" 
              :color="getMasteryColor(row.mastery)"
              :stroke-width="10" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="primary" @click.stop="startTutorial(row)">
              讲解
            </el-button>
            <el-button size="small" type="success" @click.stop="checkUnderstanding(row)">
              检验
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加错题对话框 -->
    <el-dialog v-model="showAddDialog" title="添加错题" width="500px">
      <el-form :model="newQuestion" label-width="80px">
        <el-form-item label="学科">
          <el-select v-model="newQuestion.subject" placeholder="选择学科">
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
          </el-select>
        </el-form-item>
        <el-form-item label="题目">
          <el-input v-model="newQuestion.question" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="正确答案">
          <el-input v-model="newQuestion.answer" />
        </el-form-item>
        <el-form-item label="学生答案">
          <el-input v-model="newQuestion.studentAnswer" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="submitQuestion">提交</el-button>
      </template>
    </el-dialog>

    <!-- AI 回复对话框 -->
    <el-dialog v-model="showAiDialog" :title="aiDialogTitle" width="600px">
      <div class="ai-response" v-html="formatResponse(aiResponse)"></div>
      <template #footer>
        <el-button @click="showAiDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { 
  getReviewQuestions, 
  addWrongQuestion, 
  generateVariationQuestion,
  exportWrongNotebookPdf,
  startAITutorial,
  startDeepUnderstandingCheck
} from '../api/learning'

const route = useRoute()
const childId = computed(() => route.params.childId || 1)

const loading = ref(false)
const showAddDialog = ref(false)
const showAiDialog = ref(false)
const aiDialogTitle = ref('')
const aiResponse = ref('')
const selectedQuestion = ref(null)

const filters = ref({
  subject: '',
  status: ''
})

const newQuestion = ref({
  subject: '',
  question: '',
  answer: '',
  studentAnswer: ''
})

// 演示数据（实际使用时会从API获取）
const questions = ref([
  { id: 1, subject: '数学', question: '计算 2/3 × 4/5 = ?', answer: '8/15', studentAnswer: '6/8', errorReason: '概念不清', mastery: 20 },
  { id: 2, subject: '数学', question: '小明有5个苹果，吃了2个，还剩几个？', answer: '3个', studentAnswer: '2个', errorReason: '粗心', mastery: 60 },
  { id: 3, subject: '英语', question: '翻译：I am happy', answer: '我很开心', studentAnswer: '我是开心', errorReason: '粗心', mastery: 80 },
])

const displayQuestions = computed(() => {
  return questions.value.filter(q => {
    if (filters.value.subject && q.subject !== filters.value.subject) return false
    if (filters.value.status) {
      if (filters.value.status === 'unmastered' && q.mastery >= 50) return false
      if (filters.value.status === 'learning' && (q.mastery < 50 || q.mastery >= 80)) return false
      if (filters.value.status === 'mastered' && q.mastery < 80) return false
    }
    return true
  })
})

const loadQuestions = async () => {
  loading.value = true
  try {
    const response = await getReviewQuestions(childId.value)
    console.log('获取到的错题:', response)
    // 实际使用时会解析 response 更新 questions
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

const resetFilters = () => {
  filters.value = { subject: '', status: '' }
}

const onRowClick = (row) => {
  selectedQuestion.value = row
}

const onSelectionChange = (selection) => {
  selectedQuestion.value = selection.length === 1 ? selection[0] : null
}

const getSubjectType = (subject) => {
  const types = { '语文': '', '数学': 'success', '英语': 'warning' }
  return types[subject] || 'info'
}

const getReasonType = (reason) => {
  const types = { '粗心': 'warning', '概念不清': 'danger', '思路卡壳': 'info' }
  return types[reason] || 'info'
}

const getMasteryColor = (mastery) => {
  if (mastery >= 80) return '#67C23A'
  if (mastery >= 50) return '#E6A23C'
  return '#F56C6C'
}

const submitQuestion = async () => {
  if (!newQuestion.value.subject || !newQuestion.value.question || !newQuestion.value.answer) {
    ElMessage.warning('请填写完整信息')
    return
  }
  
  try {
    await addWrongQuestion(
      childId.value,
      newQuestion.value.subject,
      newQuestion.value.question,
      newQuestion.value.answer,
      newQuestion.value.studentAnswer
    )
    ElMessage.success('添加成功')
    showAddDialog.value = false
    loadQuestions()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

const startTutorial = async (row) => {
  aiDialogTitle.value = '📚 AI 讲解 - ' + row.question
  loading.value = true
  try {
    aiResponse.value = await startAITutorial(childId.value, row.id)
    showAiDialog.value = true
  } catch (error) {
    ElMessage.error('获取讲解失败')
  } finally {
    loading.value = false
  }
}

const checkUnderstanding = async (row) => {
  aiDialogTitle.value = '🧠 深度理解检验'
  loading.value = true
  try {
    aiResponse.value = await startDeepUnderstandingCheck(childId.value, row.id)
    showAiDialog.value = true
  } catch (error) {
    ElMessage.error('获取检验失败')
  } finally {
    loading.value = false
  }
}

const getVariation = async () => {
  if (!selectedQuestion.value) return
  loading.value = true
  try {
    aiResponse.value = await generateVariationQuestion(childId.value, selectedQuestion.value.id)
    aiDialogTitle.value = '🔄 变式题生成'
    showAiDialog.value = true
  } catch (error) {
    ElMessage.error('生成失败')
  } finally {
    loading.value = false
  }
}

const exportPdf = async () => {
  loading.value = true
  try {
    aiResponse.value = await exportWrongNotebookPdf(childId.value, filters.value.subject)
    aiDialogTitle.value = '📄 导出 PDF'
    showAiDialog.value = true
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    loading.value = false
  }
}

const formatResponse = (text) => {
  if (!text) return ''
  return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
}

onMounted(() => {
  loadQuestions()
})
</script>

<style scoped>
.wrong-questions { max-width: 1200px; margin: 0 auto; }

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.filter-card { margin-bottom: 20px; }

.actions {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 50px;
  color: #666;
}

.question-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ai-response {
  line-height: 1.8;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
  max-height: 400px;
  overflow-y: auto;
}
</style>
