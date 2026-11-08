const META_PIXEL_ID = '606539268407910';

const PIXEL_HEAD = `<script>!function(f,b,e,v,n){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[]}(window,document);fbq('init','${META_PIXEL_ID}');fbq('track','PageView');window.addEventListener('load',function(){var s=document.createElement('script');s.async=!0;s.src='https://connect.facebook.net/en_US/fbevents.js';document.head.appendChild(s)})</script>`;

const PIXEL_NOSCRIPT = `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1"></noscript>`;

const LEAD_SCRIPT = `<script>(function(){var fired=false;function visible(el){if(!el)return false;var cs=window.getComputedStyle(el);return cs.display!=='none'&&cs.visibility!=='hidden'&&el.offsetParent!==null}function check(){if(fired)return;if(!visible(document.getElementById('success-message')))return;fired=true;if(typeof window.fbq==='function'){fbq('track','Lead',{content_name:'Club Leyendas de Bronco'})}}try{new MutationObserver(check).observe(document.documentElement,{attributes:true,childList:true,subtree:true,attributeFilter:['style','class']});document.addEventListener('submit',function(){setTimeout(check,1500);setTimeout(check,4000)},true);check()}catch(e){}})()</script>`;

// Pop-up de inscripcion al Club (reglas en /assets/club-popup.v1.js). Se carga diferido en todas las paginas.
// Hasta el 7 de enero de 2027 sale el aviso de temporada (Navidad) en lugar del pop-up del club; despues vuelve solo el del club.
const POPUP_SCRIPT_CLUB = '<script src="/assets/club-popup.v1.js" defer></script>';
const POPUP_SCRIPT_NAVIDAD = '<script src="/assets/navidad-popup.v1.js" defer></script>';
const POPUP_NAVIDAD_HASTA = 1799298000000;

// Versiona /assets/*.js y *.css (se sirven con caché de 1 año): subir ASSET_V cada vez que cambie site.js o style.css.
const ASSET_V = '20261108';
class BumpAssets { element(e) { for (const a of ['src', 'href']) { const v = e.getAttribute(a); if (v && v.startsWith('/assets/') && /\.(js|css)$/.test(v)) e.setAttribute(a, v + '?v=' + ASSET_V); } } }

class InjectHead { element(element) { element.append(PIXEL_HEAD, { html: true }); } }

class InjectBody {
  constructor(isClub) { this.isClub = isClub; }
  element(element) {
    element.prepend(PIXEL_NOSCRIPT, { html: true });
    element.append((Date.now() < POPUP_NAVIDAD_HASTA ? POPUP_SCRIPT_NAVIDAD : POPUP_SCRIPT_CLUB), { html: true });
    if (this.isClub) element.append(LEAD_SCRIPT, { html: true });
  }
}

// Enlace discreto a la bolsa de trabajo del grupo, al final del pie de pagina de todas las paginas.
const JOBS_LINK = '<div class="gh-jobs" style="text-align:center;font-size:.82rem;opacity:.8;padding:14px 16px 6px"><a href="https://empleos.grupoherrero.com/" style="color:inherit;text-decoration:underline">¿Quieres ser parte del equipo? Trabaja con nosotros</a></div>';

class InjectJobs {
  element(element) {
    element.append(JOBS_LINK, { html: true });
  }
}

async function ghBaseOnRequest(context) {
  const response = await context.next();
  try {
    const url = new URL(context.request.url);
    const isPagesDev = url.hostname.endsWith('.pages.dev');
    const isClub = url.pathname.replace(/\/+$/, '') === '/club-leyendas';
    const contentType = response.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    if (!isPagesDev && !isHtml) return response;
    const headers = new Headers(response.headers);
    if (isPagesDev) headers.set('X-Robots-Tag', 'noindex');
    const out = new Response(response.body, { status: response.status, statusText: response.statusText, headers });
    if (!isHtml) return out;
    return new HTMLRewriter().on('script[src^="/assets/"]', new BumpAssets()).on('link[href^="/assets/"]', new BumpAssets()).on('head', new InjectHead()).on('footer.site-footer', new InjectJobs()).on('body', new InjectBody(isClub)).transform(out);
  } catch (err) {
    return response;
  }
}

// Páginas donde salen las reseñas (ruta -> restaurante en el Sheet)
const GH_REV_PAGES = {"/":"bronco"};
const GH_REV_USTED = false;
const GH_REV_WRAP = "shell";
// Copia fija por si el Sheet no responde (se usa solo como respaldo)
const GH_REV_FALLBACK = {"resenas":[{"restaurante":"bronco","orden":"1","fecha":"2026-10-11","estrellas":"5","nombre":"Ana H.","texto":"Saliendo de sertracen vinimos a desayunar alguito, tenía años de no venir. Me agrado que se conserva la decoración de cabaña. La comida muy buena y la atención estuvo pendiente","mostrar":"SI"},{"restaurante":"bronco","orden":"2","fecha":"2026-04-19","estrellas":"5","nombre":"Carol W.","texto":"Nos encanta venir a desayunar en Broncos. La comida es deliciosa, el servicio excepcional. Es un ambiente familiar donde reconocen muy bien al cliente y conectan con las necesidades de uno. La salonera Maritza Edwards super atenta y supo ganarse a mi bebé que es un clientito dificil. Muy buena!","mostrar":"SI"},{"restaurante":"bronco","orden":"3","fecha":"2026-08-22","estrellas":"5","nombre":"Zaira G.","texto":"La experiencia al entrar al restaurante es 10 de 10 todo ... La comida ,el personal , la satisfacción que sientes al salir por la buena comida .","mostrar":"SI"},{"restaurante":"bronco","orden":"4","fecha":"2025-12-24","estrellas":"5","nombre":"Francisco P.","texto":"Tuve una excelente experiencia en el restaurante. Probé carnes y mariscos, y todo estuvo muy bueno, con sabores bien logrados. El servicio fue excelente, muy atento y profesional. Sin duda, es un lugar totalmente recomendado para una cena fuera.","mostrar":"SI"},{"restaurante":"bronco","orden":"5","fecha":"2026-08-21","estrellas":"5","nombre":"E C.","texto":"La opcion confiable. Estacionamientos, carta variada y accesible, buena atencion! Con familia, pareja, amigos una opcion segura!","mostrar":"SI"},{"restaurante":"bronco","orden":"6","fecha":"2026-09-20","estrellas":"5","nombre":"Viodelda C.","texto":"El salonero Gilberto excelente atención 10000% por eso el rest. Bronco sigue siendo mi restaurante estrella","mostrar":"SI"},{"restaurante":"bronco","orden":"7","fecha":"2026-09-12","estrellas":"5","nombre":"Miguel T.","texto":"Siempre la atencioʻn del personal es rapida y buena y la comida deliciosa y amplio menù.","mostrar":"SI"},{"restaurante":"bronco","orden":"8","fecha":"2026-08-22","estrellas":"5","nombre":"Elenice C.","texto":"Buenas tardes el día de hoy fui a cenar con mi familia la atención que nos brindaron excelente.","mostrar":"SI"},{"restaurante":"bronco","orden":"9","fecha":"2026-09-06","estrellas":"5","nombre":"Norma Q.","texto":"Fui con mi madre a celebrar su cumpleaños, me gustó el menú y un ambiente tranquilo.","mostrar":"SI"},{"restaurante":"bronco","orden":"10","fecha":"2026-01-06","estrellas":"5","nombre":"Luxcho","texto":"La atencion es muy buena, son bastante amables y la comida riquisima la sopa de pecho esta muy buena y el ambiente muy tranquilo","mostrar":"SI"},{"restaurante":"bronco","orden":"11","fecha":"2026-01-22","estrellas":"5","nombre":"Maria L.","texto":"Voy desde bebé y mi recuerdo es buena atención, comida sabrosa y sigue intacto porque cada vez que regreso es igual 😍❣️","mostrar":"SI"}],"resumen":[{"restaurante":"bronco","promedio":"4.4","total":"2055","ver_todas":"https://maps.google.com/maps?cid=11656737389368719343","dejar_resena":"https://search.google.com/local/writereview?placeid=ChIJQ936Be-prI8R7zdWReUMxaE","actualizado":"2026-11-06"}]};

// ---- Reseñas de Google en la página principal ----
// Fuente: Google Sheet "Reseñas web – Grupo Herrero" (pestañas resenas y resumen).
// Si el Sheet no responde, usa la copia fija GH_REV_FALLBACK (arriba).
const GH_REV_SHEET = '18yojHk7JGHwyuQZYAhv7KN4vrgnRSG--UPCbAGAIouE';
const GH_REV_MAX = 6;

function ghCsv(text) {
  const rows = []; let row = []; let f = ''; let q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else { q = false; } }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n') { row.push(f); rows.push(row); row = []; f = ''; }
    else if (c !== '\r') f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const head = (rows.shift() || []).map(h => h.trim().toLowerCase());
  return rows.filter(r => r.some(x => x !== '')).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || '').trim()])));
}

async function ghRevData(context) {
  const base = 'https://docs.google.com/spreadsheets/d/' + GH_REV_SHEET + '/gviz/tq?tqx=out:csv&sheet=';
  try {
    const opt = { cf: { cacheTtl: 3600, cacheEverything: true } };
    const [a, b] = await Promise.all([fetch(base + 'resenas', opt), fetch(base + 'resumen', opt)]);
    const ok = r => r.ok && (r.headers.get('content-type') || '').includes('csv');
    if (ok(a) && ok(b)) {
      const resenas = ghCsv(await a.text()); const resumen = ghCsv(await b.text());
      if (resumen.length) return { resenas, resumen };
    }
  } catch (e) {}
  return GH_REV_FALLBACK;
}

function ghEsc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

const GH_MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

function ghRevHtml(data, slug, usted, wrap) {
  const sum = (data.resumen || []).find(r => r.restaurante === slug);
  if (!sum) return '';
  const list = (data.resenas || [])
    .filter(r => r.restaurante === slug && String(r.mostrar).toUpperCase() === 'SI' && r.texto)
    .sort((x, y) => (Number(x.orden) || 999) - (Number(y.orden) || 999))
    .slice(0, GH_REV_MAX);
  if (list.length > 3 && list.length < 6) list.length = 3; // filas completas de 3
  const total = Number(String(sum.total).replace(/[^0-9]/g, '')) || 0;
  const avg = String(sum.promedio || '').replace(',', '.');
  const cta = usted ? '¿Ya nos visitó? Déjenos su reseña' : '¿Ya nos visitaste? Déjanos tu reseña';
  const css = '<style>.gh-rev-sec{padding:clamp(48px,7vw,88px) 0}.gh-rev-sec h2{margin:0 0 10px}.gh-rev-sum{margin:0 0 24px;opacity:.85}.gh-rev-sum a,.gh-rev-cta a{color:inherit;text-decoration:underline}.gh-rev-list{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.gh-rev{margin:0;padding:22px;border:1px solid rgba(0,0,0,.12);border-radius:14px;background:rgba(255,255,255,.55);display:flex;flex-direction:column;gap:12px}.gh-rev-stars{color:#E8A317;letter-spacing:2px;font-size:1.05rem}.gh-rev blockquote{margin:0;font-size:1rem;line-height:1.55}.gh-rev figcaption{margin-top:auto;font-size:.88rem;opacity:.75}.gh-rev-cta{margin:24px 0 0}@media (max-width:820px){.gh-rev-list{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:85%;overflow-x:auto;scroll-snap-type:x mandatory;padding-bottom:8px}.gh-rev{scroll-snap-align:start}}</style>';
  if (!list.length || !total) {
    if (!sum.dejar_resena) return '';
    const h = usted ? '¿Ya nos visitó?' : '¿Ya nos visitaste?';
    const p = usted ? 'Su reseña en Google ayuda a que más personas nos encuentren.' : 'Tu reseña en Google ayuda a que más gente nos encuentre.';
    const b = usted ? 'Déjenos su reseña en Google' : 'Déjanos tu reseña en Google';
    return css + '<section class="gh-rev-sec" aria-labelledby="gh-rev-t"><div class="' + wrap + '"><h2 id="gh-rev-t">' + h + '</h2><p class="gh-rev-sum">' + p + '</p><p class="gh-rev-cta"><a href="' + ghEsc(sum.dejar_resena) + '" target="_blank" rel="noopener">' + b + '</a></p></div></section>';
  }
  const cards = list.map(r => {
    let t = r.texto; if (t.length > 280) t = t.slice(0, 280).replace(/\s+\S*$/, '') + '…';
    const n = Math.max(1, Math.min(5, Number(r.estrellas) || 5));
    const d = /^\d{4}-\d{2}/.test(r.fecha) ? GH_MESES[Number(r.fecha.slice(5, 7)) - 1] + ' de ' + r.fecha.slice(0, 4) : '';
    return '<figure class="gh-rev"><div class="gh-rev-stars" aria-label="' + n + ' de 5 estrellas">' + '★'.repeat(n) + '</div><blockquote>' + ghEsc(t) + '</blockquote><figcaption>' + ghEsc(r.nombre) + (d ? ' · ' + d : '') + ' · Google</figcaption></figure>';
  }).join('');
  const resumen = '<strong>' + ghEsc(avg) + ' de 5 ★</strong> · ' + total.toLocaleString('en-US') + ' reseñas en Google' + (sum.ver_todas ? ' · <a href="' + ghEsc(sum.ver_todas) + '" target="_blank" rel="noopener">Ver todas</a>' : '');
  return css + '<section class="gh-rev-sec" aria-labelledby="gh-rev-t"><div class="' + wrap + '"><h2 id="gh-rev-t">Lo que dicen en Google</h2><p class="gh-rev-sum">' + resumen + '</p><div class="gh-rev-list">' + cards + '</div>' + (sum.dejar_resena ? '<p class="gh-rev-cta"><a href="' + ghEsc(sum.dejar_resena) + '" target="_blank" rel="noopener">' + cta + '</a></p>' : '') + '</div></section>';
}

class GhRevBefore {
  constructor(st, html) { this.st = st; this.html = html; }
  element(el) { if (!this.st.done) { el.before(this.html, { html: true }); this.st.done = true; } }
}

async function ghAddReviews(context, response) {
  try {
    const url = new URL(context.request.url);
    const path = url.pathname.replace(/index\.html$/, '');
    const slug = GH_REV_PAGES[path] || GH_REV_PAGES[path + '/'];
    if (!slug) return response;
    if (!(response.headers.get('content-type') || '').includes('text/html') || response.status !== 200) return response;
    const data = await ghRevData(context);
    if (!data) return response;
    const html = ghRevHtml(data, slug, GH_REV_USTED, GH_REV_WRAP);
    if (!html) return response;
    const st = { done: false };
    return new HTMLRewriter().on('section.faq-gh', new GhRevBefore(st, html)).on('footer.site-footer', new GhRevBefore(st, html)).transform(response);
  } catch (e) {
    return response;
  }
}

export async function onRequest(context) {
  const response = await ghBaseOnRequest(context);
  return ghAddReviews(context, await ghAddLinks(response));
}

// Enlaces que se agregan al pie de todas las páginas
const GH_LINKS = [{"find":"href=\"/carta/\"","add":"<a href=\"/sopa-de-pecho/\">Sopa de pecho</a>","skip":"href=\"/sopa-de-pecho/\""},{"find":"href=\"/carta/\"","add":"<a href=\"/navidad/\">Navidad</a>","skip":"href=\"/navidad/\""}];

// ---- Enlaces extra en el pie de página (ayudan a que Google encuentre las páginas) ----
// Cada regla: busca el enlace "find" dentro del <footer class="site-footer"> y agrega "add" después
// (o antes, si before = true). Si el pie ya tiene el enlace "skip", no hace nada.
async function ghAddLinks(response) {
  if (!GH_LINKS.length || response.status !== 200 || !(response.headers.get('content-type') || '').includes('text/html')) return response;
  let html;
  try { html = await response.text(); } catch (e) { return response; }
  const headers = new Headers(response.headers);
  headers.delete('content-length');
  try {
    const fs = html.search(/<footer[^>]*class="[^"]*site-footer/);
    if (fs >= 0) {
      let foot = html.slice(fs);
      for (const l of GH_LINKS) {
        if (foot.includes(l.skip)) continue;
        const i = foot.indexOf(l.find);
        if (i < 0) continue;
        const pos = l.before ? foot.lastIndexOf('<a', i) : foot.indexOf('</a>', i) + 4;
        if (pos < 4) continue;
        foot = foot.slice(0, pos) + l.add + foot.slice(pos);
      }
      html = html.slice(0, fs) + foot;
    }
  } catch (e) {}
  return new Response(html, { status: response.status, statusText: response.statusText, headers });
}
