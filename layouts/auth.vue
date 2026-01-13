<template>
  <div class="auth-layout">
    <TechParticles />
    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
}

.auth-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
