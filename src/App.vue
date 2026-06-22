<template>
  <el-config-provider :locale="zhCn">
    <div class="app-container">
      <!-- 顶部导航 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon><Reading /></el-icon>
          <span class="title">自适应学习管理系统</span>
        </div>
        <div class="header-right">
          <el-select v-model="currentChildId" placeholder="选择孩子" @change="onChildChange">
            <el-option label="小明" :value="1" />
            <el-option label="小红" :value="2" />
          </el-select>
        </div>
      </el-header>

      <!-- 主内容区 -->
      <el-container class="main-container">
        <!-- 侧边栏 -->
        <el-aside width="200px" class="sidebar">
          <el-menu :default-active="activeMenu" @select="onMenuSelect">
            <el-menu-item index="dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>家长驾驶舱</span>
            </el-menu-item>
            <el-menu-item index="wrongQuestions">
              <el-icon><Document /></el-icon>
              <span>错题列表</span>
            </el-menu-item>
            <el-menu-item index="report">
              <el-icon><DataLine /></el-icon>
              <span>学习报告</span>
            </el-menu-item>
            <el-menu-item index="addQuestion">
              <el-icon><Plus /></el-icon>
              <span>添加错题</span>
            </el-menu-item>
            <el-menu-item index="aiTutor">
              <el-icon><ChatDotRound /></el-icon>
              <span>AI 讲解</span>
            </el-menu-item>
            <el-menu-item index="export">
              <el-icon><Download /></el-icon>
              <span>导出 PDF</span>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <!-- 内容区 -->
        <el-main class="content">
          <router-view :key="routeKey" />
        </el-main>
      </el-container>

      <!-- 对话对话框 -->
      <el-dialog v-model="chatVisible" title="AI 助手" width="600px">
        <div class="chat-container">
          <div class="chat-messages" ref="chatMessages">
            <div v-for="(msg, index) in chatMessages" :key="index" 
                 :class="['chat-message', msg.role]">
              <div class="message-content">{{ msg.content }}</div>
            </div>
          </div>
          <div class="chat-input">
            <el-input v-model="chatInput" placeholder="输入问题..." @keyup.enter="sendChat">
              <template #append>
                <el-button @click="sendChat">发送</el-button>
              </template>
            </el-input>
          </div>
        </div>
      </el-dialog>

      <!-- 右下角 AI 助手悬浮按钮 -->
      <div class="ai-assistant" @click="chatVisible = true">
        <el-badge :value="unreadCount" :hidden="unreadCount === 0">
          <el-icon :size="28"><ChatDotRound /></el-icon>
        </el-badge>
      </div>
    </div>
  </el-config-provider>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'
import { callCozeAgent, callCozeAgentStream } from './api/learning'

const router = useRouter()
const route = useRoute()

const activeMenu = ref('dashboard')
const currentChildId = ref(1)
const chatVisible = ref(false)
const chatInput = ref('')
const chatMessages = ref([])
const unreadCount = ref(0)

const routeKey = computed(() => route.path + currentChildId.value)

const onMenuSelect = (index) => {
  activeMenu.value = index
  router.push({ name: index, params: { childId: currentChildId.value } })
}

const onChildChange = () => {
  router.push({ name: activeMenu.value, params: { childId: currentChildId.value } })
  refreshCurrentView()
}

const refreshCurrentView = () => {
  // 触发视图刷新
}

const sendChat = async () => {
  if (!chatInput.value.trim()) return
  
  const userMsg = { role: 'user', content: chatInput.value }
  chatMessages.value.push(userMsg)
  const input = chatInput.value
  chatInput.value = ''
  
  await nextTick()
  scrollToBottom()

  try {
    const response = await callCozeAgent(input, currentChildId.value)
    if (response) {
      chatMessages.value.push({ role: 'assistant', content: response })
      unreadCount.value++
    }
  } catch (error) {
    chatMessages.value.push({ role: 'assistant', content: '抱歉，发生了错误：' + error.message })
  }
  
  await nextTick()
  scrollToBottom()
}

const scrollToBottom = () => {
  const el = document.querySelector('.chat-messages')
  if (el) el.scrollTop = el.scrollHeight
}
</script>

<style scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
}

.header-right .el-select {
  width: 150px;
}

.main-container {
  flex: 1;
  overflow: hidden;
}

.sidebar {
  background: #f5f7fa;
  padding-top: 10px;
}

.content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.chat-container {
  height: 400px;
  display: flex;
  flex-direction: column;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
}

.chat-message {
  margin-bottom: 15px;
}

.chat-message.user {
  text-align: right;
}

.message-content {
  display: inline-block;
  padding: 10px 15px;
  border-radius: 10px;
  max-width: 80%;
  white-space: pre-wrap;
}

.chat-message.user .message-content {
  background: #667eea;
  color: white;
}

.chat-message.assistant .message-content {
  background: #f0f0f0;
  color: #333;
}

.chat-input {
  margin-top: 10px;
}

.ai-assistant {
  position: fixed;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  transition: transform 0.3s;
}

.ai-assistant:hover {
  transform: scale(1.1);
}
</style>
