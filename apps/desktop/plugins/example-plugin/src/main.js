// 插件前端代码
// ztools API 通过 window.ztools 全局对象访问

document.getElementById('btn').addEventListener('click', () => {
  const greeting = document.getElementById('greeting')
  greeting.textContent = '你好，插件世界！'
  greeting.style.color = '#0891b2'

  // 使用 ztools API 显示通知
  if (window.ztools?.showNotification) {
    window.ztools.showNotification('插件已响应')
  }
})

// 监听插件进入事件
window.ztools?.onPluginEnter((params) => {
  console.log('插件启动参数:', params)
  document.getElementById('greeting').textContent =
    `接收到的参数: ${JSON.stringify(params.payload || '无')}`
})