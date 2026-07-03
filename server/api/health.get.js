export default defineEventHandler(async (event) => {
  return {
    success: true,
    status: 'ok',
    time: new Date().toISOString()
  }
})
