import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Read-only anonymous browser checks. Profiles and captures stay under .tmp.
const root = fileURLToPath(new URL('../', import.meta.url))
const output = path.join(root, '.tmp', 'screenshots')
const browserPath = process.env.BROWSER_EXECUTABLE ?? [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(candidate => fs.existsSync(candidate))
if (!browserPath) throw new Error('Chrome or Edge is required; set BROWSER_EXECUTABLE to its executable.')
fs.mkdirSync(output, { recursive: true })
const children = []
const delay = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds))

function start(command, args) {
  const child = spawn(command, args, { cwd: root, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] })
  children.push(child)
  return child
}

async function startServer(app, port) {
  const child = start(process.execPath, [
    'node_modules/vite/bin/vite.js', '--config', 'apps/' + app + '/vite.config.ts',
    '--host', '127.0.0.1', '--port', String(port), '--strictPort',
  ])
  let log = ''
  let startError
  child.on('error', error => { startError = error })
  child.stdout.on('data', data => { log += data.toString() })
  child.stderr.on('data', data => { log += data.toString() })
  const url = 'http://127.0.0.1:' + port
  for (let attempt = 0; attempt < 120; attempt++) {
    if (startError) throw startError
    if (child.exitCode !== null) throw new Error(app + ' server failed: ' + log.slice(-3000))
    try { if ((await fetch(url)).ok) return url } catch { /* Wait for startup. */ }
    await delay(250)
  }
  throw new Error(app + ' server did not become ready: ' + log.slice(-3000))
}

async function connectBrowser() {
  const profile = path.join(root, '.tmp', 'browser-smoke', 'profile-' + Date.now())
  const browser = start(browserPath, [
    '--headless=new', '--disable-gpu', '--disable-background-networking', '--disable-sync', '--no-first-run', '--no-default-browser-check',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank',
  ])
  const debugUrl = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Browser did not expose its debugging connection.')), 20000)
    browser.on('error', error => { clearTimeout(timer); reject(error) })
    browser.on('exit', code => { clearTimeout(timer); reject(new Error('Browser exited before connecting: ' + code)) })
    browser.stderr.on('data', data => {
      const match = data.toString().match(/DevTools listening on (ws:\/\/\S+)/)
      if (match) { clearTimeout(timer); resolve(match[1]) }
    })
  })
  const socket = new WebSocket(debugUrl)
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once: true })
    socket.addEventListener('error', reject, { once: true })
  })
  let sequence = 0
  const pending = new Map()
  const issues = new Map()
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const operation = pending.get(message.id)
      if (operation) {
        clearTimeout(operation.timer)
        pending.delete(message.id)
        if (message.error) operation.reject(new Error(message.error.message))
        else operation.resolve(message.result)
      }
      return
    }
    const currentIssues = issues.get(message.sessionId)
    if (!currentIssues) return
    if (message.method === 'Runtime.exceptionThrown') {
      const detail = message.params.exceptionDetails
      currentIssues.push(detail.exception?.description ?? detail.text)
    }
    if (message.method === 'Network.responseReceived') {
      const response = message.params.response
      if (response.status >= 400 && response.url.startsWith('http://127.0.0.1:')) {
        currentIssues.push('HTTP ' + response.status + ' ' + response.url)
      }
    }
  })
  const send = (method, params = {}, sessionId) => new Promise((resolve, reject) => {
    const id = ++sequence
    const timer = setTimeout(() => { pending.delete(id); reject(new Error('Browser command timed out: ' + method)) }, 20000)
    pending.set(id, { resolve, reject, timer })
    socket.send(JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }))
  })
  return { socket, send, issues }
}

async function inspectPage(connection, name, url, width = 1440, height = 1000) {
  const { targetId } = await connection.send('Target.createTarget', { url: 'about:blank' })
  const { sessionId } = await connection.send('Target.attachToTarget', { targetId, flatten: true })
  connection.issues.set(sessionId, [])
  const send = (method, params) => connection.send(method, params, sessionId)
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await send('Page.navigate', { url })
  const expression = `(() => ({
    title: document.title, path: location.pathname, text: document.body.innerText,
    hasRoot: !!document.querySelector('#root')?.firstElementChild,
    viteError: !!document.querySelector('vite-error-overlay'),
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
    anchors: [...document.querySelectorAll('a')].map(a => ({ text: a.innerText, href: a.getAttribute('href'), image: !!a.querySelector('img') })),
    buttons: [...document.querySelectorAll('button')].map(button => button.innerText),
    inputs: [...document.querySelectorAll('input')].map(input => ({ type: input.type, placeholder: input.placeholder })),
    brokenImages: [...document.images].filter(image => image.complete && image.naturalWidth === 0).map(image => image.getAttribute('src')),
  }))()`
  let snapshot
  for (let attempt = 0; attempt < 100; attempt++) {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true })
    snapshot = result.result?.value
    if (snapshot?.viteError || (snapshot?.hasRoot && snapshot.text.trim() && !/^Chargement[.…\s]*$/.test(snapshot.text.trim()))) break
    await delay(200)
  }
  await send('Runtime.evaluate', { expression: 'document.fonts.ready.then(() => true)', awaitPromise: true })
  await delay(1000)
  const result = await send('Runtime.evaluate', { expression, returnByValue: true })
  snapshot = result.result?.value ?? snapshot
  const capture = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false })
  const screenshot = path.join(output, name + '.png')
  fs.writeFileSync(screenshot, Buffer.from(capture.data, 'base64'))
  const entry = { name, url, width, height, screenshot, ...snapshot, issues: connection.issues.get(sessionId) }
  await connection.send('Target.closeTarget', { targetId })
  assert(snapshot?.hasRoot, name + ': application did not render')
  assert(!snapshot.viteError, name + ': Vite error overlay')
  assert(!entry.issues.length, name + ': runtime or local network error: ' + entry.issues.join('; '))
  assert(!snapshot.overflow, name + ': horizontal overflow')
  assert(!snapshot.brokenImages.length, name + ': broken images: ' + snapshot.brokenImages.join(', '))
  return entry
}

const report = []
let connection
try {
  const site = await startServer('site', 4280)
  const admin = await startServer('admin', 4281)
  connection = await connectBrowser()
  for (const [name, url, width, height] of [
    ['site-home', site + '/', 1440, 1000],
    ['site-login', site + '/login', 1440, 1000],
    ['site-admin-404', site + '/admin', 1440, 1000],
    ['admin-login', admin + '/login', 1440, 1000],
    ['site-login-mobile', site + '/login', 390, 844],
    ['admin-login-mobile', admin + '/login', 390, 844],
  ]) {
    const entry = await inspectPage(connection, name, url, width, height)
    report.push(entry)
    if (name.startsWith('site-login')) {
      assert(entry.buttons.includes('Parent') && entry.buttons.includes('Enseignant'), name + ': expected public roles absent')
      assert(!entry.buttons.includes('Administration'), name + ': admin role visible on public login')
      assert(entry.inputs.some(input => input.type === 'password'), name + ': password input absent')
      assert(entry.anchors.some(anchor => anchor.image && anchor.href === '/'), name + ': logo does not link to homepage')
    }
    if (name.startsWith('admin-login')) assert(entry.text.includes('Administration') || entry.text.includes('administration'), name + ': administration label absent')
    if (name === 'site-admin-404') assert(entry.text.includes('404') && entry.text.includes('Page introuvable'), name + ': public admin path is not a 404 view')
    console.log('PASS ' + name + ' — ' + entry.screenshot)
  }
} finally {
  fs.writeFileSync(path.join(output, 'browser-smoke-report.json'), JSON.stringify(report, null, 2))
  connection?.socket.close()
  for (const child of children.reverse()) child.kill()
}
