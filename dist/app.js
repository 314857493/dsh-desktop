// Splash page logic: shows an error state when the Rust shell routes here
// with an ?error= query (server failed to start), otherwise it just waits —
// the Rust shell navigates the window to the live DSH URL once ready.
(function () {
  'use strict'

  var params = new URLSearchParams(window.location.search)
  var error = params.get('error')

  if (error) {
    var spinner = document.getElementById('spinner')
    var status = document.getElementById('status')
    var detail = document.getElementById('detail')
    if (spinner) spinner.classList.add('hidden')
    if (status) {
      status.textContent = '启动失败'
      status.style.color = '#ff7b72'
    }
    if (detail) {
      detail.textContent = error
      detail.style.color = '#ffa198'
    }
    document.title = 'DSH Desktop — 启动失败'
  }
})()
