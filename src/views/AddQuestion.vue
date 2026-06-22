<template>
  <div class="add-question">
    <h2 class="page-title">➕ 添加错题</h2>
    
    <el-card shadow="hover" class="form-card">
      <el-form 
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="question-form">
        
        <el-form-item label="孩子" prop="childId">
          <el-select v-model="form.childId" placeholder="选择孩子">
            <el-option label="小明" :value="1" />
            <el-option label="小红" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="学科" prop="subject">
          <el-select v-model="form.subject" placeholder="选择学科">
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
            <el-option label="物理" value="物理" />
            <el-option label="化学" value="化学" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="年级" prop="grade">
          <el-input-number v-model="form.grade" :min="1" :max="12" />
        </el-form-item>
        
        <el-form-item label="题目" prop="question">
          <el-input 
            v-model="form.question" 
            type="textarea" 
            :rows="4"
            placeholder="请输入题目内容" />
        </el-form-item>
        
        <el-form-item label="正确答案" prop="answer">
          <el-input v-model="form.answer" placeholder="请输入正确答案" />
        </el-form-item>
        
        <el-form-item label="学生答案">
          <el-input v-model="form.studentAnswer" placeholder="请输入学生当时写的答案（可选）" />
        </el-form-item>
        
        <el-form-item label="题目来源">
          <el-input v-model="form.source" placeholder="如：课本第35页、期中考试卷等（可选）" />
        </el-form-item>
        
        <el-form-item label="难度">
          <el-radio-group v-model="form.difficulty">
            <el-radio label="基础">基础</el-radio>
            <el-radio label="中档">中档</el-radio>
            <el-radio label="挑战">挑战</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="submitForm" :loading="submitting">
            <el-icon v-if="!submitting"><Check /></el-icon>
            提交错题
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 提交结果 -->
    <el-dialog v-model="showResult" title="添加结果" width="500px">
      <div class="result-content" v-html="formatResult(submitResult)"></div>
      <template #footer>
        <el-button @click="showResult = false">关闭</el-button>
        <el-button type="primary" @click="continueAdd">继续添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { addWrongQuestion } from '../api/learning'

const route = useRoute()
const formRef = ref(null)
const submitting = ref(false)
const showResult = ref(false)
const submitResult = ref('')

const form = reactive({
  childId: 1,
  subject: '',
  grade: 4,
  question: '',
  answer: '',
  studentAnswer: '',
  source: '',
  difficulty: '中档'
})

const rules = {
  subject: [{ required: true, message: '请选择学科', trigger: 'change' }],
  question: [{ required: true, message: '请输入题目', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入正确答案', trigger: 'blur' }]
}

const submitForm = async () => {
  if (!formRef.value) return
  
  try {
    await formRef.value.validate()
  } catch {
    ElMessage.warning('请完善表单信息')
    return
  }
  
  submitting.value = true
  try {
    submitResult.value = await addWrongQuestion(
      form.childId,
      form.subject,
      form.question,
      form.answer,
      form.studentAnswer
    )
    showResult.value = true
    ElMessage.success('添加成功')
  } catch (error) {
    ElMessage.error('添加失败：' + error.message)
  } finally {
    submitting.value = false
  }
}

const resetForm = () => {
  form.question = ''
  form.answer = ''
  form.studentAnswer = ''
  form.source = ''
  form.difficulty = '中档'
  formRef.value?.clearValidate()
}

const continueAdd = () => {
  showResult.value = false
  resetForm()
}

const formatResult = (content) => {
  if (!content) return ''
  return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
}

onMounted(() => {
  if (route.params.childId) {
    form.childId = parseInt(route.params.childId)
  }
})
</script>

<style scoped>
.add-question { max-width: 800px; margin: 0 auto; }

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.form-card { padding: 10px 0; }

.question-form { padding: 20px; }

.result-content {
  line-height: 1.8;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
}
</style>
