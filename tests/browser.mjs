// Optional browser smoke test. Start the dev server and a headless Chromium
// instance with --remote-debugging-port=9222 before running this file.
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';

const targets = await (await fetch(`http://127.0.0.1:${process.argv[2] || 9222}/json/list`)).json();
const target = targets.find(t => t.type === 'page');
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let counter = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', event => {
  const message = JSON.parse(event.data);
  if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text + ' ' + (message.params.exceptionDetails.exception?.description || ''));
  if (message.id && pending.has(message.id)) {
    const { resolve, reject, timeout } = pending.get(message.id); clearTimeout(timeout); pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error))); else resolve(message.result);
  }
});
function send(method, params = {}) {
  return new Promise((resolve, reject) => { const id = ++counter; const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`Timeout: ${method}`)); }, 15000); pending.set(id, { resolve, reject, timeout }); ws.send(JSON.stringify({ id, method, params })); });
}
async function evaluate(expression) {
  const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}
const pause = ms => new Promise(r => setTimeout(r, ms));
async function waitFor(expression) { for (let i = 0; i < 60; i++) { if (await evaluate(expression)) return; await pause(100); } throw new Error(`Condition not met: ${expression}`); }
const click = selector => evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
async function fill(value) { await evaluate(`(() => { const input = document.querySelector('#provider-search'); input.value = ${JSON.stringify(value)}; input.dispatchEvent(new Event('input', { bubbles: true })); })()`); }
async function sort(value) { await evaluate(`(() => { const input = document.querySelector('#sort-select'); input.value = '${value}'; input.dispatchEvent(new Event('change', { bubbles: true })); })()`); }
const ids = () => evaluate(`[...document.querySelectorAll('.provider-card')].map(c => c.dataset.provider)`);
async function key(key, code, modifiers = 0) { await send('Input.dispatchKeyEvent', { type: 'keyDown', key, code: key, windowsVirtualKeyCode: code, modifiers }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code: key, windowsVirtualKeyCode: code, modifiers }); }
async function viewport(width, height = 1000) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 700 }); await pause(150); }
async function screenshot(name) { await pause(700); const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }); await writeFile(`.test-artifacts/${name}.png`, Buffer.from(result.data, 'base64')); }

try {
  await mkdir('.test-artifacts', { recursive: true });
  await send('Runtime.enable'); await send('Page.enable');
  await viewport(1440, 1100);
  await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
  await waitFor(`document.querySelectorAll('.provider-card').length === 9`);
  await evaluate(`localStorage.setItem('atlas-theme','dark'); document.documentElement.dataset.theme = 'dark'`);
  assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, 'Desktop has no horizontal overflow');
  await screenshot('desktop');
  await fill('Whisper'); assert.equal((await ids()).length, 2, 'Model search');
  await fill('no-provider-<img src=x onerror=alert(1)>');
  assert.equal((await ids()).length, 0); assert.equal(await evaluate(`document.querySelectorAll('.active-filters img').length`), 0);
  await click('.empty-state .reset-all'); assert.equal((await ids()).length, 9);
  await click('#desktop-status-1'); assert.deepEqual(await ids(), ['agentrouter', 'mistral']);
  await click('#desktop-clients-1'); assert.deepEqual(await ids(), ['agentrouter']);
  assert.equal(await evaluate(`document.querySelector('[data-count-key="status"][data-option="Beta"]').textContent`), '1');
  await click('.filter-heading .reset-all');
  await evaluate(`document.querySelector('#tab-all').focus()`); await key('ArrowRight', 39);
  assert.deepEqual(await ids(), ['pixrouter', 'qronos']);
  assert.equal(await evaluate(`document.activeElement.id`), 'tab-top');
  await click('#tab-all'); await sort('name'); assert.equal((await ids())[0], 'agentrouter');
  await sort('newest'); assert.equal((await ids())[0], 'mistral');
  await sort('latency'); assert.equal((await ids())[0], 'groq'); assert.equal((await ids()).at(-1), 'workers');
  await click('#tab-disabled'); assert.deepEqual(await ids(), ['workers']);
  await evaluate(`document.querySelector('[data-details="workers"]').focus()`); await click('[data-details="workers"]');
  assert.equal(await evaluate(`document.querySelector('.details-dialog').open`), true);
  assert.equal(await evaluate(`document.activeElement.classList.contains('close-details')`), true, 'Modal starts focused on close');
  for (let i = 0; i < 8; i++) { await key('Tab', 9); assert.equal(await evaluate(`document.querySelector('.details-dialog').contains(document.activeElement)`), true, 'Native focus trap'); }
  await key('Escape', 27); assert.equal(await evaluate(`document.querySelector('.details-dialog').open`), false);
  assert.equal(await evaluate(`document.activeElement.dataset.details`), 'workers', 'Focus returns to trigger');
  await click('[data-details="workers"]'); await click('.close-details');
  await click('[data-details="workers"]'); await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 5, y: 5, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 5, y: 5, button: 'left', clickCount: 1 });
  assert.equal(await evaluate(`document.querySelector('.details-dialog').open`), false, 'Backdrop closes');
  await click('#tab-all'); await sort('curated'); await click('[data-details="pixrouter"]');
  await send('Browser.grantPermissions', { origin: 'http://127.0.0.1:5173', permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] });
  await click('[data-copy]'); await waitFor(`document.querySelector('.toast').textContent.includes('Copied')`);
  assert.equal(await evaluate(`navigator.clipboard.readText()`), 'https://api.example.com/pixrouter/v1');
  await screenshot('details'); await click('.close-details');
  await click('nav a[href="#guides"]'); await waitFor(`!document.querySelector('#guides-view').hidden`);
  assert.equal(await evaluate(`document.querySelector('.guide-code code').textContent.includes('\\\n')`), true, 'Guide has multiline shell example');
  await click('nav a[href="#discover"]'); await waitFor(`!document.querySelector('#discover-view').hidden`);
  await click('.theme-toggle'); assert.equal(await evaluate(`document.documentElement.dataset.theme`), 'light');
  await send('Page.reload'); await waitFor(`document.querySelectorAll('.provider-card').length === 9`);
  assert.equal(await evaluate(`document.documentElement.dataset.theme`), 'light', 'Theme persists');
  await screenshot('light'); await click('.theme-toggle');
  for (const width of [1024, 768, 390, 320]) {
    await viewport(width, 900);
    assert.equal(await evaluate(`document.documentElement.scrollWidth <= innerWidth`), true, `No horizontal overflow at ${width}`);
    if (width === 768) await screenshot('tablet');
    if (width === 390) {
      assert.equal(await evaluate(`getComputedStyle(document.querySelector('.filter-dialog')).display`), 'none', 'Closed mobile drawer is hidden');
      await screenshot('mobile'); await click('.mobile-filters');
      assert.equal(await evaluate(`document.querySelector('.filter-dialog').open`), true);
      await click('#mobile-status-1'); assert.deepEqual(await ids(), ['agentrouter', 'mistral']);
      assert.ok(await evaluate(`document.querySelector('.show-providers').textContent.includes('2 providers')`));
      await screenshot('mobile-filters'); await click('.show-providers');
      assert.equal(await evaluate(`document.querySelector('.filter-dialog').open`), false);
      await click('[data-details="agentrouter"]');
      assert.equal(await evaluate(`document.querySelector('.details-dialog').getBoundingClientRect().width < innerWidth`), true);
      await screenshot('mobile-details'); await key('Escape', 27); await click('.active-filters .reset-all');
    }
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await click('#tab-new'); await pause(500);
  assert.equal(await evaluate(`document.getAnimations().length`), 0, 'Reduced motion stops all animations');
  assert.equal((await ids()).length, 3, 'Reduced motion preserves interactions');
  assert.deepEqual(errors, [], 'No browser runtime exceptions');
  console.log('Browser checks passed: search, filters, counts, collections, sorts, keyboard tabs, modal focus/Escape/backdrop, clipboard, guides, theme persistence, 1440/1024/768/390/320 layouts, mobile drawer, and reduced motion.');
  console.log('Screenshots saved in .test-artifacts/.');
} finally { ws.close(); }
