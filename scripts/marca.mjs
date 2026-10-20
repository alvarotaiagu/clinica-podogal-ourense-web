/* La O de Podogal (medida sobre su favicon de 206 px: aro grueso a la izquierda, fino a la derecha,
   interior elíptico desplazado y un punto en el centro) → favicons, icono del manifest e img/og.jpg.
   Uso: node scripts/marca.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire('C:/Users/alvar/Desktop/WEBS NEGOCIOS/alvarotaiagu.github.io/');
const sharp = require('sharp');
const RAIZ = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const NARANJA = '#FF8F01', GRAFITO = '#1E1F22', CAL = '#F6F3EE';
export const ARO = 'M6 103a97 97 0 1 0 194 0a97 97 0 1 0-194 0ZM34 102.5a78 87 0 1 0 156 0a78 87 0 1 0-156 0Z';
const o = (color, fondo, pad = 0) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-pad} ${-pad} ${206 + 2 * pad} ${206 + 2 * pad}">`
  + (fondo ? `<rect x="${-pad}" y="${-pad}" width="${206 + 2 * pad}" height="${206 + 2 * pad}" fill="${fondo}"/>` : '')
  + `<path fill="${color}" fill-rule="evenodd" d="${ARO}"/><circle cx="103" cy="103" r="14" fill="${color}"/></svg>`;

fs.mkdirSync(path.join(RAIZ, 'marca'), { recursive: true });
fs.writeFileSync(path.join(RAIZ, 'marca/favicon.svg'), o(NARANJA));
fs.writeFileSync(path.join(RAIZ, 'marca/o-naranja.svg'), o(NARANJA));
await sharp(Buffer.from(o(NARANJA, null, 6))).resize(32, 32).png().toFile(path.join(RAIZ, 'marca/favicon-32.png'));
await sharp(Buffer.from(o(NARANJA, CAL, 40))).resize(180, 180).png().toFile(path.join(RAIZ, 'marca/apple-touch-icon.png'));
await sharp(Buffer.from(o(NARANJA, CAL, 40))).resize(512, 512).png().toFile(path.join(RAIZ, 'marca/icono-512.png'));

// og:image 1200×630: la recepción dentro de la O, sobre cal, como la portada
const foto = await sharp(path.join(RAIZ, 'img/fotos/portada-recepcion-846.jpg')).resize(440, 440).toBuffer();
const mascara = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440" viewBox="0 0 206 206"><ellipse cx="112" cy="102.5" rx="78" ry="87" fill="#fff"/></svg>`);
const dentro = await sharp(foto).composite([{ input: mascara, blend: 'dest-in' }]).png().toBuffer();
const aro = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="440" height="440" viewBox="0 0 206 206"><path fill="${NARANJA}" fill-rule="evenodd" d="${ARO}"/><circle cx="103" cy="103" r="9" fill="${NARANJA}" stroke="${CAL}" stroke-width="4"/></svg>`);
const texto = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <text x="80" y="250" font-family="Georgia, serif" font-size="78" letter-spacing="10" fill="${NARANJA}">PODOGAL</text>
  <text x="84" y="300" font-family="Georgia, serif" font-size="22" letter-spacing="22" fill="${NARANJA}">CLÍNICA</text>
  <text x="80" y="400" font-family="Georgia, serif" font-size="44" fill="${GRAFITO}">Tus pies, en las mejores manos</text>
  <text x="82" y="460" font-family="Arial, sans-serif" font-size="24" fill="#4a4c50">Podología, fisioterapia y psicología · Ourense, desde 2003</text></svg>`);
await sharp({ create: { width: 1200, height: 630, channels: 3, background: CAL } })
  .composite([{ input: texto, left: 0, top: 0 }, { input: dentro, left: 700, top: 95 }, { input: aro, left: 700, top: 95 }])
  .jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(RAIZ, 'img/og.jpg'));
console.log('marca/ e img/og.jpg listos');
