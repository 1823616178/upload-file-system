<template>
  <div class="global-loader-container">
    <div class="quantum-spinner">
      <div class="orbit orbit-1"></div>
      <div class="orbit orbit-2"></div>
      <div class="orbit orbit-3"></div>
      <div class="central-core"></div>
    </div>
    <p v-if="text" class="loader-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: '加载中...'
  }
})
</script>

<style scoped lang="scss">
.global-loader-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
}

.loader-text {
  font-family: 'Orbitron', sans-serif; /* Fallback to sans-serif if font not loaded */
  color: #00d4ff;
  font-size: 16px;
  letter-spacing: 2px;
  text-transform: uppercase;
  animation: textPulse 2s ease-in-out infinite;
  text-shadow: 0 0 10px rgba(0, 212, 255, 0.5);
}

.quantum-spinner {
  position: relative;
  width: 80px;
  height: 80px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.central-core {
  position: absolute;
  width: 20px;
  height: 20px;
  background: #ffffff;
  border-radius: 50%;
  box-shadow: 0 0 20px #00d4ff, 0 0 40px #00d4ff;
  animation: corePulse 1.5s ease-in-out infinite;
  z-index: 10;
}

.orbit {
  position: absolute;
  border-radius: 50%;
  border: 2px solid transparent;
}

.orbit-1 {
  width: 100%;
  height: 100%;
  border-top: 2px solid #00d4ff;
  border-bottom: 2px solid #00d4ff;
  box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
  animation: spin 3s linear infinite;
}

.orbit-2 {
  width: 70%;
  height: 70%;
  border-left: 2px solid #00ff88;
  border-right: 2px solid #00ff88;
  box-shadow: 0 0 15px rgba(0, 255, 136, 0.5);
  animation: spinReverse 2s linear infinite;
}

.orbit-3 {
  width: 130%;
  height: 130%;
  border: 1px dashed rgba(0, 212, 255, 0.3);
  animation: spin 8s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes spinReverse {
  0% { transform: rotate(360deg); }
  100% { transform: rotate(0deg); }
}

@keyframes corePulse {
  0%, 100% { transform: scale(0.8); opacity: 0.8; }
  50% { transform: scale(1.2); opacity: 1; box-shadow: 0 0 30px #00d4ff, 0 0 60px #00d4ff; }
}

@keyframes textPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; text-shadow: 0 0 15px rgba(0, 212, 255, 0.8); }
}
</style>
