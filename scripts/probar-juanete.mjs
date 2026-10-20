// Prueba del módulo «Planificar un juanete»: node scripts/probar-juanete.mjs
import { chromium } from 'file:///C:/Users/alvar/Desktop/WEBS%20NEGOCIOS/alvarotaiagu.github.io/node_modules/playwright/index.mjs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
const url = pathToFileURL(path.resolve('pruebas/demo-juanete.html')).href;
const nav = await chromium.launch();
let fallos = 0;
const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALLO ') + m); if (!c) fallos++; };
for (const [w, h] of [[1280, 900], [390, 844]]) {
  const p = await nav.newPage({ viewport: { width: w, height: h } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto(url); await p.waitForTimeout(600);
  const j = p.locator('#juanete');
  ok(await j.getAttribute('data-montado') === '1', `${w}: data-montado`);
  await j.scrollIntoViewIfNeeded(); await p.waitForTimeout(2600);
  ok(await p.locator('.juanete-hitos li').count() === 7, `${w}: siete hitos`);
  ok(await p.evaluate(() => document.documentElement.scrollWidth) === w, `${w}: sin scroll lateral`);
  const r = p.locator('.juanete input[type=range]');
  const hva0 = await p.locator('.juanete-hva').textContent();
  await r.focus(); for (let i = 0; i < 30; i++) await p.keyboard.press('ArrowRight');
  const hva1 = await p.locator('.juanete-hva').textContent(), gr1 = await p.locator('.juanete-grado').textContent();
  ok(hva0 !== hva1 && gr1 === 'grave', `${w}: teclado sube HVA ${hva0}→${hva1}, grado ${gr1}`);
  ok(/ángulo del juanete \d+ grados, grave/.test(await r.getAttribute('aria-valuetext')), `${w}: aria-valuetext`);
  await p.locator('.juanete-placa').screenshot({ path: `pruebas/juanete-${w}-grave.png` });
  await p.locator('.juanete-ops button', { hasText: 'Espolón' }).click(); await p.waitForTimeout(700);
  ok(await p.locator('.juanete-h.luz').count() === 1 && await p.locator('.juanete-extra .juanete-marca').count() > 0, `${w}: espolón resalta el calcáneo`);
  ok((await p.locator('.juanete-tit').textContent()).includes('Espolón'), `${w}: texto del espolón`);
  await j.screenshot({ path: `pruebas/juanete-${w}.png` });
  // arrastrar el dedo gordo hacia dentro reduce la desviación
  if (w === 1280) {
    await p.locator('.juanete-asa').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
    const asa = await p.locator('.juanete-asa').boundingBox();
    await p.mouse.move(asa.x + asa.width / 2, asa.y + asa.height / 2); await p.mouse.down();
    await p.mouse.move(asa.x - 60, asa.y - 80, { steps: 8 }); await p.mouse.up();
    ok(parseInt(await p.locator('.juanete-hva').textContent()) < parseInt(hva1), `${w}: arrastrar el dedo cambia HVA → ${await p.locator('.juanete-hva').textContent()}`);
  }
  ok(errs.length === 0, `${w}: sin errores ${errs.join(' | ')}`);
  await p.close();
}
// movimiento reducido: sin animaciones en marcha y la placa visible de entrada
const ctx = await nav.newContext({ reducedMotion: 'reduce', viewport: { width: 1280, height: 900 } });
const p = await ctx.newPage(); await p.goto(url); await p.waitForTimeout(400);
ok(await p.evaluate(() => getComputedStyle(document.querySelector('.juanete-svg')).clipPath) === 'none', 'reducido: placa sin recorte');
ok(await p.evaluate(() => document.getAnimations().length) === 0, 'reducido: ninguna animación');
await p.locator('.juanete-btn').click();
ok(parseInt(await p.locator('.juanete-hva').textContent()) <= 10, 'reducido: la corrección salta al final');
await nav.close();
console.log(fallos ? `${fallos} fallos` : 'todo bien'); process.exit(fallos ? 1 : 0);
