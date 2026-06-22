<template>
  <div class="ai-tutor">
    <h2 class="page-title">🎓 AI 智能讲解</h2>
    
    <!-- 选择题目 -->
    <el-card shadow="never" class="select-card">
      <el-form :inline="true">
        <el-form-item label="选择错题">
          <el-select v-model="selectedQuestionId" placeholder="选择要讲解的题目" @change="onQuestionSelect">
            <el-option 
              v-for="q in questions" 
              :key="q.id" 
              :label="`${q.id}. ${q.subject} - ${q.question.substring(0, 20)}...`" 
              :value="q.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="讲解风格">
          <el-select v-model="tutorStyle" style="width: 150px">
            <el-option label="详细讲解" value="详细" />
            <el-option label="简洁提示" value="简洁" />
            <el-option label="启发式" value="启发" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="startTutorial" :disabled="!selectedQuestionId">
            开始讲解
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在准备讲解...</span>
    </div>

    <!-- 讲解内容 -->
    <el-card v-if="tutorialContent && !loading" shadow="hover" class="tutorial-card">
      <template #header>
        <div class="card-header">
          <span>📚 讲解内容</span>
          <el-button-group>
            <el-button size="small" @click="getHint">获取提示</el-button>
            <el-button size="small" type="success" @click="checkDeepUnderstanding">深度检验</el-button>
          </el-button-group>
        </div>
      </template>
      
      <div class="tutorial-content">
        <!-- 题目信息 -->
        <div class="question-box">
          <h4>原题</h4>
          <p>{{ currentQuestion.question }}</p>
          <p class="answer">正确答案：{{ currentQuestion.answer }}</p>
        </div>
        
        <!-- 讲解步骤 -->
        <div class="steps-box" v-html="formatSteps(tutorialContent)"></div>
      </div>
      
      <!-- 提示区域 -->
      <div v-if="hints.length > 0" class="hints-box">
        <h4>💡 提示</h4>
        <el-collapse>
          <el-collapse-item 
            v-for="(hint, index) in hints" 
            :key="index" 
            :title="`提示 ${index + 1}`">
            <div>{{ hint }}</div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </el-card>

    <!-- 深度理解检验 -->
    <el-card v-if="deepContent && !loading" shadow="hover" class="deep-card">
      <template #header>
        <div class="card-header">
          <span>🧠 深度理解检验</span>
          <el-button size="small" @click="deepContent = ''">收起</el-button>
        </div>
      </template>
      <div class="deep-content" v-html="formatSteps(deepContent)"></div>
    </el-card>

    <!-- 空白状态 -->
    <el-empty v-if="!tutorialContent && !loading" description="请先选择题目开始讲解"></el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { startAITutorial, getNextHint, startDeepUnderstandingCheck } from '../api/learning'

const route = useRoute()
const childId = ref(route.params.childId || 1)

const loading = ref(false)
const selectedQuestionId = ref(null)
const tutorStyle = ref('详细')
const tutorialContent = ref('')
const deepContent = ref('')
const currentHintStep = ref(0)
const hints = ref([])

const questions = ref([
  { id: 1, subject: '数学', question: '计算 2/3 × 4/5 = ?', answer: '8/15' },
  { id: 2, subject: '数学', question: '小明有5个苹果，吃了2个，还剩几个？', answer: '3个' },
  { id: 3, subject: '英语', question: '翻译：I am happy', answer: '我很开心' },
])

const currentQuestion = ref(questions.value[0])

const onQuestionSelect = (id) => {
  currentQuestion.value = questions.value.find(q => q.id === id) || questions.value[0]
  tutorialContent.value = ''
  hints.value = []
  currentHintStep.value = 0
  deepContent.value = ''
}

const startTutorial = async () => {
  if (!selectedQuestionId.value) return
  
  loading.value = true
  tutorialContent.value = ''
  hints.value = []
  deepContent.value = ''
  
  try {
    tutorialContent.value = await startAITutorial(childId.value, selectedQuestionId.value)
  } catch (error) {
    ElMessage.error('获取讲解失败')
  } finally {
    loading.value = false
  }
}

const getHint = async () => {
  loading.value = true
  try {
    const hint = await getNextHint(childId.value, selectedQuestionId.value, currentHintStep.value)
    hints.value.push(hint)
    currentHintStep.value++
  } catch (error) {
    ElMessage.error('获取提示失败')
  } finally {
    loading.value = false
  }
}

const checkDeepUnderstanding = async () => {
  if (!selectedQuestionId.value) return
  
  loading.value = true
  try {
    deepContent.value = await startDeepUnderstandingCheck(childId.value, selectedQuestionId.value)
  } catch (error) {
    ElMessage.error('获取检验失败')
  } finally {
    loading.value = false
  }
}

const formatSteps = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^/, '<p>')
    .replace(/$/, '</p>')
}

onMounted(() => {
  // 默认选择第一题
  if (questions.value.length > 0) {
    selectedQuestionId.value = questions.value[0].id
  }
})
</script>

<style scoped>
.ai-tutor { max-width: 900px; margin: 0 auto; }

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.select-card { margin-bottom: 20px; }

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 50px;
  color: #666;
}

.tutorial-card, .deep-card { margin-bottom: 20px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.tutorial-content { line-height: 1.8; }

.question-box {
  background: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #409EFF;
}

.question-box h4 { margin: 0 0 10px 0; color: #409EFF; }
.question-box p { margin: 5px 0; }
.question-box .answer { color: #67C23A; font-weight: 500; }

.steps-box {
  background: #f9f9f9;
  padding: 15px;
  border-radius: 8px;
  white-space: pre-wrap;
}

.hints-box {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.hints-box h4 { margin-bottom: 10px; }

.deep-content {
  line-height: 1.8;
  white-space: pre-wrap;
}
</style>
