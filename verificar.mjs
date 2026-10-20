/* Verificación de la web de Clínica Podogal (Playwright, un solo navegador, ventanas pequeñas).
   Uso: node verificar.mjs   (puerto 8794). Sin capturas: lo que hay que mirar a ojo va en el README.
   Todas las pruebas con movimiento reducido salvo la de la cortina, que va una vez y al final. */
import { createRequire } from 'node:module';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const { chromium } = require('playwright');

const RAIZ = path.dirname(fileURLToPath(import.meta.url));
const PUERTO = 8794;
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif' };
const servidor = http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  const f = path.join(RAIZ, p);
  if (!f.startsWith(RAIZ) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('no'); return; }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
});
servidor.on('error', (e) => { console.error(`El puerto ${PUERTO} está ocupado (¿otra sesión?): ${e.message}`); process.exit(2); });
await new Promise((r) => servidor.listen(PUERTO, r));
const BASE = `http://localhost:${PUERTO}/`;

const fallos = [];
let nOk = 0;
const comprobar = (cond, m, detalle) => { if (cond) { nOk++; console.log('  ok     ' + m); } else { fallos.push(m); console.log('  FALLO  ' + m + (detalle !== undefined ? ' → ' + JSON.stringify(detalle) : '')); } };
const LLAVE = 'podogal-cookies';
const sinCookies = `try { localStorage.setItem('${LLAVE}', 'si'); } catch (e) {}`;

/* GSAP y Lenis desde una copia local: la cortina no depende del CDN ese día */
const CDN = {
  'gsap.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js',
  'ScrollTrigger.min.js': 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js',
  'lenis.min.js': 'https://cdn.jsdelivr.net/npm/@studio-freight/lenis@1.0.42/dist/lenis.min.js',
};
const CACHE = path.join(os.tmpdir(), 'neixon-cdn');
fs.mkdirSync(CACHE, { recursive: true });
for (const [n, u] of Object.entries(CDN)) {
  const f = path.join(CACHE, n);
  if (!fs.existsSync(f)) fs.writeFileSync(f, Buffer.from(await (await fetch(u)).arrayBuffer()));
}
const RE_CDN = /(gsap\.min|ScrollTrigger\.min|lenis\.min)\.js$/;
const local = (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: fs.readFileSync(path.join(CACHE, r.request().url().split('/').pop())) });

/* ================= 0. archivos (sin navegador) ================= */
console.log('\n0. Archivos');
for (const f of fs.readdirSync(RAIZ).filter((f) => f.endsWith('.html') && !f.endsWith('.src.html'))) {
  const s = fs.readFileSync(path.join(RAIZ, f), 'utf8');
  comprobar(/^<!DOCTYPE html>\s*<html lang="es">\s*<head>\s*<meta charset="utf-8">\s*<meta name="robots" content="noindex/.test(s), `${f}: charset lo primero y noindex justo detrás`);
  const ids = [...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const rep = ids.filter((x, i) => ids.indexOf(x) !== i);
  comprobar(rep.length === 0, `${f}: ningún id repetido`, [...new Set(rep)]);
}
comprobar(['.nojekyll', '404.html', 'manifest.json', 'img/og.jpg', 'marca/favicon.svg', 'marca/favicon-32.png', 'marca/apple-touch-icon.png', 'marca/icono-512.png', 'marca/o-naranja.svg'].every((f) => fs.existsSync(path.join(RAIZ, f))), '.nojekyll, 404, manifest, og:image y favicons');
const html = fs.readFileSync(path.join(RAIZ, 'index.html'), 'utf8');
{
  const rutas = new Set();
  for (const m of html.matchAll(/(src|srcset|href|imagesrcset)="([^"]+)"/g)) for (const parte of (/srcset/.test(m[1]) ? m[2].split(',') : [m[2]])) {
    const r = parte.trim().split(/\s+/)[0].split('?')[0];
    if (r && !/^(https?:|mailto:|tel:|#|data:)/.test(r)) rutas.add(r);
  }
  const faltan = [...rutas].filter((r) => !fs.existsSync(path.join(RAIZ, r)));
  comprobar(faltan.length === 0, `index.html: existen los ${rutas.size} archivos que enlaza`, faltan);
  comprobar(/rel="preload" as="image"[^>]*portada-recepcion-800\.avif/.test(html.replace(/\n\s*/g, ' ')), 'la foto de la portada va precargada');
  comprobar(/<script src="js\/pisada\.js[^"]*" defer><\/script>\s*<script src="js\/juanete\.js[^"]*" defer><\/script>\s*<script src="js\/main\.js/.test(html), 'pisada.js y juanete.js se cargan con defer antes de main.js');
  const texto = html.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ');
  comprobar(!/\b(1|una)( sola| única)? reseña/i.test(texto), 'sin «una reseña»');
  comprobar(!/clientes satisfechos|cientos de|miles de|los mejores podólogos|el mejor|sin dolor garantizado|100 ?% indoloro|sin permanencia|gratis/i.test(texto), 'sin prueba social inventada, superlativos ni promesas sanitarias');
  comprobar(/C-32-000323/.test(texto), 'el registro sanitario va en la página');
  comprobar(/4,8/.test(texto) && /147 reseñas/.test(texto), 'la nota real: 4,8 con 147 reseñas');
  comprobar(!/WhatsApp/i.test(texto), 'no promete WhatsApp (por confirmar)');
  comprobar(!/Roberto|Martínez Tejero/.test(texto), 'no nombra a quien no sabemos si sigue (Roberto)');
  comprobar([...html.matchAll(/<img\b[^>]*>/g)].every((m) => /\salt="/.test(m[0])), 'todas las imágenes llevan alt');
  comprobar((() => { try { JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]); return true; } catch (e) { return false; } })(), 'el JSON-LD se lee');
  const lista = fs.readFileSync(path.join(RAIZ, 'scripts/fotos-lista.json'), 'utf8');
  comprobar(!/slider4|Protesis|Periodoncia|Endodoncia|Odonto|All-ON|dental|teeth|tooth|smile/i.test(lista), 'ninguna foto dental de la etapa anterior');
}
const css = fs.readFileSync(path.join(RAIZ, 'css/estilos.css'), 'utf8');
comprobar(/\.cookies:not\(\[hidden\]\)\s*\{[^}]*display:\s*flex/.test(css) && !/\.cookies\s*\{[^}]*display:/.test(css), 'cookies: display solo en :not([hidden])');
comprobar(/\.mando:not\(\[hidden\]\)/.test(css) && !/\.mando\s*\{[^}]*display:/.test(css), 'mando: display solo en :not([hidden])');
comprobar(/\.menu-movil\s*\{[^}]*height:\s*100dvh/.test(css) && !/\.menu-movil\s*\{[^}]*inset:\s*0/.test(css), 'menú móvil: altura 100dvh, nunca inset:0 (la cabecera lleva backdrop-filter)');
comprobar(!/\ddvh/.test(css.replace(/\.menu-movil\s*\{[^}]*\}/, '')), 'fuera del menú fijo, ningún dvh (la barra del móvil no mueve nada)');
const mainJs = fs.readFileSync(path.join(RAIZ, 'js/main.js'), 'utf8');
comprobar(/const motion = hayGSAP && !quieto;\s*if \(motion\) raiz\.classList\.add\('con-movimiento'\)/.test(mainJs), '«con-movimiento» solo con GSAP y sin movimiento reducido');
comprobar(/if \(esBarra\(\)\) return;/.test(mainJs) && !/addEventListener\('resize'[^;]*innerHeight/.test(mainJs), 'el resize de la barra del móvil no rehace nada');
comprobar(/gsap\.ticker\.lagSmoothing\(0\)/.test(mainJs.slice(mainJs.indexOf('function retirarCortina'), mainJs.indexOf('function abrirHero'))), 'lagSmoothing(0) solo al retirar la cortina');

/* ================= navegador: uno solo ================= */
const browser = await chromium.launch({ headless: true });
try {
  async function nueva(op = {}, { cdn = 'local', script, abortar } = {}) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 1, reducedMotion: 'reduce', ...op });
    if (cdn === 'local') await ctx.route(RE_CDN, local);
    if (cdn === 'caido') await ctx.route(RE_CDN, (r) => r.abort());
    await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.fulfill({ status: 200, contentType: 'text/css', body: '' }));
    await ctx.route(/google\.com\/maps/, (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<p>mapa</p>' }));
    if (abortar) await ctx.route(abortar, (r) => r.abort());
    if (script) await ctx.addInitScript(script);
    const page = await ctx.newPage();
    page._errores = [];
    page.on('pageerror', (e) => page._errores.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/ERR_FAILED|net::/.test(m.text())) page._errores.push('consola: ' + m.text()); });
    page.on('response', (r) => { if (r.status() >= 400) page._errores.push(r.status() + ' ' + r.url()); });
    return { ctx, page };
  }
  const fuera = (page) => page.waitForFunction(() => document.documentElement.classList.contains('cortina-fuera'), null, { timeout: 12000 });

  /* ---------- 1. escritorio, movimiento reducido ---------- */
  console.log('\n1. Escritorio (movimiento reducido)');
  {
    const { ctx, page } = await nueva({}, { script: sinCookies });
    await page.goto(BASE + 'index.html');
    await fuera(page);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none'), 'con movimiento reducido la cortina no se ve');
    comprobar(await page.evaluate(() => !document.documentElement.classList.contains('con-movimiento')), 'con movimiento reducido no hay «con-movimiento»');
    comprobar(await page.evaluate(() => { const h = document.getElementById('hero-tit'); const r = h.getBoundingClientRect(); return r.height > 40 && getComputedStyle(h).opacity === '1' && getComputedStyle(document.querySelector('.ojo')).opacity === '1'; }), 'titular y O de la portada visibles');
    comprobar(await page.evaluate(() => getComputedStyle(document.body).cursor !== 'none' && !document.querySelector('.cursor, [class*="cursor-"]')), 'sin cursor propio: el del sistema se ve (nunca dos cursores)');
    comprobar(await page.evaluate(() => { const i = document.querySelector('.ojo__iris img'); return i.complete && i.naturalWidth > 0; }), 'la foto de la portada carga dentro de la O');
    comprobar(await page.evaluate(() => document.querySelectorAll('[data-ahora]')[0].textContent.length > 5), 'abierto/cerrado ahora pintado con su horario');
    // horario: 6 filas visibles y la de hoy marcada (una clase de estado no puede esconder una fila)
    const hor = await page.evaluate(() => { const trs = [...document.querySelectorAll('.horario tr')]; return { vis: trs.filter((t) => t.getBoundingClientRect().height > 0).length, hoy: trs.filter((t) => t.classList.contains('es-hoy')).length }; });
    comprobar(hor.vis === 6 && hor.hoy === 1, 'horario: 6 filas visibles y hoy marcado', hor);
    // módulos
    comprobar(await page.evaluate(() => document.querySelectorAll('[data-modulo][data-montado="1"]').length === 0), 'los módulos no se montan al arrancar (sin tarea larga)');
    for (const m of ['pisada', 'juanete']) await page.locator(`[data-modulo="${m}"]`).scrollIntoViewIfNeeded();
    comprobar(await page.waitForFunction(() => document.querySelectorAll('[data-modulo][data-montado="1"]').length === 2, null, { timeout: 5000 }).then(() => true, () => false), 'los dos módulos (pisada y juanete) montan al acercarse');
    await page.evaluate(() => scrollTo(0, 0));
    // pasillo: seis puertas visibles; cada franja abre su puerta y solo esa
    let bien = true;
    for (let i = 0; i < 6; i++) {
      await page.locator('.puerta__franja').nth(i).click();
      const r = await page.evaluate((i) => { const ps = [...document.querySelectorAll('.puerta')]; return { abiertas: ps.filter((p) => p.classList.contains('abierta')).length, esta: ps[i].classList.contains('abierta'), exp: ps[i].querySelector('.puerta__franja').getAttribute('aria-expanded'), visibles: ps.filter((p) => p.getBoundingClientRect().width > 20).length }; }, i);
      if (!(r.abiertas === 1 && r.esta && r.exp === 'true' && r.visibles === 6)) { bien = false; console.log('     puerta', i, r); }
    }
    comprobar(bien, 'pasillo: cada franja abre su puerta, solo una abierta y las seis a la vista');
    await page.locator('.puerta__franja').nth(5).focus();
    await page.keyboard.press('ArrowRight');
    comprobar(await page.evaluate(() => document.querySelectorAll('.puerta')[0].classList.contains('abierta') && document.activeElement === document.querySelectorAll('.puerta__franja')[0]), 'pasillo: las flechas pasan de puerta (y dan la vuelta)');
    // «Pedir estudio de la pisada» llega al motor con su consulta elegida
    await page.locator('.puerta__franja').nth(1).click();
    await page.locator('.puerta[data-k="biomecanica"] [data-motivo="pisada"]').click();
    await page.waitForFunction(() => document.querySelector('.motivo[data-k="pisada"]')?.getAttribute('aria-checked') === 'true', null, { timeout: 4000 }).catch(() => {});
    comprobar(await page.evaluate(() => document.querySelector('.motivo[data-k="pisada"]').getAttribute('aria-checked') === 'true' && !document.querySelector('.motor__vista[data-vista="2"]').hidden), 'el botón de una puerta llega a la cita con la consulta elegida');
    // cita completa
    const cal = await page.evaluate(() => {
      const H = window.HORARIO, bs = [...document.querySelectorAll('#cal button[data-iso]')];
      const finde = bs.filter((b) => { const d = new Date(b.dataset.iso); return d.getDay() === 0 || d.getDay() === 6; });
      return { findeCerrado: finde.every((b) => b.disabled), san: H.tramos(new Date(2026, 10, 11)) === null, alguno: bs.some((b) => !b.disabled) };
    });
    comprobar(cal.findeCerrado && cal.san && cal.alguno, 'calendario: fines de semana y San Martiño cerrados, días con huecos', cal);
    if (await page.evaluate(() => ![...document.querySelectorAll('#cal button[data-iso]')].some((b) => !b.disabled))) await page.locator('#cal-sig').click();
    await page.locator('#cal button[data-iso]:not([disabled])').first().click();
    const horas = await page.evaluate(() => {
      const d = new Date(document.querySelector('#cal .es-elegido').dataset.iso + 'T12:00'), tr = window.HORARIO.tramos(d), min = window.__cita.estado.motivo.min;
      return [...document.querySelectorAll('#horas button')].map((b) => { const [h, m] = b.textContent.split(':').map(Number); const t = h * 60 + m; return tr.some(([a, z]) => t >= a && t + min <= z); });
    });
    comprobar(horas.length > 0 && horas.every(Boolean), 'las horas caben dentro del horario de ese día', horas.length);
    await page.locator('#horas button').first().click();
    await page.locator('#datos button[type="submit"]').click();
    comprobar((await page.textContent('#datos-error')).includes('Falta'), 'la cita valida los datos');
    await page.fill('#datos [name="nombre"]', 'Ana Prueba');
    await page.fill('#datos [name="tel"]', '600 11 22 33');
    await page.check('#datos [name="priv"]');
    await page.locator('#datos button[type="submit"]').click();
    comprobar(/^PG-/.test(await page.textContent('#hecho-codigo')) && /demostración/.test(await page.textContent('#hecho-texto')), 'la cita termina con código y dice que es una demostración');
    // mapa solo al pedirlo
    comprobar(await page.evaluate(() => !document.querySelector('#mapa iframe')), 'el mapa de Google no se carga solo');
    await page.locator('#mapa-btn').click();
    comprobar(await page.evaluate(() => /google\.com\/maps/.test(document.querySelector('#mapa iframe')?.src || '')), 'el mapa se carga al pulsar');
    // mando oculto sin ?revision
    comprobar(await page.evaluate(() => { const m = document.getElementById('mando'); return m.hidden && getComputedStyle(m).display === 'none'; }), 'sin ?revision el mando no se ve');
    // contraste de las parejas de texto
    const contrastes = await page.evaluate(() => {
      // cualquier color CSS (también color-mix u oklab) pasa por un lienzo de 1 px para leerlo en sRGB
      const lz = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const rgb = (c) => { lz.clearRect(0, 0, 1, 1); lz.fillStyle = '#000'; lz.fillStyle = c; lz.fillRect(0, 0, 1, 1); return [...lz.getImageData(0, 0, 1, 1).data].slice(0, 3); };
      const L = (c) => { const m = rgb(c).map((v) => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }); return .2126 * m[0] + .7152 * m[1] + .0722 * m[2]; };
      const fondo = (el) => { while (el) { const b = getComputedStyle(el).backgroundColor; if (b && !/rgba\(0, 0, 0, 0\)|transparent/.test(b) && !/[, /] ?0\)$/.test(b)) return b; el = el.parentElement; } return 'rgb(246, 243, 238)'; };
      const sel = ['.eyebrow', '.hero__bajada', '.sec-cab__txt', '.lista-o li', '.persona__cargo', '.persona__form li', '.nota', '.qx .sec-cab__txt', '.cita .sec-cab__txt', '.motivo span', '.cal .dia-sem', '.pie__cols p', '.pie__tit', '.pie__legal', '.mutuas p', '.hito-prensa p:not(.eyebrow)', '.llegar__tels span', '.puerta__nom', '.puerta__num', '.btn--naranja', '.motor__demo'];
      return sel.map((s) => { const el = document.querySelector(s); if (!el) return [s, 0]; const a = L(getComputedStyle(el).color), b = L(fondo(el)); return [s, Math.round(((Math.max(a, b) + .05) / (Math.min(a, b) + .05)) * 100) / 100]; });
    });
    const malos = contrastes.filter(([, c]) => c < 4.5);
    comprobar(malos.length === 0, `contraste ≥ 4,5:1 en ${contrastes.length} parejas de texto`, malos);
    comprobar(page._errores.length === 0, 'sin errores de consola ni 404', page._errores.slice(0, 5));
    await ctx.close();
  }

  /* ---------- 2. módulos caídos: se queda el respaldo ---------- */
  console.log('\n2. Sin los módulos');
  {
    const { ctx, page } = await nueva({}, { script: sinCookies, abortar: /js\/(pisada|juanete)\.js/ });
    await page.goto(BASE + 'index.html');
    await fuera(page);
    const r = await page.evaluate(() => [...document.querySelectorAll('[data-modulo]')].map((el) => ({ montado: el.dataset.montado, respaldo: !!el.querySelector('.modulo__respaldo img') && el.querySelector('.modulo__respaldo').getBoundingClientRect().height > 100 })));
    comprobar(r.every((x) => !x.montado && x.respaldo), 'sin pisada.js ni juanete.js queda el respaldo con su foto', r);
    comprobar(page._errores.filter((e) => !/pisada|juanete/.test(e)).length === 0, 'y la página no da errores', page._errores);
    await ctx.close();
  }

  /* ---------- 3. CDN caído: la cortina se va y todo se ve ---------- */
  console.log('\n3. CDN caído');
  {
    const { ctx, page } = await nueva({ reducedMotion: 'no-preference' }, { cdn: 'caido', script: sinCookies });
    await page.goto(BASE + 'index.html');
    await fuera(page);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none' && !document.documentElement.classList.contains('con-movimiento')), 'sin GSAP la cortina se retira y no hay «con-movimiento»');
    comprobar(await page.evaluate(() => { const r = document.getElementById('hero-tit').getBoundingClientRect(); return r.height > 40 && getComputedStyle(document.querySelector('.hero__lema')).opacity === '1'; }), 'sin GSAP el titular se ve');
    await ctx.close();
  }

  /* ---------- 4. cookies en cuatro pasos y mando con ?revision ---------- */
  console.log('\n4. Cookies y mando');
  {
    const { ctx, page } = await nueva();
    await page.goto(BASE + 'index.html');
    await fuera(page);
    await page.waitForSelector('#cookies:not([hidden])', { timeout: 4000 }).catch(() => {});
    comprobar(await page.isVisible('#cookies'), 'cookies: se ven en la primera visita');
    await page.click('#ck-si');
    comprobar(!(await page.isVisible('#cookies')) && (await page.evaluate((k) => localStorage.getItem(k), LLAVE)) === 'si', 'cookies: «Entendido» las cierra y guarda la marca');
    await page.reload(); await fuera(page);
    comprobar(!(await page.isVisible('#cookies')), 'cookies: al recargar no vuelven');
    await page.evaluate((k) => localStorage.removeItem(k), LLAVE);
    await page.reload(); await fuera(page);
    await page.waitForSelector('#cookies:not([hidden])', { timeout: 4000 }).catch(() => {});
    comprobar(await page.isVisible('#cookies'), 'cookies: sin la marca vuelven a salir');
    await page.click('#ck-no');
    await page.goto(BASE + 'index.html?revision&densidad=sobria'); await fuera(page);
    comprobar(await page.evaluate(() => !document.getElementById('mando').hidden && document.documentElement.classList.contains('densidad-sobria') && getComputedStyle(document.getElementById('vistazo')).display === 'block'), 'con ?revision el mando se ve y la sobria añade «de un vistazo»');
    await page.click('#mando [data-densidad="cargada"]');
    comprobar(await page.evaluate(() => !document.documentElement.classList.contains('densidad-sobria') && getComputedStyle(document.getElementById('vistazo')).display === 'none' && !location.search.includes('sobria')), 'el mando vuelve a «La O»');
    await ctx.close();
  }

  /* ---------- 5. móvil: anchos, portada sin solapes, menú y barra del navegador ---------- */
  console.log('\n5. Móvil');
  for (const [w, h] of [[360, 640], [375, 667], [390, 844], [768, 1024]]) {
    const { ctx, page } = await nueva({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true }, { script: sinCookies });
    await page.goto(BASE + 'index.html');
    await fuera(page);
    const r = await page.evaluate(() => {
      const o = document.querySelector('.ojo').getBoundingClientRect(), t = document.querySelector('.hero__ant').getBoundingClientRect(), c = document.getElementById('cab').getBoundingClientRect();
      return { ancho: document.documentElement.scrollWidth, vista: innerWidth, ojoTexto: o.bottom <= t.top + 1, ojoCab: o.top >= c.bottom - 30 };
    });
    comprobar(r.ancho <= r.vista, `${w}×${h}: sin scroll lateral`, r);
    comprobar(r.ojoTexto && r.ojoCab, `${w}×${h}: la O no pisa el texto ni la cabecera`, r);
    if (w === 390) {
      await page.evaluate(() => scrollTo(0, 900));
      await page.waitForFunction(() => document.getElementById('cab').classList.contains('sc'));
      await page.click('#menu-btn');
      const m = await page.evaluate(() => { const r = document.getElementById('menu-movil').getBoundingClientRect(); return { top: r.top, alto: r.height, vista: innerHeight, vis: getComputedStyle(document.getElementById('menu-movil')).visibility }; });
      comprobar(m.top === 0 && Math.abs(m.alto - m.vista) < 2 && m.vis === 'visible', 'menú móvil a pantalla completa con la cabecera ya fija', m);
      await page.click('#menu-movil a[href="#equipo"]');
      await page.waitForFunction(() => !document.body.classList.contains('menu'));
      comprobar(true, 'el menú se cierra al elegir');
      // pasillo en vertical: abrir una puerta en el móvil
      await page.locator('.puerta__franja').nth(2).tap();
      await page.waitForFunction(() => document.querySelectorAll('.puerta')[2].querySelector('.puerta__dentro').getBoundingClientRect().height > 200, null, { timeout: 3000 }).catch(() => {});
      comprobar(await page.evaluate(() => document.querySelectorAll('.puerta')[2].querySelector('.puerta__dentro').getBoundingClientRect().height > 200), 'pasillo en el móvil: la puerta se abre hacia abajo');
      // la barra del navegador: 6 cambios de alto → 0 refresh y nada se mueve
      await page.addStyleTag({ content: '.hero{min-height:844px!important}' });
      const n = await page.evaluate(() => { window.__ref = 0; window.ScrollTrigger && ScrollTrigger.addEventListener('refresh', () => window.__ref++); return document.getElementById('cita').getBoundingClientRect().top + scrollY; });
      for (const alto of [788, 844, 788, 844, 800, 844]) { await page.setViewportSize({ width: 390, height: alto }); await page.waitForTimeout(260); }
      const d = await page.evaluate(() => ({ ref: window.__ref, top: document.getElementById('cita').getBoundingClientRect().top + scrollY }));
      comprobar(d.ref === 0 && Math.abs(d.top - n) < 1, 'barra del móvil: 0 refresh y la página no se mueve', { ...d, antes: n });
    }
    comprobar(page._errores.length === 0, `${w}×${h}: sin errores`, page._errores.slice(0, 3));
    await ctx.close();
  }

  /* ---------- 6. legales ---------- */
  console.log('\n6. Legales');
  {
    const { ctx, page } = await nueva();
    for (const f of ['aviso-legal', 'privacidad', 'cookies', 'accesibilidad', '404']) {
      await page.goto(BASE + f + '.html');
      comprobar((await page.locator('h1').count()) === 1 && page._errores.length === 0, `${f}.html se abre sin errores`, page._errores);
    }
    await ctx.close();
  }

  /* ---------- 7. la cortina con movimiento (una sola vez, al final) ---------- */
  console.log('\n7. Cortina con movimiento');
  {
    const { ctx, page } = await nueva({ reducedMotion: 'no-preference' }, { script: sinCookies });
    await page.goto(BASE + 'index.html');
    comprobar(await page.evaluate(() => { const c = document.getElementById('cortina'); const r = c.getBoundingClientRect(); return getComputedStyle(c).display !== 'none' && r.width === innerWidth && r.height === innerHeight; }), 'la cortina tapa la pantalla al cargar');
    await page.waitForFunction(() => parseFloat(getComputedStyle(document.querySelector('.cortina__aro')).getPropertyValue('--barrido')) > 90, null, { timeout: 5000 });
    const medio = await page.evaluate(() => ({ barrido: parseFloat(getComputedStyle(document.querySelector('.cortina__aro')).getPropertyValue('--barrido')), punto: new DOMMatrix(getComputedStyle(document.querySelector('.cortina__punto')).transform).a }));
    comprobar(medio.barrido > 90 && medio.barrido < 360 && medio.punto > .5, 'a medias: el punto encendido y el aro dibujándose', medio);
    await page.waitForFunction(() => parseFloat(getComputedStyle(document.getElementById('cortina')).getPropertyValue('--iris')) > 60, null, { timeout: 6000 });
    comprobar(await page.evaluate(() => document.getElementById('hero').classList.contains('abierta')), 'el iris se abre y la portada entra a la vez');
    await fuera(page);
    comprobar(await page.evaluate(() => getComputedStyle(document.getElementById('cortina')).display === 'none' && document.documentElement.classList.contains('con-movimiento')), 'la cortina se retira de verdad');
    comprobar(await page.evaluate(() => { const i = document.querySelector('.cortina__pal--izq > span'); return Math.abs(new DOMMatrix(getComputedStyle(i).transform).m41) < 1; }), 'POD y GAL acaban en su sitio (sin restos de translate)');
    // el ojo mira al cursor
    const g0 = await page.evaluate(() => window.__podogal.ojo.giro);
    await page.mouse.move(1270, 790);
    await page.waitForFunction((g0) => Math.abs(window.__podogal.ojo.giro - g0) > 20, g0, { timeout: 3000 }).catch(() => {});
    comprobar(Math.abs((await page.evaluate(() => window.__podogal.ojo.giro)) - g0) > 20, 'el lado grueso de la O gira hacia el cursor');
    comprobar(page._errores.length === 0, 'sin errores con movimiento', page._errores.slice(0, 5));
    await ctx.close();
  }
} finally {
  await browser.close();
  servidor.close();
}

console.log(`\n${nOk} ok, ${fallos.length} fallos`);
if (fallos.length) { console.log(fallos.map((f) => ' - ' + f).join('\n')); process.exitCode = 1; }
