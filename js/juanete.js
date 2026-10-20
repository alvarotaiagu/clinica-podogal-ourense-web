/* Podogal · módulo «Planificar un juanete»
   Podogal.juanete.montar(el, { movimiento }) sustituye el respaldo estático de `el` por la pieza:
   esqueleto esquemático del pie derecho en vista dorsoplantar (dedos arriba, el gordo a la izquierda),
   HVA e IMA en vivo, grado orientativo, las cirugías que opera Navor y su trayectoria.
   Si el respaldo trae una <img>, se reutiliza como retrato de Navor en la trayectoria. */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const RAD = Math.PI / 180;
  const dir = a => [Math.sin(a * RAD), -Math.cos(a * RAD)];       // a: grados desde la vertical, + hacia fuera
  const r1 = n => Math.round(n * 10) / 10;
  const pt = p => r1(p[0]) + ' ' + r1(p[1]);
  const mas = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k];
  const medio = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

  // hueso largo: base ancha, caña estrecha, cabeza redonda. B base, a ángulo, l largo, anchos de base, caña y cabeza
  const hueso = (B, a, l, wb, ws, wh) => {
    const u = dir(a), n = [-u[1], u[0]], r = wh / 2, sc = (l - r) / l, k = .5523 * r;
    const P = (s, w) => [B[0] + u[0] * s * l + n[0] * w, B[1] + u[1] * s * l + n[1] * w];
    const tip = mas(B, u, l), cu = Math.max(.5, sc - 1.1 * r / l);
    const d = `M${pt(P(0, -wb / 2))}C${pt(P(.16, -wb * .44))} ${pt(P(.3, -ws / 2))} ${pt(P(.48, -ws / 2))}C${pt(P(cu, -ws / 2))} ${pt(P(cu + .02, -r))} ${pt(P(sc, -r))}` +
      `C${pt(mas(P(sc, -r), u, k))} ${pt(mas(tip, n, -k))} ${pt(tip)}C${pt(mas(tip, n, k))} ${pt(mas(P(sc, r), u, k))} ${pt(P(sc, r))}` +
      `C${pt(P(cu + .02, r))} ${pt(P(cu, ws / 2))} ${pt(P(.48, ws / 2))}C${pt(P(.3, ws / 2))} ${pt(P(.16, wb * .44))} ${pt(P(0, wb / 2))}` +
      `C${pt(mas(P(0, wb / 2), u, -wb * .16))} ${pt(mas(P(0, -wb / 2), u, -wb * .16))} ${pt(P(0, -wb / 2))}Z`;
    return { d, u, n, B, tip, C: P(sc, 0), P, r, a };
  };
  // curva cerrada suave por puntos (Catmull-Rom)
  const blando = (ps, t = 1) => {
    const N = ps.length; let d = `M${pt(ps[0])}`;
    for (let i = 0; i < N; i++) {
      const p0 = ps[(i - 1 + N) % N], p1 = ps[i], p2 = ps[(i + 1) % N], p3 = ps[(i + 2) % N];
      d += `C${pt([p1[0] + (p2[0] - p0[0]) * t / 6, p1[1] + (p2[1] - p0[1]) * t / 6])} ${pt([p2[0] - (p3[0] - p1[0]) * t / 6, p2[1] - (p3[1] - p1[1]) * t / 6])} ${pt(p2)}`;
    }
    return d + 'Z';
  };
  const elipse = (c, rx, ry, a = 0) => { const u = dir(a), n = [-u[1], u[0]], ps = []; for (let i = 0; i < 10; i++) { const t = i / 10 * Math.PI * 2; ps.push([c[0] + n[0] * Math.cos(t) * rx + u[0] * Math.sin(t) * ry, c[1] + n[1] * Math.cos(t) * rx + u[1] * Math.sin(t) * ry]); } return blando(ps); };

  // tarso, fijo. Cuñas encajadas bajo sus metatarsianos (la intermedia, más corta: la base del 2.º queda metida),
  // navicular con su tuberosidad por dentro y la cara de atrás cóncava para la cabeza del astrágalo,
  // cuboides por fuera hasta el calcáneo, astrágalo montado sobre el calcáneo (en la placa se solapan)
  // y calcáneo largo con la apófisis anterior arriba, el sustentáculo por dentro y la tuberosidad abajo
  const TARSO = {
    cal: blando([[256, 501], [298, 497], [311, 512], [317, 546], [318, 592], [314, 640], [304, 682], [284, 708], [252, 718], [222, 710], [204, 688], [199, 654], [200, 622], [190, 606], [178, 598], [182, 583], [204, 574], [222, 552], [238, 525]], .85),
    tal: blando([[148, 513], [161, 501], [184, 496], [206, 500], [218, 512], [225, 530], [239, 548], [249, 568], [252, 600], [242, 627], [214, 640], [188, 634], [176, 614], [176, 588], [168, 562], [157, 544], [148, 529]], .9),
    nav: blando([[132, 488], [138, 474], [152, 471], [184, 472], [190, 452], [214, 450], [243, 458], [247, 472], [236, 488], [214, 497], [198, 500], [182, 493], [164, 493], [150, 500], [136, 498]], .75),
    cm: blando([[146, 410], [164, 408], [182, 410], [185, 438], [184, 466], [160, 469], [143, 465], [140, 438]], .7),
    ci: blando([[190, 404], [200, 403], [211, 404], [212, 424], [211, 445], [200, 447], [189, 445], [188, 424]], .7),
    cl: blando([[216, 409], [230, 408], [243, 410], [245, 432], [243, 454], [230, 456], [216, 452], [214, 430]], .7),
    cub: blando([[250, 422], [271, 418], [292, 428], [310, 444], [308, 470], [298, 494], [272, 500], [252, 492], [248, 458]], .8),
  };
  const HVA = d => 8 + 44 * d, IMA = d => 6.5 + 13.6 * d;
  const PRE = .682, POST = .023;    // 38° / 16° → 9° / 7°
  const geo = d => {
    const g = {}, J = 5.5, a2 = 3, a1 = a2 - IMA(d), ap = a1 + HVA(d);
    g.m1 = hueso([163, 406], a1, 146, 36, 21, 33);
    g.m2 = hueso([200, 401], a2, 182, 21, 12.5, 19.5);
    g.m3 = hueso([230, 406], 7, 170, 19.5, 12, 18.5);
    g.m4 = hueso([260, 416], 12, 157, 19, 12, 18);
    g.m5 = hueso([294, 432], 19, 144, 23, 12, 17.5);
    // apófisis estiloides del quinto, por fuera de su base
    g.esti = { d: blando([[300, 428], [314, 436], [319, 450], [310, 454], [298, 446]], .8) };
    g.h1 = hueso(mas(g.m1.tip, g.m1.u, J), ap, 60, 28, 18.5, 23);
    g.h2 = hueso(mas(g.h1.tip, g.h1.u, J - 1), ap + 3 + d * 5, 42, 23, 17, 21);
    // dedos menores: falange proximal, media y distal; el juanete los empuja hacia fuera
    for (const [i, l1, l2, l3, w] of [[2, 44, 22, 18, 14.5], [3, 40, 20, 16, 13.5], [4, 36, 17, 15, 13], [5, 30, 13, 13, 12.5]]) {
      const m = g['m' + i], a = m.a * .55 + d * (7 - i) * 2;
      g[`t${i}p`] = hueso(mas(m.tip, m.u, J - 1), a, l1, w + 1.5, w * .74, w * .92);
      g[`t${i}m`] = hueso(mas(g[`t${i}p`].tip, g[`t${i}p`].u, 3.5), a - 1, l2, w * .88, w * .72, w * .84);
      g[`t${i}d`] = hueso(mas(g[`t${i}m`].tip, g[`t${i}m`].u, 3), a - 2, l3, w * .82, w * .62, w * .9);
    }
    // sesamoideos bajo la cabeza del primero: con el juanete quedan hacia fuera
    const S = g.m1.P(.8, 0);
    g.s1 = { d: elipse(mas(S, g.m1.n, -8 + d * 10), 5.5, 8.5, a1) };
    g.s2 = { d: elipse(mas(S, g.m1.n, 8 + d * 12), 5, 8, a1) };
    // la eminencia del juanete, por dentro de la cabeza
    g.bulto = { c: mas(mas(g.m1.C, g.m1.n, -(g.m1.r - 2.5)), g.m1.u, -5), r: 3 + d * 9 };
    g.bulto.d = elipse(g.bulto.c, g.bulto.r, g.bulto.r * 1.25, a1);
    // partes blandas: la silueta del pie que se ve gris en una radiografía
    const ts = i => g[`t${i}d`], hueco = (a, b) => mas(medio(a.tip, b.tip), [0, 1], 16);
    g.blando = blando([
      [240, 734], [196, 720], [162, 680], [140, 616], [126, 540], [122, 470], mas(g.m1.B, g.m1.n, -30), mas(g.m1.P(.55, 0), g.m1.n, -22),
      mas(g.bulto.c, mas(g.m1.n, g.m1.u, -.3), -(g.bulto.r + 10)), mas(g.h1.P(.45, 0), g.h1.n, -17), mas(g.h2.P(.55, 0), g.h2.n, -16), mas(g.h2.tip, g.h2.u, 9),
      mas(g.h2.P(.5, 0), g.h2.n, 13), mas(mas(g.h1.P(.75, 0), g.h1.n, 18), g.h1.u, -6),
      mas(g.t2p.P(.4, 0), g.t2p.n, -9), mas(ts(2).tip, ts(2).u, 8), hueco(ts(2), ts(3)), mas(ts(3).tip, ts(3).u, 8), hueco(ts(3), ts(4)),
      mas(ts(4).tip, ts(4).u, 8), hueco(ts(4), ts(5)), mas(ts(5).tip, ts(5).u, 8), mas(g.t5p.P(.5, 0), g.t5p.n, 12),
      mas(g.m5.C, g.m5.n, 15), [328, 458], [330, 520], [331, 600], [322, 670], [292, 722]
    ], .95);
    g.hva = HVA(d); g.ima = IMA(d);
    return g;
  };
  const ORDEN = ['cal', 'tal', 'nav', 'cub', 'cl', 'ci', 'cm', 'esti', 'm5', 'm4', 'm3', 'm2', 'm1', 'bulto', 's1', 's2', 'h1', 'h2',
    't2p', 't2m', 't2d', 't3p', 't3m', 't3d', 't4p', 't4m', 't4d', 't5p', 't5m', 't5d'];
  // zonas que ilumina cada cirugía (huesos) y lo que se dibuja encima
  const ZONAS = {
    juanete: { h: ['m1', 'bulto', 'h1', 'h2', 's1', 's2'] },
    sastre: { h: ['m5', 't5p'], x: g => `<path class="juanete-marca pulso" d="${elipse(mas(g.m5.C, g.m5.n, g.m5.r + 1), 6, 8, g.m5.a)}"/>` },
    martillo: { h: ['t2p', 't2m', 't2d', 't3p', 't3m', 't3d'] },
    morton: { h: [], x: g => `<path class="juanete-marca pulso" d="${elipse(mas(medio(g.m3.C, g.m4.C), g.m3.u, -16), 4.5, 13, 9)}"/>` },
    metatarsalgia: { h: ['m2', 'm3', 'm4'], x: g => ['m2', 'm3', 'm4'].map(k => `<circle class="juanete-marca pulso" cx="${r1(g[k].C[0])}" cy="${r1(g[k].C[1])}" r="12"/>`).join('') },
    espolon: { h: ['cal'], x: g => `<path class="juanete-marca fascia" d="M248 698Q${pt(mas(g.m1.B, [0, 1], 70))} ${pt(g.m1.C)}M248 698Q236 480 ${pt(g.m3.C)}M248 698Q306 490 ${pt(g.m5.C)}"/><circle class="juanete-marca pulso" cx="248" cy="700" r="10"/>` },
    una: { h: ['h2'], x: g => `<path class="juanete-marca linea" d="M${pt(mas(g.h2.P(.5, 0), g.h2.n, -10))}Q${pt(mas(mas(g.h2.tip, g.h2.u, 2), g.h2.n, -9))} ${pt(mas(g.h2.tip, g.h2.u, 3))}"/><path class="juanete-marca linea" d="M${pt(mas(g.h2.P(.5, 0), g.h2.n, 10))}Q${pt(mas(mas(g.h2.tip, g.h2.u, 2), g.h2.n, 9))} ${pt(mas(g.h2.tip, g.h2.u, 3))}" opacity=".5"/>` },
    diabetico: { h: [], x: g => `<circle class="juanete-marca pulso" cx="${r1(g.m1.C[0])}" cy="${r1(g.m1.C[1])}" r="17"/><circle class="juanete-marca pulso" cx="${r1(g.m5.C[0])}" cy="${r1(g.m5.C[1])}" r="12"/><circle class="juanete-marca pulso" cx="248" cy="700" r="16"/>` },
    quistes: { h: [], x: g => [mas(g.m2.P(.5, 0), g.m2.n, 15), mas(g.h1.P(.3, 0), g.h1.n, -15), mas(g.m4.C, g.m4.u, -26)].map(c => `<circle class="juanete-marca fascia" cx="${r1(c[0])}" cy="${r1(c[1])}" r="7"/>`).join('') },
  };
  // textos de su web (podogal.com/podologia), contados en llano
  const OPS = [
    { k: 'juanete', n: 'Juanete', t: 'Juanete (hallux valgus)', x: 'Hay más de 150 técnicas descritas, así que cada caso se estudia: la biomecánica del pie, la edad, la actividad. Hoy no hace falta hospitalización: se vuelve a casa con calzado postoperatorio y las revisiones se hacen en la clínica.' },
    { k: 'sastre', n: 'Juanete de sastre', t: 'Juanete de sastre', x: 'Lo mismo, pero en el quinto dedo (quintus varus). También aquí hay varias técnicas descritas, y se elige según el pie.' },
    { k: 'martillo', n: 'Dedos en martillo', t: 'Dedos en martillo', x: 'Deformidades que acaban en callos. La técnica depende de la causa: desde alargar un tendón hasta una artroplastia o una osteotomía, siempre después de explorar el pie y de las pruebas de imagen.' },
    { k: 'morton', n: 'Neuroma de Morton', t: 'Neuroma de Morton', x: 'Una rama del nervio engrosada entre el tercer y el cuarto metatarsiano. Da un dolor ardiente que sube con el zapato estrecho y el tacón. La cirugía descomprime la zona o retira la parte afectada del nervio.' },
    { k: 'metatarsalgia', n: 'Metatarsalgia', t: 'Metatarsalgia', x: 'Dolor en la planta, bajo las articulaciones de los metatarsianos. Cuando hay que operar, lo habitual son osteotomías de los metatarsianos y actuar sobre las partes blandas.' },
    { k: 'espolon', n: 'Espolón y fascitis', t: 'Espolón y fascitis plantar', x: 'Van de la mano y suelen tener las mismas causas. Las soluciones quirúrgicas son variadas, y cada año se describen nuevas.' },
    { k: 'una', n: 'Uña encarnada', t: 'Uña encarnada', x: 'Una técnica con 24 horas de reposo relativo que no quita la uña entera: se elimina solo el lado afectado, para siempre. Si hace falta, con reconstrucción estética del dedo.' },
    { k: 'diabetico', n: 'Úlceras y pie diabético', t: 'Úlceras y pie diabético', x: 'Navor tiene un máster en pie diabético (UCM). En septiembre de 2026 le premiaron en el VI Congreso de la Sociedad Gallega de Heridas por un caso clínico centrado en evitar una amputación y conservar la función del pie.' },
    { k: 'quistes', n: 'Quistes y verrugas', t: 'Quistes, verrugas y tumores benignos', x: 'Se retiran y se mandan al patólogo para clasificarlos. En las verrugas plantares, la cirugía se reserva para los casos más difíciles.' },
  ];
  // trayectoria: solo lo que consta en su web y en su Instagram; fechas solo donde las hay
  const TRAY = [
    ['Formación', 'Diplomado en Enfermería y en Podología'],
    ['Universitat de Barcelona', 'Máster en Podología Quirúrgica'],
    ['Estados Unidos', 'Cirugía junto al Dr. Cicchinelli'],
    ['Atlanta', 'Una charla con el Dr. McGlamry, en su casa'],
    ['UCM · 2020-21', 'Máster en Pie Diabético'],
    ['Pie y tobillo', 'Ecografía y técnicas ecoguiadas'],
    ['Vigo · septiembre 2026', 'Premio en el VI Congreso de la Sociedad Gallega de Heridas', true],
  ];
  const grado = (h, i) => h > 40 || i > 16 ? 'grave' : h >= 20 || i >= 12 ? 'moderado' : h >= 15 || i >= 9 ? 'leve' : 'normal';
  const VB = [84, 92, 262, 652];
  let cuenta = 0;

  const montar = (el, opts = {}) => {
    if (!el || el.dataset.montado === '1') return;
    const MOV = opts.movimiento !== false && !matchMedia('(prefers-reduced-motion: reduce)').matches;
    const u = 'j' + (++cuenta);
    const foto = el.querySelector('img');
    const fotoSrc = foto && (foto.currentSrc || foto.src), fotoAlt = foto ? foto.alt : '';

    el.classList.add('juanete');
    if (!MOV) el.classList.add('juanete-quieto');
    el.innerHTML = `<div class="juanete-cuerpo">
      <div class="juanete-placa">
        <div class="juanete-cab"><span>DP · pie derecho · esquema</span><span class="juanete-grado" aria-hidden="true"></span></div>
        <svg class="juanete-svg" viewBox="${VB.join(' ')}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Esquema del esqueleto del pie derecho visto desde arriba, con las medidas del juanete. Se puede arrastrar el dedo gordo.">
          <defs><filter id="${u}b" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <linearGradient id="${u}g" gradientUnits="userSpaceOnUse" x1="0" y1="600" x2="0" y2="744"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></linearGradient>
            <mask id="${u}m" maskUnits="userSpaceOnUse" x="0" y="0" width="420" height="760"><rect width="420" height="760" fill="url(#${u}g)"/></mask></defs>
          <path class="juanete-blando" mask="url(#${u}m)"/>
          <g class="juanete-huesos" filter="url(#${u}b)" mask="url(#${u}m)"></g>
          <g class="juanete-fant"></g><g class="juanete-extra"></g><g class="juanete-med"></g>
          <g class="juanete-asa"><circle class="anillo" r="13"/><circle class="nucleo" r="13"/></g>
        </svg>
        <div class="juanete-ctrl">
          <label for="${u}r">Desviación del dedo gordo</label>
          <input type="range" id="${u}r" min="0" max="100" step="1" value="${Math.round(PRE * 100)}">
          <div class="juanete-lect">
            <div><span>HVA · metatarsiano y falange</span><b class="juanete-hva">38°</b></div>
            <div><span>IMA · entre metatarsianos</span><b class="juanete-ima">16°</b></div>
          </div>
          <p class="juanete-nota">Grado orientativo según Mann y Coughlin. No es un diagnóstico: eso lo da la exploración en consulta.</p>
          <button type="button" class="juanete-btn">Ver la corrección</button>
          <p class="juanete-vivo" aria-live="polite"></p>
        </div>
      </div>
      <div class="juanete-lista">
        <p class="juanete-sub">Lo que opera Navor</p>
        <div class="juanete-ops" role="group" aria-label="Cirugías del pie"></div>
        <div class="juanete-det" aria-live="polite"><h4 class="juanete-tit"></h4><p class="juanete-txt"></p></div>
        <p class="juanete-anest">Con anestesia local y, cuando la cirugía lo pide, sedación en quirófano con anestesiólogo.</p>
      </div>
      <div class="juanete-tray">
        ${fotoSrc ? `<figure><img src="${fotoSrc}" alt="${fotoAlt.replace(/"/g, '&quot;')}" loading="lazy" decoding="async"><figcaption>Navor Pereira Losada<br>Podólogo y enfermero · codirector</figcaption></figure>` : '<p class="juanete-quien">Navor Pereira Losada<br><span>Podólogo y enfermero · codirector</span></p>'}
        <ol class="juanete-hitos">${TRAY.map(([a, b, h]) => `<li${h ? ' class="hito"' : ''}><span>${a}</span><b>${b}</b></li>`).join('')}</ol>
      </div></div>`;
    el.dataset.montado = '1';

    const $ = s => el.querySelector(s);
    const svg = $('.juanete-svg'), gH = $('.juanete-huesos'), bl = $('.juanete-blando'), fan = $('.juanete-fant'), ext = $('.juanete-extra'), med = $('.juanete-med'), asa = $('.juanete-asa');
    const rango = $('input[type=range]'), gradoEl = $('.juanete-grado'), btn = $('.juanete-btn'), vivo = $('.juanete-vivo');
    const H = {};
    for (const k of ORDEN) { const p = document.createElementNS(NS, 'path'); p.setAttribute('class', 'juanete-h'); gH.appendChild(p); H[k] = p; }
    for (const k in TARSO) H[k].setAttribute('d', TARSO[k]);
    { const g0 = geo(PRE); fan.innerHTML = ['m1', 'bulto', 'h1', 'h2'].map(k => `<path d="${g0[k].d}"/>`).join(''); }

    let zona = null, ultimo = null, dP = PRE, anim = 0, antes = PRE, gradoPrevio = '';
    const dibujar = d => {
      const g = ultimo = geo(d);
      for (const k of ORDEN) if (!TARSO[k]) H[k].setAttribute('d', g[k].d);
      bl.setAttribute('d', g.blando);
      ext.innerHTML = zona && ZONAS[zona].x ? ZONAS[zona].x(g) : '';
      const X = g.h1.B, B1 = g.m1.B, a1 = g.m1.a, ap = g.h1.a, a2 = g.m2.a, R1 = 40, R2 = 74;
      const l = (p, q, c) => `<line class="${c}" pathLength="1" x1="${r1(p[0])}" y1="${r1(p[1])}" x2="${r1(q[0])}" y2="${r1(q[1])}"/>`;
      const arco = (C, aA, aB, R) => `<path class="juanete-arco" pathLength="1" d="M${pt(mas(C, dir(aA), R))}A${R} ${R} 0 0 1 ${pt(mas(C, dir(aB), R))}"/>`;
      const rot = (p, t, anc) => `<text class="juanete-rot" x="${r1(p[0])}" y="${r1(p[1])}" text-anchor="${anc}">${t}</text>`;
      med.innerHTML =
        l(mas(B1, g.m1.u, -14), mas(X, g.m1.u, 74), 'juanete-eje') + l(mas(g.m2.B, g.m2.u, -14), mas(g.m2.tip, g.m2.u, 30), 'juanete-eje') +
        l(mas(X, g.h1.u, -22), mas(X, g.h1.u, 104), 'juanete-eje') + l(B1, mas(B1, dir(a2), 96), 'juanete-ref') +
        arco(X, a1, ap, R1) + arco(B1, a1, a2, R2) +
        rot(mas(X, dir(a1 - 30), 46), `HVA ${Math.round(g.hva)}°`, 'end') + rot(mas(B1, dir(a1 - 22), 78), `IMA ${Math.round(g.ima)}°`, 'end');
      asa.setAttribute('transform', `translate(${r1(g.h2.tip[0] - g.h2.u[0] * 12)} ${r1(g.h2.tip[1] - g.h2.u[1] * 12)})`);
    };
    const poner = d => {
      dP = Math.min(1, Math.max(0, d)); dibujar(dP);
      const h = Math.round(HVA(dP)), i = Math.round(IMA(dP)), gr = grado(h, i);
      $('.juanete-hva').textContent = h + '°'; $('.juanete-ima').textContent = i + '°';
      gradoEl.textContent = gr; gradoEl.className = 'juanete-grado ' + gr;
      rango.value = Math.round(dP * 100);
      rango.setAttribute('aria-valuetext', `ángulo del juanete ${h} grados, ${gr}`);
      btn.textContent = dP < .1 ? 'Volver al juanete' : 'Ver la corrección';
      if (gr !== gradoPrevio) { if (gradoPrevio) vivo.textContent = `Grado orientativo: ${gr}.`; gradoPrevio = gr; }
    };
    rango.addEventListener('input', () => { cancelAnimationFrame(anim); poner(rango.value / 100); });

    // arrastrar el dedo gordo: el ángulo del puntero desde la articulación da la desviación
    const aSvg = e => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
    let arrastrando = false;
    svg.addEventListener('pointerdown', e => {
      const g = ultimo, q = aSvg(e), c = medio(g.h1.C, g.h2.tip);
      if (Math.hypot(q.x - c[0], q.y - c[1]) > 52) return;
      arrastrando = true; cancelAnimationFrame(anim); svg.setPointerCapture(e.pointerId); svg.classList.add('arrastra'); e.preventDefault();
    });
    svg.addEventListener('pointermove', e => {
      if (!arrastrando) return;
      const X = ultimo.h1.B, q = aSvg(e), ang = Math.atan2(q.x - X[0], -(q.y - X[1])) / RAD;
      poner((ang - 4.5) / 30.4);      // dirección de la falange: 4,5° + 30,4°·d
    });
    const soltar = () => { arrastrando = false; svg.classList.remove('arrastra'); };
    svg.addEventListener('pointerup', soltar); svg.addEventListener('pointercancel', soltar);

    btn.addEventListener('click', () => {
      cancelAnimationFrame(anim);
      const desde = dP, hasta = dP < .1 ? (antes > .1 ? antes : PRE) : POST;
      if (hasta === POST) antes = dP;
      if (!MOV) return poner(hasta);
      const ini = performance.now(), ms = 1800;
      const f = ahora => { const x = Math.min(1, (ahora - ini) / ms); poner(desde + (hasta - desde) * ease(x)); if (x < 1) anim = requestAnimationFrame(f); };
      anim = requestAnimationFrame(f);
    });

    const ops = $('.juanete-ops');
    const elegir = k => {
      const o = OPS.find(o => o.k === k);
      [...ops.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === k));
      $('.juanete-tit').textContent = o.t; $('.juanete-txt').textContent = o.x;
      zona = k;
      for (const h of ORDEN) H[h].classList.toggle('luz', ZONAS[k].h.includes(h));
      dibujar(dP);
    };
    OPS.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.dataset.k = o.k; b.textContent = o.n; b.addEventListener('click', () => elegir(o.k)); ops.appendChild(b); });
    poner(PRE); elegir('juanete');

    // entrada la primera vez que se ve: la placa se revela con una barra de luz y se trazan las medidas
    if (MOV && 'IntersectionObserver' in window) {
      const placa = $('.juanete-placa');
      placa.classList.add('juanete-espera');
      const io = new IntersectionObserver(es => {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        placa.classList.remove('juanete-espera');
        const barra = document.createElement('i'); barra.className = 'juanete-barra'; placa.appendChild(barra);
        const curva = 'cubic-bezier(.45,0,.55,1)';
        svg.animate([{ clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)' }], { duration: 1100, easing: curva });
        barra.animate([{ top: '0%', opacity: 0 }, { top: '4%', opacity: 1, offset: .06 }, { top: '92%', opacity: 1, offset: .94 }, { top: '96%', opacity: 0 }], { duration: 1100, easing: curva }).finished.then(() => barra.remove(), () => barra.remove());
        med.querySelectorAll('line, path').forEach((e, i) => e.animate([{ strokeDasharray: '1', strokeDashoffset: 1 }, { strokeDasharray: '1', strokeDashoffset: 0 }], { duration: 600, delay: 900 + i * 80, easing: 'cubic-bezier(.65,0,.35,1)', fill: 'backwards' }));
        med.querySelectorAll('text').forEach(e => e.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: 1300, fill: 'backwards' }));
      }, { threshold: .35 });
      io.observe(placa);
    }
  };

  window.Podogal = window.Podogal || {};
  window.Podogal.juanete = { montar };
})();
