<template>
  <div class="report">
    <h2 class="page-title">📈 学习报告</h2>
    
    <!-- 时间选择 -->
    <el-card shadow="never" class="time-card">
      <el-radio-group v-model="timeRange" @change="loadReport">
        <el-radio-button label="7">近7天</el-radio-button>
        <el-radio-button label="30">近30天</el-radio-button>
        <el-radio-button label="90">近90天</el-radio-button>
      </el-radio-group>
      <el-button type="primary" @click="loadReport" style="margin-left: 20px">
        <el-icon><Refresh /></el-icon> 刷新
      </el-button>
    </el-card>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在生成报告...</span>
    </div>

    <!-- 报告内容 -->
    <div v-else class="report-content">
      <!-- 周报概览 -->
      <el-card shadow="hover" class="overview-card">
        <template #header>
          <div class="card-header">
            <span>📋 周报概览</span>
          </div>
        </template>
        <div class="overview-content" v-html="formatContent(reportData)"></div>
      </el-card>

      <!-- 知识热力图 -->
      <el-card shadow="hover" class="heatmap-card">
        <template #header>
          <div class="card-header">
            <span>🔥 知识热力图</span>
            <el-select v-model="selectedSubject" placeholder="选择学科" size="small" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="数学" value="数学" />
              <el-option label="语文" value="语文" />
              <el-option label="英语" value="英语" />
            </el-select>
          </div>
        </template>
        <div class="heatmap-container">
          <div v-for="(item, index) in heatmapData" :key="index" class="heatmap-item" :style="getHeatmapStyle(item.level)">
            <span class="chapter-name">{{ item.chapter }}</span>
            <span class="chapter-rate">{{ item.rate }}%</span>
          </div>
        </div>
        <div class="heatmap-legend">
          <span class="legend-item"><span class="dot red"></span>薄弱</span>
          <span class="legend-item"><span class="dot yellow"></span>一般</span>
          <span class="legend-item"><span class="dot green"></span>掌握</span>
        </div>
      </el-card>

      <!-- 月度对比 -->
      <el-card shadow="hover" class="compare-card">
        <template #header>
          <div class="card-header">
            <span>📊 月度进度对比</span>
            <el-button size="small" type="primary" @click="loadCompare">
              查看对比
            </el-button>
          </div>
        </template>
        <div class="compare-content" v-if="compareData" v-html="formatContent(compareData)"></div>
        <el-empty v-else description="点击按钮查看对比"></el-empty>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { getLearningReport, compareMonthlyProgress } from '../api/learning'

const route = useRoute()
const childId = ref(route.params.childId || 1)
const loading = ref(false)
const timeRange = ref('7')
const selectedSubject = ref('')
const reportData = ref('')
const compareData = ref('')

const heatmapData = ref([
  { chapter: '第1章 有理数', rate: 85, level: 2 },
  { chapter: '第2章 整式', rate: 72, level: 1 },
  { chapter: '第3章 一元方程', rate: 45, level: 0 },
  { chapter: '第4章 几何基础', rate: 90, level: 2 },
  { chapter: '第5章 分数运算', rate: 30, level: 0 },
])

const getHeatmapStyle = (level) => {
  const colors = {
    0: { bg: '#ffcccc', border: '#ff6666' },  // 薄弱 - 红色
    1: { bg: '#fff3cd', border: '#ffc107' },  // 一般 - 黄色
    2: { bg: '#d4edda', border: '#28a745' }   // 掌握 - 绿色
  }
  const color = colors[level] || colors[1]
  return {
    backgroundColor: color.bg,
    borderColor: color.border
  }
}

const loadReport = async () => {
  loading.value = true
  try {
    reportData.value = await getLearningReport(childId.value, parseInt(timeRange.value))
  } catch (error) {
    console.error('加载报告失败:', error)
  } finally {
    loading.value = false
  }
}

const loadCompare = async () => {
  loading.value = true
  try {
    compareData.value = await compareMonthlyProgress(childId.value)
  } catch (error) {
    console.error('加载对比失败:', error)
  } finally {
    loading.value = false
  }
}

const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

onMounted(() => {
  loadReport()
})
</script>

<style scoped>
.report { max-width: 1200px; margin: 0 auto; }

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.time-card { margin-bottom: 20px; }

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 50px;
  color: #666;
}

.overview-card, .heatmap-card, .compare-card { margin-bottom: 20px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.overview-content {
  line-height: 1.8;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
}

.heatmap-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.heatmap-item {
  padding: 15px 20px;
  border-radius: 8px;
  border: 2px solid;
  min-width: 150px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 5px;
}

.chapter-name { font-weight: 500; font-size: 14px; }
.chapter-rate { font-size: 20px; font-weight: bold; }

.heatmap-legend {
  display: flex;
  gap: 20px;
  justify-content: center;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.legend-item { display: flex; align-items: center; gap: 5px; }

.dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}
.dot.red { background: #ff6666; }
.dot.yellow { background: #ffc107; }
.dot.green { background: #28a745; }

.compare-content {
  line-height: 1.8;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
}
</style>
