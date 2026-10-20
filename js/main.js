/* ------------------------------------------------------------------
   Clínica Podogal · Ourense · «La O»
   ------------------------------------------------------------------ */
(function () {
  'use strict';

  const raiz = document.documentElement;
  const hayGSAP = typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined';
  const quieto = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fino = matchMedia('(pointer: fine)').matches;
  // «con-movimiento» SOLO con GSAP y sin movimiento reducido: si no, los titulares partidos se quedarían escondidos
  const motion = hayGSAP && !quieto;
  if (motion) raiz.classList.add('con-movimiento');
  if (hayGSAP) {
    gsap.registerPlugin(ScrollTrigger);
    // el resize lo gestionamos nosotros (la barra del móvil no rehace nada)
    ScrollTrigger.config({ autoRefreshEvents: 'visibilitychange,DOMContentLoaded,load', ignoreMobileResize: true });
  }
  const sobria = () => raiz.classList.contains('densidad-sobria');

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const f = (n) => Math.round(n * 1000) / 1000;
  const anno = $('#anno');
  if (anno) anno.textContent = new Date().getFullYear();

  // el resize de la barra del móvil (mismo ancho, poca altura) no rehace NADA
  let anchoVista = innerWidth, altoVista = innerHeight;
  const esBarra = () => innerWidth === anchoVista && Math.abs(innerHeight - altoVista) < 160;

  /* ============ 1. titulares partidos, entradas y fotos en iris ============ */
  function partir(h) {
    if (h.classList.contains('es-partido')) return;
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    let n = 0;
    const envolver = (nodo) => {
      if (nodo.nodeType === 3) {
        const frag = document.createDocumentFragment();
        nodo.textContent.split(/([ \t\r\n]+)/).forEach((t) => {
          if (!t.trim()) { frag.appendChild(document.createTextNode(t)); return; }
          const pal = document.createElement('span');
          pal.className = 'pal';
          pal.setAttribute('aria-hidden', 'true');
          const i = document.createElement('i');
          i.textContent = t;
          i.style.setProperty('--n', n++);
          pal.appendChild(i);
          frag.appendChild(pal);
        });
        nodo.replaceWith(frag);
      } else if (nodo.nodeType === 1) Array.from(nodo.childNodes).forEach(envolver);
    };
    Array.from(h.childNodes).forEach(envolver);
    h.classList.add('es-partido');
  }
  const vistos = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('es-visto'); vistos.unobserve(e.target); }
  }), { rootMargin: '0px 0px -10% 0px' });
  if (motion) {
    $$('[data-partir]').forEach((h) => { partir(h); if (!h.closest('.hero')) vistos.observe(h); });
    $$('[data-revela]').forEach((el, i) => { el.style.setProperty('--d', i % 3); vistos.observe(el); });
  }
  // las fotos se abren en iris desde el centro, como la O al final de la cortina
  const iris = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('es-abierta'); iris.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  const vigilarIris = (raizBusca) => $$('.iris-foto', raizBusca).forEach((el) => (motion ? iris.observe(el) : el.classList.add('es-abierta')));
  vigilarIris();

  /* ============ 2. Lenis ============ */
  let lenis = null;
  if (typeof Lenis !== 'undefined' && !quieto) {
    lenis = new Lenis({ duration: 1.05, smoothWheel: true, lerp: 0.12 });
    if (hayGSAP) { lenis.on('scroll', ScrollTrigger.update); gsap.ticker.add((t) => lenis.raf(t * 1000)); }
    else { const bucle = (t) => { lenis.raf(t); requestAnimationFrame(bucle); }; requestAnimationFrame(bucle); }
  }
  const irA = (sel) => {
    const el = typeof sel === 'string' ? $(sel) : sel;
    if (!el) return;
    const y = el.getBoundingClientRect().top + scrollY - 80;
    if (lenis) lenis.scrollTo(y, { duration: 1.1 });
    else scrollTo({ top: y, behavior: quieto ? 'auto' : 'smooth' });
  };

  /* ============ 3. abierto ahora (dato real: su horario de septiembre) ============ */
  function pintarAhora() {
    if (!window.HORARIO) return;
    const e = HORARIO.estado(new Date());
    $$('[data-ahora]').forEach((el) => { el.textContent = e.texto; });
    $$('[data-ahora-punto]').forEach((el) => el.classList.toggle('abierto', e.abierto));
    const hoy = new Date().getDay();
    $$('.horario tr').forEach((tr) => tr.classList.toggle('es-hoy', +tr.dataset.dia === hoy || (tr.dataset.dia === '6' && (hoy === 6 || hoy === 0))));
  }
  pintarAhora();
  setInterval(pintarAhora, 60000);

  /* ============ 4. la O que mira: el lado grueso del aro sigue al cursor ============ */
  const ojo = (function () {
    const fig = $('#ojo'), giro = $('.ojo__giro', fig), punto = $('.ojo__punto', fig), img = $('.ojo__iris img', fig);
    let g = 0, meta = 0, raf = 0, mx = 0, my = 0, tmx = 0, tmy = 0;
    const paso = () => {
      g += (meta - g) * 0.08; mx += (tmx - mx) * 0.1; my += (tmy - my) * 0.1;
      giro.style.setProperty('--giro', f(g) + 'deg');
      punto.style.setProperty('--mx', f(mx) + 'px'); punto.style.setProperty('--my', f(my) + 'px');
      img.style.setProperty('--px', f(-mx * 0.8) + 'px'); img.style.setProperty('--py', f(-my * 0.8) + 'px');
      raf = Math.abs(meta - g) > 0.05 || Math.abs(tmx - mx) > 0.05 || Math.abs(tmy - my) > 0.05 ? requestAnimationFrame(paso) : 0;
    };
    const mirar = (x, y) => {
      if (!motion || sobria()) return;
      const r = giro.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2), dy = y - (r.top + r.height / 2), d = Math.hypot(dx, dy) || 1;
      // por defecto el lado grueso está a la izquierda (180º): giro = ángulo del cursor − 180º, por el camino corto
      const a = Math.atan2(dy, dx) * 180 / Math.PI - 180;
      meta = a + 360 * Math.round((g - a) / 360);
      const k = Math.min(1, d / r.width) * r.width * 0.05;
      tmx = dx / d * k; tmy = dy / d * k;
      if (!raf) raf = requestAnimationFrame(paso);
    };
    if (fino) addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && scrollY < innerHeight * 1.2) mirar(e.clientX, e.clientY); }, { passive: true });
    const reposo = () => { meta = 360 * Math.round(g / 360); tmx = tmy = 0; if (!raf) raf = requestAnimationFrame(paso); };
    document.addEventListener('pointerleave', reposo);
    return { mirar, reposo, get giro() { return g; } };
  })();

  /* ============ 5. especialidades: el pasillo de puertas ============ */
  const pasillo = (function () {
    const puertas = $$('.puerta'), franjas = puertas.map((p) => $('.puerta__franja', p));
    let abierta = -1;
    puertas.forEach((p) => $$('.puerta__txt > *', p).forEach((el, k) => el.style.setProperty('--k', k)));
    const abrir = (i) => {
      if (i === abierta) return;
      abierta = i;
      puertas.forEach((p, k) => {
        const si = k === i;
        p.classList.toggle('abierta', si);
        franjas[k].setAttribute('aria-expanded', String(si));
        $$('a, button:not(.puerta__franja)', $('.puerta__dentro', p)).forEach((a) => { a.tabIndex = si ? 0 : -1; });
      });
    };
    // apiladas (móvil): al cerrarse la puerta de arriba todo sube; la franja pulsada se queda quieta bajo el dedo
    const apiladas = matchMedia('(max-width: 899px)');
    const anclar = (el) => {
      const y0 = el.getBoundingClientRect().top, fin = performance.now() + 750;
      const paso = () => {
        const d = el.getBoundingClientRect().top - y0;
        if (Math.abs(d) > 0.5) { if (lenis) lenis.scrollTo(scrollY + d, { immediate: true }); else scrollBy(0, d); }
        if (performance.now() < fin) requestAnimationFrame(paso);
      };
      requestAnimationFrame(paso);
    };
    franjas.forEach((b, i) => b.addEventListener('click', () => { if (apiladas.matches && i !== abierta) anclar(b); abrir(i); }));
    $('#pasillo').addEventListener('keydown', (e) => {
      const k = franjas.indexOf(document.activeElement);
      if (k < 0) return;
      const sig = { ArrowRight: k + 1, ArrowDown: k + 1, ArrowLeft: k - 1, ArrowUp: k - 1, Home: 0, End: franjas.length - 1 }[e.key];
      if (sig === undefined) return;
      e.preventDefault();
      const j = (sig + franjas.length) % franjas.length;
      franjas[j].focus();
      abrir(j);
    });
    abrir(0);
    return { abrir, get abierta() { return abierta; } };
  })();
  // los botones «Pedir cita de…» llevan su consulta ya elegida al motor
  $$('[data-motivo]').forEach((a) => a.addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('podogal:motivo', { detail: a.dataset.motivo }));
  }));

  /* ============ 6. módulos: «Pisa aquí» y «Planificar un juanete» (cada uno en su archivo) ============ */
  // se montan al acercarse a la pantalla: montarlos al arrancar dejaba una tarea larga de ~330 ms
  const montarModulo = (el) => {
    try { window.Podogal?.[el.dataset.modulo]?.montar(el, { movimiento: motion }); }
    catch (er) { console.warn('Módulo ' + el.dataset.modulo + ': se queda el respaldo', er); }
    // si no montó, el respaldo es lo que se ve: sus fotos también se abren en iris
    if (el.dataset.montado !== '1') vigilarIris(el);
    else if (hayGSAP) ScrollTrigger.refresh();   // el módulo cambia el alto de su sección
  };
  if ('IntersectionObserver' in window) {
    const ioMod = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { ioMod.unobserve(e.target); montarModulo(e.target); }
    }), { rootMargin: '900px 0px' });
    $$('[data-modulo]').forEach((el) => ioMod.observe(el));
  } else $$('[data-modulo]').forEach(montarModulo);

  /* ============ 7. cortina: el punto, el aro que se dibuja y el iris que se abre ============ */
  const cortina = $('#cortina');
  const hero = $('#hero');
  function retirarCortina() {
    clearTimeout(window.__redCortina);
    if (cortina) cortina.hidden = true;
    raiz.classList.remove('cortina-activa');
    raiz.classList.add('cortina-fuera');
    if (lenis) lenis.start();
    if (hayGSAP) { gsap.ticker.lagSmoothing(0); ScrollTrigger.refresh(); }
    mostrarCookies();
  }
  function abrirHero() {
    hero.classList.add('abierta');
    $$('.hero__txt > *').forEach((el, i) => el.style.setProperty('--i', i));
    const h = $('.hero [data-partir]');
    if (h && motion) h.classList.add('es-visto');
  }
  function lanzarCortina() {
    // sin GSAP, con movimiento reducido o si el CDN tardó (> 2,5 s): fuera sin animar
    if (!cortina || !motion || performance.now() > 2500) { retirarCortina(); abrirHero(); return; }
    raiz.classList.add('cortina-activa');
    if (lenis) lenis.stop();
    const q = (s) => $(s, cortina);
    const punto = q('.cortina__punto'), aro = q('.cortina__aro'), izq = q('.cortina__pal--izq > span'), der = q('.cortina__pal--der > span');
    const raya = q('.cortina__raya'), cli = q('.cortina__clinica'), logo = q('.cortina__logo'), oC = q('.cortina__o');
    const tl = gsap.timeline({ onComplete: retirarCortina });
    // 1. se enciende el punto
    tl.fromTo(punto, { scale: 0 }, { scale: 1, duration: 0.6, ease: 'back.out(3)' }, 0.2);
    // 2. el aro se dibuja girando a su alrededor (grueso a un lado, fino al otro)
    tl.fromTo(aro, { '--barrido': '0deg', rotation: -240 }, { '--barrido': '360deg', rotation: 0, duration: 1.05, ease: 'power2.inOut' }, 0.5);
    // 3. POD y GAL salen de detrás de la O; CLÍNICA abre su espaciado
    tl.fromTo(izq, { x: 0, xPercent: 105 }, { x: 0, xPercent: 0, duration: 0.85, ease: 'expo.out' }, 1.2);
    tl.fromTo(der, { x: 0, xPercent: -105 }, { x: 0, xPercent: 0, duration: 0.85, ease: 'expo.out' }, 1.2);
    tl.fromTo(raya, { scaleX: 0 }, { scaleX: 1, duration: 0.95, ease: 'expo.out' }, 1.25);
    tl.fromTo(cli, { opacity: 0, letterSpacing: '.2em', marginRight: '-.2em' }, { opacity: 1, letterSpacing: '1.5em', marginRight: '-1.5em', duration: 1, ease: 'expo.out' }, 1.32);
    // 4. iris: el hueco de la O crece hasta descubrir la portada; el logo crece con él y se desvanece
    tl.add(() => {
      const ro = oC.getBoundingClientRect(), rl = logo.getBoundingClientRect();
      const cx = ro.left + ro.width / 2, cy = ro.top + ro.height / 2;
      cortina.style.setProperty('--ox', f(cx) + 'px'); cortina.style.setProperty('--oy', f(cy) + 'px');
      logo.style.transformOrigin = `${f(cx - rl.left)}px ${f(cy - rl.top)}px`;
      const r0 = ro.width * 0.37, R = Math.hypot(Math.max(cx, innerWidth - cx), Math.max(cy, innerHeight - cy)) * 1.04;
      abrirHero();
      gsap.fromTo(cortina, { '--iris': r0 + 'px' }, { '--iris': R + 'px', duration: 1.2, ease: 'expo.inOut' });
      gsap.to(logo, { scale: R / r0, duration: 1.2, ease: 'expo.inOut' });
      gsap.to(logo, { opacity: 0, duration: 0.5, delay: 0.55, ease: 'power1.in' });
    }, 2.35);
    tl.to({}, { duration: 1.25 });
  }

  /* ============ 8. cabecera, menú y anclas ============ */
  const cab = $('#cab');
  let pendienteCab = 0;
  const alScroll = () => { pendienteCab = 0; cab.classList.toggle('sc', scrollY > 24); };
  addEventListener('scroll', () => { if (!pendienteCab) pendienteCab = requestAnimationFrame(alScroll); }, { passive: true });
  alScroll();

  const btnMenu = $('#menu-btn'), menu = $('#menu-movil');
  const cerrarMenu = () => {
    document.body.classList.remove('menu');
    btnMenu.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    if (lenis) lenis.start();
  };
  btnMenu.addEventListener('click', () => {
    const abierto = document.body.classList.toggle('menu');
    btnMenu.setAttribute('aria-expanded', String(abierto));
    menu.setAttribute('aria-hidden', String(!abierto));
    if (lenis) abierto ? lenis.stop() : lenis.start();
  });
  $$('a[href^="#"]').forEach((a) => {
    const destino = a.getAttribute('href');
    if (destino.length < 2) return;
    a.addEventListener('click', (e) => {
      if (!$(destino)) return;
      e.preventDefault();
      cerrarMenu();
      irA(destino);
      setTimeout(() => {
        const t = $(destino);
        if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
        t.focus({ preventScroll: true });
      }, 900);
    });
  });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('menu')) { cerrarMenu(); btnMenu.focus(); } });

  /* ============ 9. cookies (y el mando se aparta mientras están) ============ */
  const ck = $('#cookies');
  const LLAVE = 'podogal-cookies';
  const leer = () => { try { return localStorage.getItem(LLAVE); } catch (e) { return null; } };
  const guardar = (v) => { try { localStorage.setItem(LLAVE, v); } catch (e) {} };
  const mando = $('#mando');
  const verMando = () => { if (mando && raiz.classList.contains('revision')) mando.hidden = !ck.hidden; };
  let cookiesPendientes = !leer();
  function mostrarCookies() {
    if (!cookiesPendientes) { verMando(); return; }
    cookiesPendientes = false;
    ck.hidden = false;
    verMando();
  }
  const cerrarCk = (v) => { guardar(v); ck.hidden = true; verMando(); };
  $('#ck-si').addEventListener('click', () => cerrarCk('si'));
  $('#ck-no').addEventListener('click', () => cerrarCk('no'));
  $('#abrir-cookies').addEventListener('click', () => { ck.hidden = false; verMando(); $('#ck-si').focus(); });
  setTimeout(() => { if (raiz.classList.contains('cortina-fuera')) mostrarCookies(); }, 6600);

  /* ============ 10. barra fija en el móvil (solo con observadores) ============ */
  (function barraMovil() {
    const barra = $('#barra');
    if (!barra) return;
    const movil = matchMedia('(max-width: 999px)');
    const dentro = { hero: true, cita: false, pie: false };
    const pintar = () => {
      const ver = movil.matches && !dentro.hero && !dentro.cita && !dentro.pie && !document.body.classList.contains('menu') && ck.hidden;
      barra.classList.toggle('es-visible', ver);
      barra.setAttribute('aria-hidden', String(!ver));
      $$('a', barra).forEach((a) => { a.tabIndex = ver ? 0 : -1; });
      raiz.classList.toggle('con-barra', ver);
    };
    const io = new IntersectionObserver((es) => { es.forEach((e) => { dentro[e.target.dataset.barra] = e.isIntersecting; }); pintar(); });
    [['hero', '.hero'], ['cita', '#motor'], ['pie', '#pie']].forEach(([k, s]) => { const el = $(s); if (el) { el.dataset.barra = k; io.observe(el); } });
    const mo = new MutationObserver(pintar);
    mo.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    mo.observe(ck, { attributes: true, attributeFilter: ['hidden'] });
    movil.addEventListener('change', pintar);
    pintar();
  })();

  /* ============ 11. mapa de Google solo al pedirlo ============ */
  $('#mapa-btn').addEventListener('click', () => {
    const marco = document.createElement('iframe');
    marco.src = 'https://www.google.com/maps?q=' + encodeURIComponent('Rúa Serra de Queixa 6, 32005 Ourense (Clínica Podogal)') + '&z=17&output=embed';
    marco.loading = 'lazy';
    marco.title = 'Mapa con la Clínica Podogal en la Rúa Serra de Queixa, Ourense';
    marco.referrerPolicy = 'no-referrer-when-downgrade';
    $('#mapa').appendChild(marco);
    $('#mapa-consent').remove();
  });

  /* ============ 12. pie: la O llega girando y completa la palabra ============ */
  (function pie() {
    const p = $('#pie');
    if (!motion) { p.classList.add('es-completo'); return; }
    new IntersectionObserver((es, o) => { if (es[0].isIntersecting) { p.classList.add('es-completo'); o.disconnect(); } }, { threshold: 0.5 }).observe($('.pie__marca'));
  })();

  /* ============ 13. MANDO DE MAQUETA (no viaja al cliente) ============ */
  if (mando && raiz.classList.contains('revision')) {
    const botones = $$('button[data-densidad]', mando);
    const pintarMando = () => botones.forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.densidad === 'sobria') === sobria())));
    botones.forEach((b) => b.addEventListener('click', () => {
      raiz.classList.toggle('densidad-sobria', b.dataset.densidad === 'sobria');
      const u = new URL(location.href);
      if (b.dataset.densidad === 'sobria') u.searchParams.set('densidad', 'sobria'); else u.searchParams.delete('densidad');
      history.replaceState(null, '', u);
      if (sobria()) { ojo.reposo(); $$('.iris-foto').forEach((el) => el.classList.add('es-abierta')); }
      pintarMando();
      if (hayGSAP) ScrollTrigger.refresh();
    }));
    pintarMando();
    verMando();
  }
  /* fin del MANDO DE MAQUETA */

  // la cortina arranca al final: cuando se retira usa las cookies, la barra y la cabecera
  lanzarCortina();

  /* ============ 14. resize de verdad (no el de la barra del móvil) ============ */
  let tRes = 0;
  addEventListener('resize', () => {
    if (esBarra()) return;
    clearTimeout(tRes);
    tRes = setTimeout(() => { anchoVista = innerWidth; altoVista = innerHeight; if (hayGSAP) ScrollTrigger.refresh(); }, 200);
  });
  addEventListener('load', () => { if (hayGSAP) ScrollTrigger.refresh(); });
  window.__podogal = { ojo, pasillo, irA };
})();
