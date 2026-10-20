/* ------------------------------------------------------------------
   Horario de la clínica: lo usan el «abierto ahora» (main.js) y la cita (cita.js).
   Fuente: el horario que publicaron en Instagram el 2-sep-2026 («a partir del 8 de septiembre»).
   Festivos: nacionales, Galicia y San Martiño (11-nov, fiesta local de Ourense). Que cierren
   esos días y en agosto (en 2026, del 1 al 16) está por confirmar con la clínica.
   ------------------------------------------------------------------ */
(function () {
  'use strict';
  // por día de la semana (0 = domingo): tramos [abre, cierra] en minutos desde las 0:00
  const TRAMOS = {
    1: [[540, 1050]],
    2: [[570, 810], [930, 1170]],
    3: [[540, 1050]],
    4: [[570, 810], [930, 1170]],
    5: [[540, 1020]],
  };
  // cerrados: nacionales, Galicia (17 de mayo, 25 de julio) y San Martiño en Ourense (11 de noviembre)
  const FESTIVOS = new Set([
    '2026-11-11', '2026-12-08', '2026-12-25',
    '2027-01-01', '2027-01-06', '2027-03-25', '2027-03-26',
    '2027-05-17', '2027-07-25', '2027-08-15',
    '2027-10-12', '2027-11-01', '2027-11-11', '2027-12-06', '2027-12-08', '2027-12-25',
  ]);
  const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const hhmm = (m) => Math.floor(m / 60) + ':' + String(m % 60).padStart(2, '0');
  const tramos = (d) => (FESTIVOS.has(iso(d)) ? null : TRAMOS[d.getDay()] || null);

  // estado ahora: { abierto, texto, corto }
  function estado(ahora) {
    ahora = ahora || new Date();
    const m = ahora.getHours() * 60 + ahora.getMinutes();
    const hoy = tramos(ahora);
    const dentro = hoy && hoy.find(([a, b]) => m >= a && m < b);
    if (dentro) {
      const queda = dentro[1] - m;
      return { abierto: true, pronto: queda <= 30, texto: 'Abierto ahora · hasta las ' + hhmm(dentro[1]) };
    }
    const luego = hoy && hoy.find(([a]) => m < a);
    if (luego) return { abierto: false, texto: 'Cerrado ahora · abrimos a las ' + hhmm(luego[0]) };
    const d = new Date(ahora);
    for (let n = 1; n < 15; n++) {
      d.setDate(d.getDate() + 1);
      const t = tramos(d);
      if (t) return { abierto: false, texto: 'Cerrado ahora · abrimos ' + (n === 1 ? 'mañana' : 'el ' + DIAS[d.getDay()]) + ' a las ' + hhmm(t[0][0]) };
    }
    return { abierto: false, texto: 'Cerrado ahora' };
  }

  window.HORARIO = { TRAMOS, FESTIVOS, DIAS, iso, hhmm, tramos, estado };
})();
