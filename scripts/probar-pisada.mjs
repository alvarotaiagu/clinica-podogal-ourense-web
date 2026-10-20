/* Prueba del módulo «Pisa aquí» (js/pisada.js) sobre pruebas/demo-pisada.html */
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const raiz = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const url = pathToFileURL(path.join(raiz, 'pruebas/demo-pisada.html')).href;
let fallos = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALLO ') + m); if (!c) fallos++; };
const nav = await chromium.launch();
for (const w of [1280, 390]) {
  const ctx = await nav.newContext({ viewport: { width: w, height: 900 }, deviceScaleFactor: w < 500 ? 2 : 1 });
  const p = await ctx.newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.addInitScript(() => { window.__largas = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__largas.push(e.duration))).observe({ type: 'longtask', buffered: true }); });
  await p.goto(url); await p.waitForTimeout(600);
  ok(await p.getAttribute('#pisada', 'data-montado') === '1', `${w}: montado`);
  await p.locator('.pisada-pant').scrollIntoViewIfNeeded(); await p.waitForTimeout(1200);
  // pie plano con teclado
  await p.locator('button[data-pie="plano"]').focus(); await p.keyboard.press('Enter');
  ok(await p.getAttribute('button[data-pie="plano"]', 'aria-pressed') === 'true', `${w}: pie plano elegido con teclado`);
  const r = p.locator('input[type=range]'); await r.focus();
  for (let i = 0; i < 10; i++) await p.keyboard.press('ArrowRight');
  ok(await r.inputValue() === '60', `${w}: fase con flechas → ${await r.inputValue()}`);
  ok((await p.textContent('.pisada-vivo')).includes('60 %'), `${w}: aria-live anuncia fase y reparto`);
  ok((await p.getAttribute('.pisada-can', 'aria-label')).includes('retropié'), `${w}: canvas con descripción`);
  // reproducir y medir fotogramas
  await p.locator('.pisada-play').click();
  const fot = await p.evaluate(() => new Promise(res => { const d = []; let a = performance.now(); const f = t => { d.push(t - a); a = t; d.length < 90 ? requestAnimationFrame(f) : res(d.slice(2)); }; requestAnimationFrame(f); }));
  ok(Math.max(...fot) < 50, `${w}: fotogramas reproduciendo, máx ${Math.max(...fot).toFixed(1)} ms`);
  const v1 = await r.inputValue(); await p.waitForTimeout(300); ok(await r.inputValue() !== v1, `${w}: reproducir avanza`);
  const largas = await p.evaluate(() => window.__largas);
  ok(!largas.some(d => d > 50), `${w}: sin tareas largas al montar, elegir y reproducir (${largas.map(d => d.toFixed(0)).join(', ') || 'ninguna'})`);
  // cavo + cambio solo de alto (barra del móvil): no rehace el canvas
  await p.locator('button[data-pie="cavo"]').click();
  await p.locator('.pisada-play').click();
  const anchoCan = await p.evaluate(() => { const c = document.querySelector('.pisada-can'); c.__marca = c.width; return c.width; });
  await p.setViewportSize({ width: w, height: 840 }); await p.waitForTimeout(300);
  ok(await p.evaluate(a => document.querySelector('.pisada-can').width === a, anchoCan), `${w}: cambio de alto no rehace el canvas`);
  ok(errs.length === 0, `${w}: sin errores ${errs.join(' | ')}`);
  // capturas al final (las capturas de Playwright cuentan como tareas largas): pie plano a mitad de apoyo
  await p.locator('.pisada-play').click(); await p.locator('button[data-pie="plano"]').click();
  await p.locator('input[type=range]').fill('55'); await p.waitForTimeout(500);
  await p.locator('.pisada-pant').screenshot({ path: path.join(raiz, `pruebas/pisada-${w}-plano.png`) });
  await p.locator('#pisada').screenshot({ path: path.join(raiz, `pruebas/pisada-${w}-entera.png`) });
  await ctx.close();
}
// movimiento reducido: sin botón de reproducir y sin bucle
const ctx = await nav.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: 'reduce' });
const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(500);
ok(await p.locator('.pisada-play').isHidden(), 'reducido: sin reproducir');
const raf = await p.evaluate(() => new Promise(res => { let n = 0; const o = window.requestAnimationFrame; window.requestAnimationFrame = f => { n++; return o(f); }; setTimeout(() => res(n), 800); }));
ok(raf === 0, `reducido: sin bucle (${raf} rAF)`);
ok(await p.evaluate(() => document.querySelector('.pisada-reparto output').textContent !== '0 %'), 'reducido: cifras finales');
await nav.close();
console.log(fallos ? `${fallos} fallos` : 'todo bien');
process.exit(fallos ? 1 : 0);
