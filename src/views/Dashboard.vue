<template>
  <div class="dashboard">
    <h2 class="page-title">📊 家长驾驶舱</h2>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      <el-icon class="is-loading"><Loading /></el-icon>
      <span>正在加载数据...</span>
    </div>

    <!-- 数据展示 -->
    <div v-else-if="dashboardData" class="dashboard-content">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-cards">
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card total">
            <div class="stat-icon">📚</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.total }}</div>
              <div class="stat-label">错题总数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card mastered">
            <div class="stat-icon">✅</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.mastered }}</div>
              <div class="stat-label">已掌握</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card week">
            <div class="stat-icon">🆕</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.newThisWeek }}</div>
              <div class="stat-label">本周新增</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card shadow="hover" class="stat-card review">
            <div class="stat-icon">📅</div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.toReview }}</div>
              <div class="stat-label">待复习</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 掌握率 -->
      <el-card shadow="hover" class="mastery-card">
        <template #header>
          <div class="card-header">
            <span>🎯 整体掌握率</span>
          </div>
        </template>
        <div class="mastery-progress">
          <el-progress :percentage="stats.masteryRate" :color="masteryColor" :stroke-width="20">
            <span>{{ stats.masteryRate }}%</span>
          </el-progress>
        </div>
      </el-card>

      <!-- 错误原因分布 -->
      <el-card shadow="hover" class="reason-card">
        <template #header>
          <div class="card-header">
            <span>🔍 错误原因分析</span>
          </div>
        </template>
        <div class="reason-chart" ref="reasonChart"></div>
        <div class="reason-list">
          <div v-for="(item, index) in reasons" :key="index" class="reason-item">
            <span class="reason-name">{{ item.name }}</span>
            <span class="reason-count">{{ item.count }}道</span>
            <span class="reason-percent">({{ item.percent }}%)</span>
          </div>
        </div>
      </el-card>

      <!-- 智能体原始回复 -->
      <el-card shadow="hover" class="raw-data-card">
        <template #header>
          <div class="card-header">
            <span>💬 AI 详细分析</span>
            <el-button size="small" @click="refresh">刷新</el-button>
          </div>
        </template>
        <div class="raw-content" v-html="formatContent(dashboardData)"></div>
      </el-card>
    </div>

    <!-- 错误状态 -->
    <el-empty v-else description="暂无数据">
      <el-button type="primary" @click="refresh">加载数据</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { getParentDashboard } from '../api/learning'
import * as echarts from 'echarts'

const route = useRoute()
const loading = ref(false)
const dashboardData = ref('')
const reasonChart = ref(null)

const childId = computed(() => route.params.childId || 1)

// 解析统计数据
const stats = computed(() => {
  const data = dashboardData.value || ''
  const result = {
    total: 0,
    mastered: 0,
    masteryRate: 0,
    newThisWeek: 0,
    toReview: 0
  }
  
  // 简单解析
  const totalMatch = data.match(/错题总数[：:]\s*(\d+)/)
  const masteredMatch = data.match(/已掌握[：:]\s*(\d+)/)
  const rateMatch = data.match(/(\d+(?:\.\d+)?)\s*%/)
  const weekMatch = data.match(/本周新增[：:]\s*(\d+)/)
  
  if (totalMatch) result.total = parseInt(totalMatch[1])
  if (masteredMatch) result.mastered = parseInt(masteredMatch[1])
  if (rateMatch) result.masteryRate = parseFloat(rateMatch[1])
  if (weekMatch) result.newThisWeek = parseInt(weekMatch[1])
  
  return result
})

// 错误原因
const reasons = computed(() => {
  const data = dashboardData.value || ''
  const result = []
  const matches = data.matchAll(/([^\n：:]+)[：:]\s*(\d+)道[（(](\d+)%[)）]/g)
  for (const match of matches) {
    result.push({
      name: match[1].trim(),
      count: parseInt(match[2]),
      percent: parseInt(match[3])
    })
  }
  return result
})

// 掌握率颜色
const masteryColor = computed(() => {
  const rate = stats.value.masteryRate
  if (rate >= 80) return '#67C23A'
  if (rate >= 50) return '#E6A23C'
  return '#F56C6C'
})

// 格式化内容
const formatContent = (content) => {
  if (!content) return ''
  return content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

// 刷新数据
const refresh = async () => {
  loading.value = true
  try {
    dashboardData.value = await getParentDashboard(childId.value)
    await nextTick()
    renderChart()
  } catch (error) {
    console.error('加载失败:', error)
  } finally {
    loading.value = false
  }
}

// 渲染饼图
const renderChart = () => {
  if (!reasonChart.value || reasons.value.length === 0) return
  
  const chart = echarts.init(reasonChart.value)
  chart.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14 } },
      data: reasons.value.map((r, i) => ({
        value: r.count,
        name: `${r.name} ${r.percent}%`,
        itemStyle: { color: ['#F56C6C', '#E6A23C', '#409EFF', '#67C23A'][i % 4] }
      }))
    }]
  })
}

onMounted(() => {
  refresh()
})

watch(() => route.params.childId, () => {
  refresh()
})
</script>

<style scoped>
.dashboard { max-width: 1200px; margin: 0 auto; }

.page-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 50px;
  color: #666;
}

.stat-cards { margin-bottom: 20px; }

.stat-card {
  display: flex;
  align-items: center;
  padding: 20px;
  gap: 15px;
}

.stat-icon { font-size: 36px; }

.stat-value { font-size: 28px; font-weight: bold; color: #333; }
.stat-label { font-size: 14px; color: #666; }

.mastery-card, .reason-card, .raw-data-card { margin-bottom: 20px; }

.card-header { display: flex; justify-content: space-between; align-items: center; }

.mastery-progress { padding: 20px 0; }

.reason-chart { height: 200px; margin-bottom: 20px; }

.reason-list { display: flex; flex-wrap: wrap; gap: 15px; }

.reason-item {
  background: #f5f7fa;
  padding: 10px 15px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.reason-name { font-weight: 500; }
.reason-count { color: #409EFF; }
.reason-percent { color: #909399; font-size: 12px; }

.raw-content {
  line-height: 1.8;
  padding: 10px;
  background: #f9f9f9;
  border-radius: 8px;
  white-space: pre-wrap;
}
</style>
