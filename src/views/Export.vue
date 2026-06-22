<template>
  <div class="export-page">
    <h2 class="page-title">📄 导出错题本</h2>
    
    <!-- 导出选项 -->
    <el-card shadow="hover" class="options-card">
      <template #header>
        <span>📋 导出选项</span>
      </template>
      
      <el-form :model="exportOptions" label-width="100px">
        <el-form-item label="选择孩子">
          <el-select v-model="exportOptions.childId" placeholder="选择孩子">
            <el-option label="小明" :value="1" />
            <el-option label="小红" :value="2" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="学科筛选">
          <el-select v-model="exportOptions.subject" placeholder="全部学科" clearable>
            <el-option label="语文" value="语文" />
            <el-option label="数学" value="数学" />
            <el-option label="英语" value="英语" />
          </el-select>
        </el-form-item>
        
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportOptions.range">
            <el-radio label="all">全部错题</el-radio>
            <el-radio label="unmastered">未掌握</el-radio>
            <el-radio label="week">本周新增</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="包含内容">
          <el-checkbox-group v-model="exportOptions.includes">
            <el-checkbox label="question">原题</el-checkbox>
            <el-checkbox label="answer">正确答案</el-checkbox>
            <el-checkbox label="analysis">解析</el-checkbox>
            <el-checkbox label="variation">变式题</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" @click="exportPdf" :loading="exporting">
            <el-icon v-if="!exporting"><Download /></el-icon>
            导出 PDF
          </el-button>
          <el-button @click="preview">
            <el-icon><View /></el-icon>
            预览内容
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 预览区域 -->
    <el-card v-if="previewContent" shadow="hover" class="preview-card">
      <template #header>
        <div class="card-header">
          <span>👁️ 内容预览</span>
          <el-button size="small" @click="previewContent = ''">收起</el-button>
        </div>
      </template>
      <div class="preview-content" v-html="formatPreview(previewContent)"></div>
    </el-card>

    <!-- 下载链接 -->
    <el-card v-if="downloadUrl" shadow="hover" class="download-card">
      <template #header>
        <span>✅ 导出完成</span>
      </template>
      <div class="download-box">
        <p>PDF 已生成，点击下方链接下载：</p>
        <el-button type="primary" tag="a" :href="downloadUrl" target="_blank" size="large">
          <el-icon><Download /></el-icon>
          下载 PDF
        </el-button>
        <p class="tip">链接有效期为 24 小时</p>
      </div>
    </el-card>

    <!-- 月度报告导出 -->
    <el-card shadow="hover" class="report-card">
      <template #header>
        <span>📊 学习报告导出</span>
      </template>
      
      <div class="report-types">
        <div class="report-item" @click="exportMonthlyReport">
          <div class="report-icon">📅</div>
          <div class="report-info">
            <h4>月度学习报告</h4>
            <p>包含本月学习数据统计、进步分析</p>
          </div>
        </div>
        
        <div class="report-item" @click="exportWeeklyReport">
          <div class="report-icon">📆</div>
          <div class="report-info">
            <h4>周报</h4>
            <p>本周错题汇总、复习计划</p>
          </div>
        </div>
        
        <div class="report-item" @click="exportProgressReport">
          <div class="report-icon">📈</div>
          <div class="report-info">
            <h4>进度对比报告</h4>
            <p>本月与上月对比分析</p>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { exportWrongNotebookPdf, compareMonthlyProgress } from '../api/learning'

const route = useRoute()

const exportOptions = ref({
  childId: 1,
  subject: '',
  range: 'all',
  includes: ['question', 'answer', 'analysis']
})

const exporting = ref(false)
const previewContent = ref('')
const downloadUrl = ref('')

const exportPdf = async () => {
  exporting.value = true
  previewContent.value = ''
  downloadUrl.value = ''
  
  try {
    const result = await exportWrongNotebookPdf(
      exportOptions.value.childId,
      exportOptions.value.subject
    )
    
    // 尝试从结果中提取URL
    const urlMatch = result.match(/https?:\/\/[^\s]+(?:\.pdf|[^\s]+\.pdf)[^\s]*/)
    if (urlMatch) {
      downloadUrl.value = urlMatch[0]
      ElMessage.success('导出成功！')
    } else {
      previewContent.value = result
      ElMessage.info('内容已生成，请在预览区查看')
    }
  } catch (error) {
    ElMessage.error('导出失败：' + error.message)
  } finally {
    exporting.value = false
  }
}

const preview = async () => {
  ElMessage.info('预览功能正在开发中...')
}

const exportMonthlyReport = () => {
  ElMessage.info('月度报告导出功能正在开发中...')
}

const exportWeeklyReport = () => {
  ElMessage.info('周报导出功能正在开发中...')
}

const exportProgressReport = async () => {
  exporting.value = true
  try {
    const result = await compareMonthlyProgress(exportOptions.value.childId)
    previewContent.value = result
  } catch (error) {
    ElMessage.error('导出失败')
  } finally {
    exporting.value = false
  }
}

const formatPreview = (content) => {
  if (!content) return ''
  return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>')
}

onMounted(() => {
  if (route.params.childId) {
    exportOptions.value.childId = parseInt(route.params.childId)
  }
})
</script>

<style scoped>
.export-page { max-width: 900px; margin: 0 auto; }

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.options-card, .preview-card, .download-card, .report-card { margin-bottom: 20px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.preview-content {
  max-height: 500px;
  overflow-y: auto;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
  line-height: 1.8;
}

.download-box {
  text-align: center;
  padding: 30px;
}

.download-box p { margin-bottom: 20px; }

.download-box .tip {
  margin-top: 15px;
  color: #909399;
  font-size: 12px;
}

.report-types {
  display: flex;
  gap: 20px;
}

.report-item {
  flex: 1;
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 15px;
}

.report-item:hover {
  border-color: #409EFF;
  background: #f0f9ff;
}

.report-icon { font-size: 36px; }

.report-info h4 { margin: 0 0 5px 0; }
.report-info p { margin: 0; color: #666; font-size: 13px; }
</style>
