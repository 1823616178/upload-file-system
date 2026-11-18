<template>
  <div class="auth-layout">
    <TechParticles />
    <div class="auth-ambient-glow" aria-hidden="true"></div>
    <div class="auth-content">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.auth-layout {
  position: relative;
  width: 100vw;
  min-height: 100vh;
  overflow-x: hidden;
  background: radial-gradient(circle at 50% 35%, #16243d 0%, #0a0f1f 55%, #060913 100%);
}

.auth-ambient-glow {
  position: fixed;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background:
    radial-gradient(600px circle at 20% 20%, rgba(0, 212, 255, 0.1), transparent 60%),
    radial-gradient(500px circle at 80% 80%, rgba(0, 153, 255, 0.1), transparent 60%);
}

.auth-content {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>
