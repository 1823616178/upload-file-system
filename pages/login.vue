<template>
  <div class="login-container">
    <div class="login-card">
      <div class="brand-header">
        <div class="logo-wrapper">
           <img src="/logo-black.png" alt="Logo" class="brand-logo" />
        </div>
        <h1 class="brand-title">欢迎回来</h1>
        <p class="brand-subtitle">汉王数字文件上传系统</p>
      </div>
      
      <form @submit.prevent="login" class="login-form">
        <div class="form-group">
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" width="20" height="20">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="12" cy="7" r="4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input type="text" id="username" v-model="username" placeholder="请输入用户名" required>
          </div>
        </div>
        
        <div class="form-group">
          <div class="input-wrapper">
            <svg class="input-icon" viewBox="0 0 24 24" width="20" height="20">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <input type="password" id="password" v-model="password" placeholder="请输入密码" required>
          </div>
        </div>

        <div class="form-footer">
          <label class="remember-me">
            <input type="checkbox">
            <span>记住我</span>
          </label>
        </div>

        <div v-if="error" class="error-message">
          <svg viewBox="0 0 24 24" width="16" height="16">
            <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" stroke-width="2"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" stroke-width="2"/>
          </svg>
          {{ error }}
        </div>
        
        <button type="submit" class="btn-login" :class="{ 'loading': isLoading }" :disabled="isLoading">
           <span v-if="!isLoading">登录</span>
           <span v-else class="loader"></span>
        </button>
      </form>
    </div>
    
    <div class="copyright">
      © 2026 汉王数字 · 智能科技服务未来
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

definePageMeta({
  layout: 'auth'
})

const username = ref('');
const password = ref('');
const error = ref(null);
const isLoading = ref(false);
const router = useRouter();

const login = async () => {
  error.value = null;
  isLoading.value = true;
  
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: username.value,
        password: password.value,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      router.push('/');
    } else {
      error.value = data.message || '登录失败，请重试';
    }
  } catch (e) {
    error.value = '无法连接到服务器';
  } finally {
    isLoading.value = false;
  }
};
</script>

<style lang="scss" scoped>
@import '~/assets/styles/login.scss';
</style>