/* Podogal · «Pisa aquí»: mapa de presiones ilustrado de un pie durante el apoyo (canvas 2D, sin librerías).
   Contrato: Podogal.pisada.montar(el, { movimiento }) sustituye el respaldo estático de el y pone data-montado="1". */
(function () {
  'use strict';
  window.Podogal = window.Podogal || {};

  // Escala de calor: azul → cian → amarillo → naranja Podogal
  const PARADAS = [[0, 43, 107, 243], [.34, 63, 208, 201], [.66, 245, 213, 71], [1, 255, 143, 1]];
  const LUT = [];
  for (let i = 0; i < 256; i++) {
    const p = i / 255; let k = 0;
    while (k < PARADAS.length - 2 && p > PARADAS[k + 1][0]) k++;
    const a = PARADAS[k], b = PARADAS[k + 1], s = (p - a[0]) / (b[0] - a[0]);
    LUT.push([1, 2, 3].map(j => Math.round(a[j] + (b[j] - a[j]) * s)));
  }
  const RGB = LUT.map(t => `rgb(${t[0]},${t[1]},${t[2]})`);
  const iTono = q => Math.max(0, Math.min(255, q * 255 | 0));
  const ss = s => s * s * (3 - 2 * s);
  const lim = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  const bump = (p, a, c, b) => p <= a || p >= b ? 0 : p < c ? ss((p - a) / (c - a)) : ss((b - p) / (b - c));

  // El pie derecho visto desde arriba. u: del borde interno (0) al externo (1); v: del talón (0) a la punta (1); f: ventana de la fase del apoyo
  const ZONAS = [
    { k: 'talon', u: .52, v: .12, su: .15, sv: .085, f: [0, .1, .58] },
    { k: 'lat', u: .72, v: .42, su: .085, sv: .15, f: [.06, .34, .74] },
    { k: 'med', u: .42, v: .45, su: .12, sv: .13, f: [.1, .38, .72] },
    { k: 'm1', u: .30, v: .72, su: .085, sv: .055, f: [.3, .76, .97] },
    { k: 'm2', u: .45, v: .745, su: .07, sv: .05, f: [.3, .74, .96] },
    { k: 'm3', u: .57, v: .735, su: .065, sv: .05, f: [.28, .7, .95] },
    { k: 'm4', u: .67, v: .71, su: .06, sv: .05, f: [.26, .66, .93] },
    { k: 'm5', u: .77, v: .675, su: .06, sv: .05, f: [.22, .6, .9] },
    { k: 'h', u: .25, v: .935, su: .075, sv: .045, f: [.5, .88, 1.001] },
    { k: 't2', u: .43, v: .905, su: .042, sv: .03, f: [.45, .82, .99] },
    { k: 't3', u: .555, v: .885, su: .038, sv: .028, f: [.45, .8, .98] },
    { k: 't4', u: .655, v: .858, su: .035, sv: .026, f: [.42, .78, .97] },
    { k: 't5', u: .745, v: .825, su: .033, sv: .025, f: [.4, .74, .95] },
  ];
  const BASE = { talon: 1, lat: .44, med: .06, m1: .85, m2: .95, m3: .8, m4: .62, m5: .5, h: .9, t2: .5, t3: .42, t4: .36, t5: .3 };
  const tipoPie = (cambios, extra = {}) => {
    const w = Object.assign({}, BASE, cambios);
    if (cambios.dedos != null) for (const k of ['t2', 't3', 't4', 't5']) w[k] = BASE[k] * cambios.dedos;
    return Object.assign({ w, talonU: 0, latSu: .085 }, extra);
  };
  const PIES = {
    neutro: tipoPie({}),
    plano: tipoPie({ med: .66, lat: .52, m1: 1.05, h: 1, m5: .4 }, { talonU: -.035, latSu: .1 }),
    cavo: tipoPie({ med: 0, lat: .17, talon: 1.25, m1: .62, m4: .78, m5: .9, h: .55, dedos: .3 }, { latSu: .055 }),
  };
  const PIE_TXT = {
    neutro: { nombre: 'Neutro', desc: 'El talón entra un poco por fuera, el peso avanza por el borde externo y sale por el dedo gordo. El arco no llega a tocar el suelo.' },
    plano: { nombre: 'Pronador, pie plano', desc: 'El arco se hunde y la huella se llena por dentro. El centro de presiones se va hacia el interior del pie: es lo que se llama pronar.' },
    cavo: { nombre: 'Supinador, pie cavo', desc: 'El arco queda alto y la huella se corta por el medio: casi todo el peso cae en el talón y en la parte delantera, y el pie tiende a apoyar por fuera.' },
  };
  const NOMBRE_FASE = f => f < .12 ? 'Contacto del talón' : f < .4 ? 'Apoyo completo' : f < .76 ? 'Despegue del talón' : 'Despegue de los dedos';

  // presión en (u, v): unión suave de las manchas; fase null = huella entera, lo que queda marcado
  const presion = (u, v, pie, fase) => {
    if (u < -.25 || u > 1.25 || v < -.15 || v > 1.12) return 0;
    let resto = 1;
    for (const z of ZONAS) {
      const w = pie.w[z.k]; if (!w) continue;
      const e = fase == null ? .82 : bump(fase, z.f[0], z.f[1], z.f[2]); if (!e) continue;
      const du = (u - z.u - (z.k === 'talon' ? pie.talonU : 0)) / (z.k === 'lat' ? pie.latSu : z.su), dv = (v - z.v) / z.sv;
      const g = du * du + dv * dv; if (g > 10) continue;
      resto *= 1 - lim(w * e * Math.exp(-g / 2));
    }
    return 1 - resto;
  };

  // Una plataforma: rejilla de sensores sobre un canvas
  function plataforma(cv, tamCelda) {
    const ctx = cv.getContext('2d'), off = document.createElement('canvas'), octx = off.getContext('2d'), fondo = document.createElement('canvas');
    const P = { W: 0, H: 0, c: 8, cols: 0, rows: 0, campo: null };
    let dpr = 1, img = null;
    P.medir = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      P.W = cv.clientWidth || 1; P.H = cv.clientHeight || 1;
      cv.width = Math.round(P.W * dpr); cv.height = Math.round(P.H * dpr);
      P.c = tamCelda(P.W, P.H); P.cols = Math.ceil(P.W / P.c); P.rows = Math.ceil(P.H / P.c);
      P.campo = new Float32Array(P.cols * P.rows);
      off.width = P.cols; off.height = P.rows; img = octx.createImageData(P.cols, P.rows);
      fondo.width = cv.width; fondo.height = cv.height;
      const f = fondo.getContext('2d'); f.scale(dpr, dpr); f.fillStyle = '#2A2D32';
      const r = Math.max(.6, P.c * .09);
      for (let y = 0; y < P.rows; y++) for (let x = 0; x < P.cols; x++) f.fillRect(x * P.c + P.c / 2 - r, y * P.c + P.c / 2 - r, r * 2, r * 2);
    };
    P.limpiar = () => P.campo.fill(0);
    // pisar: suma un pie {cx, cy, L, ang, lado} al campo; devuelve el centro de presiones y el reparto talón / medio / delante
    P.pisar = (p, fase, pie, k = 1) => {
      const { c, cols, rows, campo } = P, R = p.L * .62;
      const x0 = Math.max(0, Math.floor((p.cx - R) / c)), x1 = Math.min(cols - 1, Math.ceil((p.cx + R) / c));
      const y0 = Math.max(0, Math.floor((p.cy - R) / c)), y1 = Math.min(rows - 1, Math.ceil((p.cy + R) / c));
      const co = Math.cos(p.ang || 0), si = Math.sin(p.ang || 0), an = .58 * p.L;
      let sp = 0, sx = 0, sy = 0, su = 0; const zonas = [0, 0, 0];
      for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
        const dx = x * c + c / 2 - p.cx, dy = y * c + c / 2 - p.cy;
        const rx = dx * co + dy * si, ry = -dx * si + dy * co;
        let u = rx / an + .5; if (p.lado === 'i') u = 1 - u;
        const v = .5 - ry / p.L;
        const q = presion(u, v, pie, fase) * k; if (q < .004) continue;
        const i = y * cols + x; campo[i] = 1 - (1 - campo[i]) * (1 - q);
        sp += q; sx += q * (x * c + c / 2); sy += q * (y * c + c / 2); su += q * u;
        zonas[v < .32 ? 0 : v < .6 ? 1 : 2] += q;
      }
      return { sp, x: sx / (sp || 1), y: sy / (sp || 1), u: su / (sp || 1), zonas };
    };
    // pintar: el calor suavizado debajo y los sensores encendidos encima
    P.pintar = encima => {
      const { c, cols, rows, campo } = P, d = img.data;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      ctx.fillStyle = '#16171A'; ctx.fillRect(0, 0, P.W, P.H);
      ctx.drawImage(fondo, 0, 0, P.W, P.H);
      for (let i = 0; i < campo.length; i++) {
        const q = campo[i], j = i * 4;
        if (q < .03) { d[j + 3] = 0; continue; }
        const t = LUT[iTono(q)]; d[j] = t[0]; d[j + 1] = t[1]; d[j + 2] = t[2]; d[j + 3] = Math.min(255, q * 520);
      }
      octx.putImageData(img, 0, 0);
      ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = .55;
      ctx.drawImage(off, -c * .5, -c * .5, cols * c + c, rows * c + c);
      ctx.globalCompositeOperation = 'source-over';
      const g = Math.max(.6, c * .14), lado = c - g;
      for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
        const q = campo[y * cols + x]; if (q < .06) continue;
        ctx.fillStyle = RGB[iTono(q)];
        ctx.globalAlpha = Math.min(.95, .25 + q * 1.4);
        ctx.fillRect(x * c + g / 2, y * c + g / 2, lado, lado);
      }
      ctx.globalAlpha = 1;
      if (encima) encima(ctx);
    };
    return P;
  }
  // la línea del centro de presiones, con brillo
  const trazo = (ctx, pts, ancho) => {
    if (pts.length < 2) return;
    ctx.save(); ctx.lineJoin = ctx.lineCap = 'round';
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.strokeStyle = 'rgba(255,143,1,.32)'; ctx.lineWidth = ancho * 3.2; ctx.stroke();
    ctx.strokeStyle = '#FF8F01'; ctx.lineWidth = ancho; ctx.stroke();
    ctx.restore();
  };
  const punto = (ctx, x, y, r) => { ctx.save(); ctx.fillStyle = '#fff'; ctx.shadowColor = '#FF8F01'; ctx.shadowBlur = r * 4; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); };
  const pct = z => { const t = z[0] + z[1] + z[2] || 1; const p = z.map(x => Math.round(x / t * 100)); if (t > 0 && p[0] + p[1] + p[2]) p[2] = 100 - p[0] - p[1]; return p; };

  let n = 0;
  function montar(el, opciones = {}) {
    if (!el || el.dataset.montado === '1') return;
    const reducido = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const movimiento = opciones.movimiento !== false && !reducido;
    const id = 'pisada-' + (++n);
    el.classList.add('pisada');
    el.innerHTML = `
      <div class="pisada-cab">
        <p class="pisada-ant"><i aria-hidden="true"></i>Pisa aquí</p>
        <h3 class="pisada-tit" id="${id}-tit">Tres pies, tres huellas</h3>
        <p class="pisada-intro">Elige un pie y mira cómo carga el peso durante el apoyo, del talón a los dedos: el mapa de calor, la línea naranja del centro de presiones y cuánto lleva cada zona.</p>
      </div>
      <div class="pisada-cuerpo">
        <div class="pisada-pant">
          <div class="pisada-barra" aria-hidden="true"><span>Plataforma<span class="pisada-largo"> · pie derecho</span></span><span>Ilustración</span></div>
          <canvas class="pisada-can" role="img" aria-label="Mapa de presiones del pie derecho"></canvas>
          <div class="pisada-escala" aria-hidden="true"><i></i><span>Más carga</span><span>Menos</span></div>
          <p class="pisada-lect" aria-hidden="true"><span class="pisada-lect-fase">Fase 50 %</span><span class="pisada-lect-rep"></span></p>
        </div>
        <div class="pisada-ctl">
          <div class="pisada-pies" role="group" aria-labelledby="${id}-pies-et"><span class="pisada-et" id="${id}-pies-et">Tipo de pie</span>
            ${Object.keys(PIES).map(k => `<button type="button" data-pie="${k}" aria-pressed="${k === 'neutro'}">${PIE_TXT[k].nombre}</button>`).join('')}
          </div>
          <p class="pisada-desc"></p>
          <div class="pisada-fase">
            <button type="button" class="pisada-play" aria-pressed="false"><span aria-hidden="true">▶</span> Reproducir</button>
            <label for="${id}-fase">Fase del apoyo <output for="${id}-fase">50 %</output></label>
            <input type="range" id="${id}-fase" min="0" max="100" step="1" value="50">
          </div>
          <p class="pisada-nombre">Despegue del talón</p>
          <div class="pisada-reparto">
            ${['Retropié', 'Mediopié', 'Antepié'].map(z => `<div><span>${z}</span><i aria-hidden="true"><b></b></i><output>0 %</output></div>`).join('')}
          </div>
          <dl class="pisada-dl"><dt>Línea de la marcha</dt><dd>—</dd></dl>
          <p class="pisada-vivo" aria-live="polite"></p>
          <p class="pisada-aviso">Ilustración, no es un diagnóstico: el estudio se hace en la clínica, sobre la plataforma de presiones y en vídeo.</p>
        </div>
      </div>`;
    el.setAttribute('aria-labelledby', id + '-tit');
    const q = s => el.querySelector(s);
    const cv = q('.pisada-can'), rango = q('input[type=range]'), play = q('.pisada-play'), salida = q('.pisada-fase output');
    const filas = [...q('.pisada-reparto').children], vivo = q('.pisada-vivo');
    const Z = plataforma(cv, (W, H) => Math.max(3.5, largo(W, H) / 38));
    function largo(W, H) { return Math.min(H * (W < 420 ? .78 : .84), W * 1.55); }
    const pieG = () => ({ cx: Z.W * (Z.W < 420 ? .48 : .47), cy: Z.H * (Z.W < 420 ? .49 : .51), L: largo(Z.W, Z.H), ang: 0, lado: 'd' });
    let tipo = 'neutro', fase = .5, jugando = false, enVista = false, raf = 0, ancho = 0, cop = {};
    // el centro de presiones de cada fase, con la misma presión que se pinta pero muestreada en una rejilla propia de 14 × 30 (barato)
    const copEn = (k, f) => {
      const pie = PIES[k], g = pieG(), an = .58 * g.L;
      let a = 0, su = 0, sv = 0;
      for (let j = 0; j < 30; j++) for (let i = 0; i < 14; i++) {
        const u = -.1 + i * 1.2 / 13, v = -.05 + j * 1.1 / 29, q = presion(u, v, pie, f);
        if (q < .004) continue; a += q; su += q * u; sv += q * v;
      }
      if (a < .5) return null;
      const u = su / a, v = sv / a;
      return [g.cx + (u - .5) * an, g.cy + (.5 - v) * g.L, u];
    };
    const copDe = k => cop[k] || (cop[k] = Array.from({ length: 101 }, (_, i) => copEn(k, i / 100)));
    const media = k => { const v = copDe(k).slice(10, 91).filter(Boolean); return v.reduce((a, p) => a + p[2], 0) / (v.length || 1); };
    const lineaTxt = () => { const d = media(tipo) - media('neutro'); return d < -.015 ? 'Más por dentro' : d > .015 ? 'Más por fuera' : 'Centrada'; };
    let linea = '';
    const pintar = (cifras = 1) => {
      if (!Z.campo && !medir()) return '';   // aún sin medir (se tocó antes de llegar a verse)
      Z.limpiar(); Z.pisar(pieG(), null, PIES[tipo], .2);
      const r = Z.pisar(pieG(), fase, PIES[tipo], 1);
      const pts = copDe(tipo).slice(0, Math.round(fase * 100) + 1).filter(Boolean), ult = pts[pts.length - 1];
      Z.pintar(ctx => { trazo(ctx, pts, Math.max(2, Z.c * .22)); if (ult && r.sp > .3) punto(ctx, ult[0], ult[1], Math.max(4, Z.c * .42)); });
      const z = r.sp > .3 ? pct(r.zonas) : [0, 0, 0], i = Math.round(fase * 100);
      filas.forEach((f, k) => { const v = Math.round(z[k] * cifras); f.querySelector('b').style.width = v + '%'; f.querySelector('output').textContent = v + ' %'; });
      salida.textContent = i + ' %';
      q('.pisada-nombre').textContent = NOMBRE_FASE(fase);
      q('.pisada-lect-fase').textContent = 'Fase ' + String(i).padStart(2, '0') + ' %';
      q('.pisada-lect-rep').textContent = `Retropié ${z[0]} · Mediopié ${z[1]} · Antepié ${z[2]}`;
      const txt = `${PIE_TXT[tipo].nombre}, ${NOMBRE_FASE(fase).toLowerCase()} (${i} % del apoyo): retropié ${z[0]} %, mediopié ${z[1]} %, antepié ${z[2]} %.` + (linea ? ` Línea de la marcha: ${linea.toLowerCase()}.` : '');
      cv.setAttribute('aria-label', 'Mapa de presiones ilustrado del pie derecho. ' + txt);
      return txt;
    };
    const anunciar = txt => { if (!jugando) vivo.textContent = txt; };
    const elegirPie = k => {
      tipo = k;
      q('.pisada-pies').querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.pie === k)));
      q('.pisada-desc').textContent = PIE_TXT[k].desc;
      linea = lineaTxt(); q('.pisada-dl dd').textContent = linea;
      anunciar(pintar());
    };
    q('.pisada-pies').addEventListener('click', e => { const b = e.target.closest('button[data-pie]'); if (b) elegirPie(b.dataset.pie); });
    rango.addEventListener('input', () => { parar(); fase = rango.value / 100; anunciar(pintar()); });
    // reproducir: un apoyo cada 1,7 s con un respiro al final
    let tAnt = 0;
    const bucle = ahora => {
      if (!jugando || !enVista || document.hidden) { raf = 0; return; }
      const dt = tAnt ? Math.min(64, ahora - tAnt) : 0; tAnt = ahora;
      let f = fase + dt / 1700; if (f > 1.25) f = 0;
      fase = Math.min(1, f); rango.value = Math.round(fase * 100); pintar(); fase = f;
      raf = requestAnimationFrame(bucle);
    };
    const seguir = () => { if (jugando && enVista && !document.hidden && !raf) { tAnt = 0; raf = requestAnimationFrame(bucle); } };
    const parar = () => {
      jugando = false; fase = Math.min(1, fase);
      play.setAttribute('aria-pressed', 'false'); play.innerHTML = '<span aria-hidden="true">▶</span> Reproducir';
    };
    play.addEventListener('click', () => {
      if (jugando) { parar(); anunciar(pintar()); return; }
      jugando = true; play.setAttribute('aria-pressed', 'true'); play.innerHTML = '<span aria-hidden="true">❚❚</span> Pausa';
      if (fase >= 1) fase = 0; seguir();
    });
    if (!movimiento) play.hidden = true;
    document.addEventListener('visibilitychange', seguir);
    new IntersectionObserver(es => { enVista = es[0].isIntersecting; seguir(); }).observe(cv);
    // rehacer solo si cambia el ANCHO: la barra del móvil cambia el alto y no debe rehacer nada
    const medir = () => {
      const w = cv.clientWidth; if (!w || w === ancho) return false;
      ancho = w; Z.medir(); cop = {}; linea = ''; q('.pisada-dl dd').textContent = '—'; return true;
    };
    // la línea de la marcha necesita el recorrido entero de dos pies: se calcula después, en su propia tarea
    const calcularLinea = () => { linea = lineaTxt(); q('.pisada-dl dd').textContent = linea; };
    new ResizeObserver(() => { if (ancho && medir()) { calcularLinea(); pintar(); } }).observe(cv);
    q('.pisada-desc').textContent = PIE_TXT.neutro.desc;
    // se dibuja al acercarse a la pantalla, en tareas cortas: medir, pintar y la línea de la marcha, cada una en la suya
    const arranque = new IntersectionObserver(es => {
      if (!es[0].isIntersecting) return; arranque.disconnect();
      requestAnimationFrame(() => { if (medir()) setTimeout(() => { calcularLinea(); pintar(movimiento ? 0 : 1); }, 0); });
    }, { rootMargin: '600px 0px' });
    arranque.observe(el);
    // las lecturas cuentan al aparecer la pieza
    if (movimiento) {
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return; io.disconnect();
        const t1 = performance.now();
        const paso = ahora => { const s = Math.min(1, (ahora - t1) / 900); if (!jugando) pintar(1 - Math.pow(1 - s, 3)); if (s < 1) requestAnimationFrame(paso); };
        requestAnimationFrame(paso);
      }, { threshold: .35 });
      io.observe(el);
    }
    el.dataset.montado = '1';
  }

  Podogal.pisada = { montar };
})();
